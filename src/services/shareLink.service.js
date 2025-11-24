import { ShareLinkRepository } from '../repositories/shareLink.repository.js';
import { ShareAccessLogRepository } from '../repositories/shareAccessLog.repository.js';
import { ExamRepository } from '../repositories/exam.repository.js';
import { ExamMediaRepository } from '../repositories/examMedia.repository.js';
import { SharedExamRepository } from '../repositories/sharedExam.repository.js';
import { TokenUtil } from '../utils/token.util.js';
import { HashUtil } from '../utils/hash.util.js';
import { JwtUtil } from '../utils/jwt.util.js';
import { RateLimitUtil } from '../utils/rateLimit.util.js';
import { MailService } from './mail.service.js';
import { ENV } from '../config/env.js';
import { NotFoundError, ForbiddenError, ValidationError, UnauthorizedError } from '../utils/errors.util.js';

export class ShareLinkService {
  constructor() {
    this.shareLinkRepository = new ShareLinkRepository();
    this.shareAccessLogRepository = new ShareAccessLogRepository();
    this.examRepository = new ExamRepository();
    this.examMediaRepository = new ExamMediaRepository();
    this.sharedExamRepository = new SharedExamRepository();
    this.mailService = new MailService();
  }

  ensureShareLinkActiveOrThrow(shareLink, options = {}) {
    if (shareLink.revokedAt) {
      throw new ValidationError('This share link has been revoked');
    }

    if (TokenUtil.isExpired(shareLink.expiresAt)) {
      throw new ValidationError('This share link has expired');
    }

    // Note: maxUses check removed - links can be accessed unlimited times if they have the link
  }

  buildFileDownloadUrl(code, mediaId, token) {
    const basePath = `/s/${code}/files/${mediaId}/download`;
    if (!token) {
      return basePath;
    }

    const params = new URLSearchParams({ token });
    return `${basePath}?${params.toString()}`;
  }

  buildDownloadAllUrl(code, token) {
    const basePath = `/s/${code}/download-all`;
    if (!token) {
      return basePath;
    }

    const params = new URLSearchParams({ token });
    return `${basePath}?${params.toString()}`;
  }

  async buildExamsWithFiles(exams, code, token = null) {
    return Promise.all(
      exams.map(async (exam) => {
        const { medias } = await this.examMediaRepository.findByExamId(exam.id, {
          page: 1,
          limit: 100,
        });

        const files = medias.map((media) => ({
          id: media.id,
          mediaType: media.mediaType,
          fileName: media.metadata?.originalName || null,
          fileSize: media.metadata?.size || null,
          downloadUrl: this.buildFileDownloadUrl(code, media.id, token),
        }));

        const hasFiles = files.length > 0;

        return {
          id: exam.id,
          name: exam.name,
          examDate: exam.examDate || null,
          notes: exam.notes || null,
          tags: exam.tags || null,
          files: hasFiles ? files : null,
          hasPdf: hasFiles,
        };
      })
    );
  }

  async getShareSummary(code, options = {}) {
    const result = await this.shareLinkRepository.findByCodeWithExams(code);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    const { shareLink, exams } = result;
    this.ensureShareLinkActiveOrThrow(shareLink, options);

    return {
      shareLink,
      exams,
      summary: {
        code: shareLink.code,
        expiresAt: shareLink.expiresAt?.toISOString() || null,
        examCount: exams.length,
        hasMessage: !!shareLink.message,
      },
    };
  }

  async getShareContentForToken(code, token, ipAddress, userAgent) {
    let decoded;
    try {
      decoded = JwtUtil.verify(token);
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired access token');
    }

    if (decoded.kind !== 'share_access') {
      throw new UnauthorizedError('Invalid token type');
    }

    if (decoded.code !== code) {
      throw new UnauthorizedError('Token code mismatch');
    }

    const result = await this.shareLinkRepository.findByIdWithExams(decoded.sub);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    const { shareLink, exams } = result;
    this.ensureShareLinkActiveOrThrow(shareLink);

    const examsWithFiles = await this.buildExamsWithFiles(exams, code, token);

    await this.logAccess(shareLink.id, 'SHARE_VIEWED', null, ipAddress, userAgent);

    return {
      shareLink,
      content: {
        code: shareLink.code,
        message: shareLink.message || null,
        expiresAt: shareLink.expiresAt?.toISOString() || null,
        maxUses: shareLink.maxUses,
        timesUsed: shareLink.timesUsed,
        downloadAllUrl: this.buildDownloadAllUrl(code, token),
        exams: examsWithFiles,
      },
    };
  }

