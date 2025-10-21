import { SharedExamRepository } from '../repositories/sharedExam.repository.js';
import { ShareLinkRepository } from '../repositories/shareLink.repository.js';
import { ExamRepository } from '../repositories/exam.repository.js';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.util.js';

export class SharedExamService {
  constructor() {
    this.sharedExamRepository = new SharedExamRepository();
    this.shareLinkRepository = new ShareLinkRepository();
    this.examRepository = new ExamRepository();
  }

  formatSharedExamResponse(sharedExam, exam = null, shareLink = null) {
    const response = {
      id: sharedExam.id,
      shareId: sharedExam.shareId,
      examId: sharedExam.examId,
      createdAt: sharedExam.createdAt?.toISOString() || new Date().toISOString(),
    };

    if (exam) {
      response.exam = {
        id: exam.id,
        name: exam.name,
        examDate: exam.examDate || null,
      };
    }

    if (shareLink) {
      response.shareLink = {
        id: shareLink.id,
        contact: shareLink.contact,
        expiresAt: shareLink.expiresAt?.toISOString() || null,
      };
    }

    return response;
  }

  async addExamToShare(userId, shareId, examId) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this share link');
    }

    // Validar que o exame existe e pertence ao usuário
    const exam = await this.examRepository.findById(examId, userId);
    if (!exam) {
      throw new NotFoundError('Exam not found or you do not have permission');
    }

    // Verificar se já existe
    const exists = await this.sharedExamRepository.exists(shareId, examId);
    if (exists) {
      throw new ConflictError('This exam is already shared in this link');
    }

    const sharedExam = await this.sharedExamRepository.create({
      shareId,
      examId,
    });

    return this.formatSharedExamResponse(sharedExam, exam, shareLink);
  }

  async getSharedExamsByShareId(userId, shareId) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this share link');
    }

    const result = await this.shareLinkRepository.findByIdWithExams(shareId);
    
    return result.exams.map(exam => ({
      examId: exam.id,
      name: exam.name,
      examDate: exam.examDate || null,
      notes: exam.notes || null,
      tags: exam.tags || null,
    }));
  }

  async getSharedExamsByExamId(userId, examId) {
    // Validar que o exame existe e pertence ao usuário
    const exam = await this.examRepository.findById(examId, userId);
    if (!exam) {
      throw new NotFoundError('Exam not found or you do not have permission');
    }

    const sharedExams = await this.sharedExamRepository.findByExamId(examId);
    
    // Para cada shared exam, buscar o share link
    const results = await Promise.all(
      sharedExams.map(async (sharedExam) => {
        const shareLink = await this.shareLinkRepository.findById(sharedExam.shareId);
        return this.formatSharedExamResponse(sharedExam, null, shareLink);
      })
    );

    return results;
  }

  async removeExamFromShare(userId, shareId, examId) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to modify this share link');
    }

    // Deletar o vínculo
    const deleted = await this.sharedExamRepository.delete(shareId, examId);

    if (!deleted) {
      throw new NotFoundError('Shared exam not found');
    }
  }

  async getSharedExamCount(userId, shareId) {
    // Validar que o share link existe e pertence ao usuário
    const shareLink = await this.shareLinkRepository.findById(shareId);
    if (!shareLink) {
      throw new NotFoundError('Share link not found');
    }

    if (shareLink.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this share link');
    }

    const count = await this.sharedExamRepository.countByShareId(shareId);

    return { count };
  }
}

