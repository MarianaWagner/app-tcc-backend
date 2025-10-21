import { ExamMediaRepository } from '../repositories/examMedia.repository.js';
import { ExamRepository } from '../repositories/exam.repository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.util.js';

// Tipos de mídia permitidos
const ALLOWED_MEDIA_TYPES = ['image', 'pdf', 'video', 'document', 'other'];

export class ExamMediaService {
  constructor() {
    this.examMediaRepository = new ExamMediaRepository();
    this.examRepository = new ExamRepository();
  }

  formatMediaResponse(media) {
    return {
      id: media.id,
      examId: media.examId,
      mediaType: media.mediaType,
      filePath: media.filePath,
      metadata: media.metadata || null,
      createdAt: media.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  async validateExamOwnership(examId, userId) {
    const exam = await this.examRepository.findById(examId, userId);
    
    if (!exam) {
      throw new NotFoundError('Exam not found or you do not have permission');
    }

    return exam;
  }

  async validateMediaType(mediaType) {
    if (mediaType && !ALLOWED_MEDIA_TYPES.includes(mediaType)) {
      throw new ValidationError(
        `Invalid media type. Allowed types: ${ALLOWED_MEDIA_TYPES.join(', ')}`
      );
    }
  }

  async createMedia(userId, data) {
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(data.examId, userId);

    // Validar tipo de mídia
    await this.validateMediaType(data.mediaType);

    const newMedia = {
      examId: data.examId,
      mediaType: data.mediaType || 'other',
      filePath: data.filePath,
      metadata: data.metadata || null,
    };

    const media = await this.examMediaRepository.create(newMedia);
    return this.formatMediaResponse(media);
  }

  async getMediaById(mediaId, userId) {
    const result = await this.examMediaRepository.findByIdWithExam(mediaId);

    if (!result) {
      throw new NotFoundError('Media not found');
    }

    // Verificar se o exame pertence ao usuário
    if (result.exam.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this media');
    }

    return this.formatMediaResponse(result.media);
  }

  async getMediasByExam(examId, userId, query) {
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(examId, userId);

    const { medias, total } = await this.examMediaRepository.findByExamId(examId, query);

    const page = query.page || 1;
    const limit = query.limit || 50;

    return {
      data: medias.map(media => this.formatMediaResponse(media)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateMedia(mediaId, userId, data) {
    const result = await this.examMediaRepository.findByIdWithExam(mediaId);

    if (!result) {
      throw new NotFoundError('Media not found');
    }

    // Verificar se o exame pertence ao usuário
    if (result.exam.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this media');
    }

    const updateData = {};

    if (data.mediaType !== undefined) {
      await this.validateMediaType(data.mediaType);
      updateData.mediaType = data.mediaType;
    }

    if (data.filePath !== undefined) {
      updateData.filePath = data.filePath;
    }

    if (data.metadata !== undefined) {
      updateData.metadata = data.metadata;
    }

    const updated = await this.examMediaRepository.update(mediaId, updateData);

    if (!updated) {
      throw new NotFoundError('Failed to update media');
    }

    return this.formatMediaResponse(updated);
  }

  async deleteMedia(mediaId, userId) {
    const result = await this.examMediaRepository.findByIdWithExam(mediaId);

    if (!result) {
      throw new NotFoundError('Media not found');
    }

    // Verificar se o exame pertence ao usuário
    if (result.exam.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this media');
    }

    const deleted = await this.examMediaRepository.delete(mediaId);

    if (!deleted) {
      throw new NotFoundError('Failed to delete media');
    }

    return result.media; // Retorna os dados da mídia deletada (útil para deletar o arquivo físico)
  }

  async deleteMediasByExam(examId, userId) {
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(examId, userId);

    const deletedCount = await this.examMediaRepository.deleteByExamId(examId);

    return { deletedCount };
  }

  async getMediaCount(examId, userId) {
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(examId, userId);

    const count = await this.examMediaRepository.countByExamId(examId);

    return { count };
  }
}