  formatShareLinkResponse(shareLink, exams = []) {
    const response = {
      id: shareLink.id,
      userId: shareLink.userId,
      code: shareLink.code,
      shareUrl: `${ENV.SHARE_BASE_URL}/s/${shareLink.code}`, // URL pública absoluta
      email: shareLink.email,
      message: shareLink.message || null,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      maxUses: shareLink.maxUses,
      timesUsed: shareLink.timesUsed,
      revokedAt: shareLink.revokedAt?.toISOString() || null,
      createdAt: shareLink.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: shareLink.updatedAt?.toISOString() || new Date().toISOString(),
      isExpired: TokenUtil.isExpired(shareLink.expiresAt),
      isRevoked: !!shareLink.revokedAt,
      isMaxUsesReached: shareLink.timesUsed >= shareLink.maxUses,
      isActive: !TokenUtil.isExpired(shareLink.expiresAt) && !shareLink.revokedAt,
      exams: exams.map(exam => ({
        id: exam.id,
        name: exam.name,
        examDate: exam.examDate || null,
        notes: exam.notes || null,
        tags: exam.tags || null,
      })),
    };

    return response;
  }

  /**
   * Cria um compartilhamento com múltiplos exames
   */
  async createShareLink(userId, data) {
    const {
      examIds, // Array de IDs de exames
      email,
      expiresInDays = 7, // Default 7 dias
      maxUses = 1, // Default 1 uso
      message = null, // Mensagem opcional para o destinatário
    } = data;

    // Validar que examIds é um array e não está vazio
    if (!Array.isArray(examIds) || examIds.length === 0) {
      throw new ValidationError('examIds must be a non-empty array');
    }

    // Remover duplicatas dos examIds
    const uniqueExamIds = [...new Set(examIds)];

    // Validar que todos os exames existem e pertencem ao usuário
    const exams = await Promise.all(
      uniqueExamIds.map(async (examId) => {
        const exam = await this.examRepository.findById(examId, userId);
        if (!exam) {
          throw new NotFoundError(`Exam ${examId} not found or you do not have permission`);
        }
        return exam;
      })
    );

    // Normalizar email
    const normalizedEmail = TokenUtil.normalizeEmail(email);

    // Gerar código curto único (tentar até encontrar um disponível)
    let code;
    let attempts = 0;
    do {
      code = TokenUtil.generateShareCode(12);
      const existing = await this.shareLinkRepository.findByCode(code);
      if (!existing) break;
      attempts++;
      if (attempts > 10) {
        throw new ValidationError('Failed to generate unique share code');
      }
    } while (true);

    // Calcular data de expiração
    const expiresAt = TokenUtil.generateExpirationDate(expiresInDays * 24 * 60);

    // Criar o link de compartilhamento (sem examId)
    const shareLink = await this.shareLinkRepository.create({
      userId,
      code,
      email: normalizedEmail,
      message,
      expiresAt,
      maxUses,
      timesUsed: 0,
    });

    // Criar os vínculos com os exames
    const sharedExamsData = uniqueExamIds.map(examId => ({
      shareId: shareLink.id,
      examId,
    }));
    await this.sharedExamRepository.createMany(sharedExamsData);

    // Buscar o link com os exames para retornar
    const result = await this.shareLinkRepository.findByIdWithExams(shareLink.id);

    // Construir URL completa do link compartilhado
    const shareUrl = `${ENV.SHARE_BASE_URL}/s/${code}`;

    // Enviar email com o link de compartilhamento
    try {
      await this.mailService.sendShareLinkEmail(
        normalizedEmail,
        shareUrl,
        result.exams.map(exam => ({
          name: exam.name,
          examDate: exam.examDate,
          notes: exam.notes,
        })),
        expiresAt?.toISOString(),
        message
      );
      await this.logAccess(shareLink.id, 'SHARE_EMAIL_SENT', normalizedEmail, null, null);
    } catch (error) {
      console.error('Erro ao enviar email de compartilhamento:', error);
      // Não falhar a operação se o email falhar, mas logar o erro
      await this.logAccess(shareLink.id, 'SHARE_EMAIL_FAILED', normalizedEmail, null, null);
      // Em desenvolvimento, não lançar erro. Em produção, pode querer avisar o usuário
      if (ENV.NODE_ENV === 'production') {
        // Opcional: lançar erro se necessário
        // throw new ValidationError('Link criado, mas falha ao enviar email. Por favor, tente novamente.');
      }
    }

    // Registrar log de criação
    await this.logAccess(shareLink.id, 'SHARE_CREATED', normalizedEmail, null, null);

    return this.formatShareLinkResponse(result.shareLink, result.exams);
  }

