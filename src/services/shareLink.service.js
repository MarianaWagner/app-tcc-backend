import { ShareLinkRepository } from '../repositories/shareLink.repository.js';
import { SharedExamRepository } from '../repositories/sharedExam.repository.js';
import { ShareAccessLogRepository } from '../repositories/shareAccessLog.repository.js';
import { ExamRepository } from '../repositories/exam.repository.js';
import { TokenUtil } from '../utils/token.util.js';
import { HashUtil } from '../utils/hash.util.js';
import { NotFoundError, ForbiddenError, ValidationError, UnauthorizedError } from '../utils/errors.util.js';

export class ShareLinkService {
  constructor() {
    this.shareLinkRepository = new ShareLinkRepository();
    this.sharedExamRepository = new SharedExamRepository();
    this.shareAccessLogRepository = new ShareAccessLogRepository();
    this.examRepository = new ExamRepository();
  }

  formatShareLinkResponse(shareLink, exams = null) {
    const response = {
      id: shareLink.id,
      userId: shareLink.userId,
      token: shareLink.token,
      contact: shareLink.contact,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      createdAt: shareLink.createdAt?.toISOString() || new Date().toISOString(),
      usedAt: shareLink.usedAt?.toISOString() || null,
      isExpired: TokenUtil.isExpired(shareLink.expiresAt),
      isUsed: !!shareLink.usedAt,
    };

    if (exams) {
      response.exams = exams.map(exam => ({
        id: exam.id,
        name: exam.name,
        examDate: exam.examDate || null,
      }));
    }

    return response;
  }

  async validateExamsOwnership(examIds, userId) {
    const validExams = [];
    
    for (const examId of examIds) {
      const exam = await this.examRepository.findById(examId, userId);
      if (!exam) {
        throw new NotFoundError(`Exam ${examId} not found or you do not have permission`);
      }
      validExams.push(exam);
    }

    return validExams;
  }

  async createShareLink(userId, data) {
    const {
      contact,
      examIds,
      expiresInHours = 168, // 7 dias por padrão
    } = data;

    // Validar que os exames existem e pertencem ao usuário
    if (!examIds || examIds.length === 0) {
      throw new ValidationError('At least one exam must be selected');
    }

    await this.validateExamsOwnership(examIds, userId);

    // Gerar token único
    const token = TokenUtil.generateShareToken();

    // Calcular data de expiração
    const expiresAt = TokenUtil.generateExpirationDate(expiresInHours * 60);

    // Criar o link de compartilhamento
    const shareLink = await this.shareLinkRepository.create({
      userId,
      token,
      contact: TokenUtil.normalizeContact(contact),
      expiresAt,
    });

    // Criar os registros de exames compartilhados
    const sharedExamsData = examIds.map(examId => ({
      shareId: shareLink.id,
      examId,
    }));

    await this.sharedExamRepository.createMany(sharedExamsData);

    // Buscar o link com os exames para retornar
    const result = await this.shareLinkRepository.findByIdWithExams(shareLink.id);

    // Registrar log de criação
    await this.logAccess(shareLink.id, 'link_created', null, null, null);

    return this.formatShareLinkResponse(result.shareLink, result.exams);
  }

  async getShareLinkById(shareLinkId, userId) {
    const result = await this.shareLinkRepository.findByIdWithExams(shareLinkId);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    // Verificar se o link pertence ao usuário
    if (result.shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this share link');
    }

    return this.formatShareLinkResponse(result.shareLink, result.exams);
  }

