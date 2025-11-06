import { ExamRepository } from '../repositories/exam.repository.js';
import { ExamMediaRepository } from '../repositories/examMedia.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.util.js';
import { FileUtil } from '../utils/file.util.js';

export class ExamService {
  constructor() {
    this.examRepository = new ExamRepository();
    this.examMediaRepository = new ExamMediaRepository();
  }

  formatExamResponse(exam, mediaFiles = null) {
    const response = {
      id: exam.id,
      userId: exam.userId,
      name: exam.name,
      examDate: exam.examDate || null,
      notes: exam.notes || null,
      tags: exam.tags || null,
      createdAt: exam.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: exam.updatedAt?.toISOString() || new Date().toISOString(),
      deletedAt: exam.deletedAt?.toISOString() || null,
    };

    if (mediaFiles) {
      response.uploadedFiles = mediaFiles;
    }

    return response;
  }

  async createExam(userId, data, files = []) {
    if (!data.examDate) {
      throw new ValidationError('Exam date is required');
    }

    const newExam = {
      userId,
      name: data.name,
      examDate: new Date(data.examDate).toISOString().split('T')[0],
      notes: data.notes || null,
      tags: data.tags || null,
    };

    const exam = await this.examRepository.create(newExam);

    // Se houver arquivos, criar registros de exam_media
    const uploadedFiles = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const mediaType = FileUtil.getMediaType(file.mimetype);
        const filePath = FileUtil.getRelativePath(file.path);
        const metadata = FileUtil.extractMetadata(file);

        const media = await this.examMediaRepository.create({
          examId: exam.id,
          mediaType,
          filePath,
          metadata,
        });

        uploadedFiles.push({
          id: media.id,
          mediaType: media.mediaType,
          filePath: media.filePath,
          metadata: media.metadata,
        });
      }
    }

    return this.formatExamResponse(exam, uploadedFiles.length > 0 ? uploadedFiles : null);
  }

  async getExamById(examId, userId) {
    const exam = await this.examRepository.findById(examId, userId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    return this.formatExamResponse(exam);
  }

  async getExamsByUser(userId, query) {
    const { exams, total } = await this.examRepository.findByUserId(userId, query);

    const page = query.page || 1;
    const limit = query.limit || 10;

    return {
      data: exams.map(exam => this.formatExamResponse(exam)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateExam(examId, userId, data) {
    const exam = await this.examRepository.findById(examId, userId);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    const updateData = {};

    if (data.name !== undefined) updateData.name = data.name;
    // examDate é obrigatório quando fornecido
    if (data.examDate !== undefined) {
      if (!data.examDate) {
        throw new ValidationError('Exam date is required');
      }
      updateData.examDate = new Date(data.examDate).toISOString().split('T')[0];
    }
    // Se não foi fornecido, mantém a data existente (não inclui no updateData)
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const updated = await this.examRepository.update(examId, userId, updateData);

    if (!updated) {
      throw new NotFoundError('Failed to update exam');
    }

    return this.formatExamResponse(updated);
  }

  async deleteExam(examId, userId, hard = false) {
    const exam = await this.examRepository.findById(examId, userId, true);

    if (!exam) {
      throw new NotFoundError('Exam not found');
    }

    if (hard) {
      const deleted = await this.examRepository.hardDelete(examId, userId);
      if (!deleted) {
        throw new NotFoundError('Failed to delete exam');
      }
    } else {
      const deleted = await this.examRepository.softDelete(examId, userId);
      if (!deleted) {
        throw new NotFoundError('Failed to delete exam');
      }
    }
  }

  async restoreExam(examId, userId) {
    const exam = await this.examRepository.restore(examId, userId);

    if (!exam) {
      throw new NotFoundError('Exam not found or already active');
    }

    return this.formatExamResponse(exam);
  }
}