  /**
   * Busca compartilhamento por ID (para dono do exame)
   */
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

  /**
   * Lista compartilhamentos por usuário
   */
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

  /**
   * Lista compartilhamentos de um exame específico
   */
  async getShareLinksByExam(examId, userId) {
    // Verificar que o exame pertence ao usuário
    const exam = await this.examRepository.findById(examId, userId);
    if (!exam) {
      throw new NotFoundError('Exam not found or you do not have permission');
    }

    const shareLinks = await this.shareLinkRepository.findByExamId(examId, userId);

    // Para cada share link, buscar todos os exames compartilhados
    const linksWithExams = await Promise.all(
      shareLinks.map(async (link) => {
        const result = await this.shareLinkRepository.findByIdWithExams(link.id);
        return this.formatShareLinkResponse(result.shareLink, result.exams);
      })
    );

    return linksWithExams;
  }

  /**
   * Busca compartilhamento por código (público, para acesso ao link)
   */
  async getShareByCode(code) {
    const result = await this.shareLinkRepository.findByCodeWithExams(code);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    const { shareLink, exams } = result;
    this.ensureShareLinkActiveOrThrow(shareLink);

    const examsWithFiles = await this.buildExamsWithFiles(exams, code);

    // Retornar apenas informações públicas (sem email)
    return {
      code: shareLink.code,
      message: shareLink.message || null,
      exams: examsWithFiles,
      expiresAt: shareLink.expiresAt?.toISOString() || null,
      maxUses: shareLink.maxUses,
      timesUsed: shareLink.timesUsed,
      downloadAllUrl: this.buildDownloadAllUrl(code, null), // URL para baixar tudo como ZIP
    };
  }