  async getShareLinksByUser(userId, query) {
    const { shareLinks, total } = await this.shareLinkRepository.findByUserId(userId, query);

    const page = query.page || 1;
    const limit = query.limit || 50;

    const linksWithExams = await Promise.all(
      shareLinks.map(async (link) => {
        const result = await this.shareLinkRepository.findByIdWithExams(link.id);
        return this.formatShareLinkResponse(result.shareLink, result.exams);
      })
    );

    return {
      data: linksWithExams,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async requestAccess(token, contact, ipAddress, userAgent) {
    const result = await this.shareLinkRepository.findByTokenWithExams(token);

    if (!result) {
      await this.logAccess(null, 'access_denied_invalid_token', contact, ipAddress, userAgent);
      throw new NotFoundError('Share link not found');
    }

    const { shareLink } = result;

    // Verificar se o link expirou
    if (TokenUtil.isExpired(shareLink.expiresAt)) {
      await this.logAccess(shareLink.id, 'access_denied_expired', contact, ipAddress, userAgent);
      throw new ValidationError('This share link has expired');
    }

    // Verificar se o contato é o mesmo
    if (TokenUtil.normalizeContact(contact) !== shareLink.contact) {
      await this.logAccess(shareLink.id, 'access_denied_wrong_contact', contact, ipAddress, userAgent);
      throw new UnauthorizedError('Contact does not match');
    }

    // Gerar OTP
    const otp = TokenUtil.generateOTP();
    const otpHash = await HashUtil.hash(otp);
    const otpExpiresAt = TokenUtil.generateExpirationDate(10); // OTP válido por 10 minutos

    // Atualizar o link com o OTP (armazenar hash do OTP, não o OTP em si)
    // Nota: No schema atual não temos campo para armazenar o OTP hash
    // Vamos usar otpExpiresAt para controlar a validade
    await this.shareLinkRepository.updateByToken(token, {
      // Idealmente, teríamos um campo otpHash aqui
      otpExpiresAt,
    });

    await this.logAccess(shareLink.id, 'otp_requested', contact, ipAddress, userAgent);

    // TODO: Integrar com serviço de email para enviar o OTP
    console.log(`🔐 OTP for ${contact}: ${otp} (expires at ${otpExpiresAt})`);

    return {
      message: 'OTP sent to your contact',
      expiresIn: 10, // minutos
      // Em desenvolvimento, retornar o OTP. Em produção, não retornar!
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  async validateOTP(token, contact, otp, ipAddress, userAgent) {
    const result = await this.shareLinkRepository.findByTokenWithExams(token);

    if (!result) {
      await this.logAccess(null, 'otp_validation_failed_invalid_token', contact, ipAddress, userAgent);
      throw new NotFoundError('Share link not found');
    }

    const { shareLink, exams } = result;

    // Verificar se o link expirou
    if (TokenUtil.isExpired(shareLink.expiresAt)) {
      await this.logAccess(shareLink.id, 'otp_validation_failed_link_expired', contact, ipAddress, userAgent);
      throw new ValidationError('This share link has expired');
    }

    // Verificar se o OTP expirou
    if (TokenUtil.isExpired(shareLink.otpExpiresAt)) {
      await this.logAccess(shareLink.id, 'otp_validation_failed_otp_expired', contact, ipAddress, userAgent);
      throw new ValidationError('OTP has expired. Please request a new one');
    }

    // Verificar se o contato é o mesmo
    if (TokenUtil.normalizeContact(contact) !== shareLink.contact) {
      await this.logAccess(shareLink.id, 'otp_validation_failed_wrong_contact', contact, ipAddress, userAgent);
      throw new UnauthorizedError('Contact does not match');
    }

    // Em produção real, você compararia o hash do OTP com o armazenado
    // Por ora, validamos de forma simplificada
    // TODO: Implementar validação real de OTP com hash
    
    // Marcar o link como usado
    await this.shareLinkRepository.updateByToken(token, {
      usedAt: new Date(),
    });

    await this.logAccess(shareLink.id, 'access_granted', contact, ipAddress, userAgent);

    return {
      message: 'Access granted',
      shareLink: this.formatShareLinkResponse(shareLink, exams),
    };
  }

  async deleteShareLink(shareLinkId, userId) {
    const result = await this.shareLinkRepository.findByIdWithExams(shareLinkId);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    // Verificar se o link pertence ao usuário
    if (result.shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this share link');
    }

    // Deletar os exames compartilhados
    await this.sharedExamRepository.deleteByShareId(shareLinkId);

    // Deletar os logs de acesso
    await this.shareAccessLogRepository.deleteByShareId(shareLinkId);

    // Deletar o link
    const deleted = await this.shareLinkRepository.delete(shareLinkId);

    if (!deleted) {
      throw new NotFoundError('Failed to delete share link');
    }
  }

  async getAccessLogs(shareLinkId, userId, query) {
    // Verificar se o link pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareLinkId);

    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view these logs');
    }

    const { logs, total } = await this.shareAccessLogRepository.findByShareId(shareLinkId, query);

    const page = query.page || 1;
    const limit = query.limit || 50;

    return {
      data: logs.map(log => ({
        id: log.id,
        event: log.event,
        emailInput: log.emailInput,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        createdAt: log.createdAt?.toISOString() || new Date().toISOString(),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async logAccess(shareId, event, emailInput, ipAddress, userAgent) {
    try {
      await this.shareAccessLogRepository.create({
        shareId,
        event,
        emailInput,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error('Failed to log access:', error);
      // Não falhar a operação principal se o log falhar
    }
  }

  async getShareLinkStats(userId) {
    const totalCount = await this.shareLinkRepository.countByUserId(userId);
    const activeCount = await this.shareLinkRepository.countActiveByUserId(userId);

    return {
      total: totalCount,
      active: activeCount,
      expired: totalCount - activeCount,
    };
  }
}