  /**
   * Solicita acesso ao compartilhamento (envia OTP)
   */
  async requestAccess(code, email, ipAddress, userAgent) {
    const result = await this.shareLinkRepository.findByCodeWithExams(code);

    if (!result) {
      await this.logAccess(null, 'OTP_REQUEST_FAILED', email, ipAddress, userAgent);
      throw new NotFoundError('Share link not found');
    }

    const { shareLink, exams } = result;

    // Verificar se está revogado
    if (shareLink.revokedAt) {
      await this.logAccess(shareLink.id, 'OTP_REQUEST_FAILED_REVOKED', email, ipAddress, userAgent);
      throw new ValidationError('This share link has been revoked');
    }

    // Verificar se expirou
    if (TokenUtil.isExpired(shareLink.expiresAt)) {
      await this.logAccess(shareLink.id, 'OTP_REQUEST_FAILED_EXPIRED', email, ipAddress, userAgent);
      throw new ValidationError('This share link has expired');
    }

    // Note: maxUses check removed - links can be accessed unlimited times if they have the link

    // Normalizar email
    const normalizedEmail = TokenUtil.normalizeEmail(email);

    // Verificar se o email bate com o do compartilhamento
    if (normalizedEmail !== shareLink.email) {
      await this.logAccess(shareLink.id, 'OTP_REQUEST_FAILED_WRONG_EMAIL', email, ipAddress, userAgent);
      throw new UnauthorizedError('Email does not match the share link recipient');
    }

    // Rate limiting: verificar se não excedeu 5 solicitações por hora
    const rateLimit = await RateLimitUtil.checkOTPSendLimit(shareLink.id, ipAddress);
    if (!rateLimit.allowed) {
      await this.logAccess(shareLink.id, 'OTP_REQUEST_FAILED_RATE_LIMIT', email, ipAddress, userAgent);
      throw new ValidationError(`Too many OTP requests. Please try again after ${rateLimit.resetAt.toISOString()}`);
    }

    // Gerar OTP
    const otp = TokenUtil.generateOTP();
    const otpHash = await HashUtil.hash(otp);
    const otpExpiresAt = TokenUtil.generateExpirationDate(10); // 10 minutos

    // Atualizar o compartilhamento com OTP hash
    await this.shareLinkRepository.updateByCode(code, {
      otpHash,
      otpExpiresAt,
      otpAttempts: 0, // Reset tentativas
      otpSentAt: new Date(),
      otpSentCount: shareLink.otpSentCount + 1,
    });

    // Enviar OTP por email (usar o primeiro exame para o assunto, ou criar mensagem genérica)
    const examNames = exams.map(e => e.name).join(', ');
    try {
      await this.mailService.sendVerificationCode(normalizedEmail, otp, examNames);
      await this.logAccess(shareLink.id, 'OTP_SENT', email, ipAddress, userAgent);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      await this.logAccess(shareLink.id, 'OTP_SEND_FAILED', email, ipAddress, userAgent);
      throw new ValidationError('Failed to send verification code. Please try again later.');
    }

    return {
      message: 'OTP sent to your email',
      expiresIn: 10, // minutos
      // Em desenvolvimento, retornar o OTP. Em produção, não retornar!
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  /**
   * Valida OTP e gera token temporário de acesso
   */
  async validateOTP(code, email, otp, ipAddress, userAgent) {
    const result = await this.shareLinkRepository.findByCodeWithExams(code);

    if (!result) {
      await this.logAccess(null, 'OTP_VERIFY_FAILED_INVALID_CODE', email, ipAddress, userAgent);
      throw new NotFoundError('Share link not found');
    }

    const { shareLink, exams } = result;

    // Verificar se está revogado
    if (shareLink.revokedAt) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_REVOKED', email, ipAddress, userAgent);
      throw new ValidationError('This share link has been revoked');
    }

    // Verificar se expirou
    if (TokenUtil.isExpired(shareLink.expiresAt)) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_EXPIRED', email, ipAddress, userAgent);
      throw new ValidationError('This share link has expired');
    }

    // Note: maxUses check removed - links can be accessed unlimited times if they have the link

    // Normalizar email
    const normalizedEmail = TokenUtil.normalizeEmail(email);

    // Verificar se o email bate
    if (normalizedEmail !== shareLink.email) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_WRONG_EMAIL', email, ipAddress, userAgent);
      throw new UnauthorizedError('Email does not match');
    }

    // Verificar se OTP expirou
    if (!shareLink.otpExpiresAt || TokenUtil.isExpired(shareLink.otpExpiresAt)) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_OTP_EXPIRED', email, ipAddress, userAgent);
      throw new ValidationError('OTP has expired. Please request a new one');
    }

    // Verificar se excedeu tentativas
    if (shareLink.otpAttempts >= 5) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_MAX_ATTEMPTS', email, ipAddress, userAgent);
      throw new ValidationError('Maximum OTP verification attempts reached. Please request a new OTP');
    }

    // Rate limiting: verificar tentativas recentes
    const rateLimit = await RateLimitUtil.checkOTPVerifyLimit(shareLink.id, ipAddress);
    if (!rateLimit.allowed) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_RATE_LIMIT', email, ipAddress, userAgent);
      throw new ValidationError('Too many verification attempts. Please try again later');
    }

    // Verificar OTP
    if (!shareLink.otpHash) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_NO_OTP', email, ipAddress, userAgent);
      throw new ValidationError('No OTP found. Please request a new one');
    }

    const isOtpValid = await HashUtil.compare(otp, shareLink.otpHash);
    
    // Incrementar tentativas
    await this.shareLinkRepository.updateByCode(code, {
      otpAttempts: shareLink.otpAttempts + 1,
    });

    if (!isOtpValid) {
      await this.logAccess(shareLink.id, 'OTP_VERIFY_FAILED_INVALID', email, ipAddress, userAgent);
      throw new UnauthorizedError('Invalid OTP code');
    }

    // OTP válido! Gerar token temporário de acesso
    const accessToken = JwtUtil.sign(
      {
        sub: shareLink.id,
        kind: 'share_access',
        code: shareLink.code,
      },
      { expiresIn: '15m' } // 15 minutos
    );

    // Limpar OTP (por segurança)
    await this.shareLinkRepository.updateByCode(code, {
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    });

    const updatedShareLink = await this.shareLinkRepository.incrementTimesUsed(shareLink.id);

    await this.logAccess(shareLink.id, 'OTP_VERIFIED', email, ipAddress, userAgent);

    const shareLinkForResponse = updatedShareLink || shareLink;

    return {
      message: 'Access granted',
      accessToken,
      expiresIn: 15, // minutos
      shareLink: {
        code: shareLinkForResponse.code,
        message: shareLinkForResponse.message || null,
        downloadAllUrl: this.buildDownloadAllUrl(code, accessToken),
        exams: exams.map(exam => ({
          id: exam.id,
          name: exam.name,
        })),
      },
    };
  }

  /**
   * Revoga compartilhamento
   */
  async revokeShareLink(shareLinkId, userId) {
    const result = await this.shareLinkRepository.findByIdWithExams(shareLinkId);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    // Verificar se o link pertence ao usuário
    if (result.shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to revoke this share link');
    }

    // Revogar
    await this.shareLinkRepository.revoke(shareLinkId);

    // Registrar log
    await this.logAccess(shareLinkId, 'SHARE_REVOKED', null, null, null);

    return { message: 'Share link revoked successfully' };
  }

  /**
   * Atualiza expiração do compartilhamento
   */
  async updateExpiration(shareLinkId, userId, expiresInDays) {
    const result = await this.shareLinkRepository.findByIdWithExams(shareLinkId);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    // Verificar se o link pertence ao usuário
    if (result.shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this share link');
    }

    // Calcular nova data de expiração
    const expiresAt = TokenUtil.generateExpirationDate(expiresInDays * 24 * 60);

    // Atualizar
    await this.shareLinkRepository.update(shareLinkId, { expiresAt });

    const updated = await this.shareLinkRepository.findByIdWithExams(shareLinkId);

    return this.formatShareLinkResponse(updated.shareLink, updated.exams);
  }

  /**
   * Deleta compartilhamento
   */
  async deleteShareLink(shareLinkId, userId) {
    const result = await this.shareLinkRepository.findByIdWithExams(shareLinkId);

    if (!result) {
      throw new NotFoundError('Share link not found');
    }

    // Verificar se o link pertence ao usuário
    if (result.shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this share link');
    }

    // Deletar os logs de acesso
    await this.shareAccessLogRepository.deleteByShareId(shareLinkId);

    // Deletar os vínculos com exames compartilhados
    await this.sharedExamRepository.deleteByShareId(shareLinkId);

    // Deletar o link
    const deleted = await this.shareLinkRepository.delete(shareLinkId);

    if (!deleted) {
      throw new NotFoundError('Failed to delete share link');
    }

    return { message: 'Share link deleted successfully' };
  }

  /**
   * Busca logs de acesso
   */
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

  /**
   * Loga eventos de acesso
   */
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

  /**
   * Estatísticas de compartilhamentos
   */
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
