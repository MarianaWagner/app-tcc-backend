import { PrescriptionRepository } from '../repositories/prescription.repository.js';
import { ExamRepository } from '../repositories/exam.repository.js';
import { FileUtil } from '../utils/file.util.js';
import { NotFoundError, ValidationError } from '../utils/errors.util.js';

const ALLOWED_STATUSES = ['em_uso', 'concluida', 'suspensa'];

export class PrescriptionService {
  constructor() {
    this.prescriptionRepository = new PrescriptionRepository();
    this.examRepository = new ExamRepository();
  }

  static normalizeStatus(status) {
    if (!status) {
      return 'em_uso';
    }

    const normalized = status.trim().toLowerCase().replace(/\s+/g, '_');
    if (!ALLOWED_STATUSES.includes(normalized)) {
      throw new ValidationError('Status inválido. Valores permitidos: em_uso, concluida, suspensa.');
    }
    return normalized;
  }

  static normalizeTags(tags) {
    if (!tags) {
      return null;
    }

    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          return parsed.map(tag => tag.toString().trim()).filter(Boolean);
        }
      } catch {
        return tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
      }
    }

    if (Array.isArray(tags)) {
      return tags.map(tag => tag.toString().trim()).filter(Boolean);
    }

    return null;
  }

  static normalizeItems(items) {
    if (items === undefined) {
      return undefined;
    }

    let parsedItems = items;

    if (typeof items === 'string') {
      try {
        parsedItems = JSON.parse(items);
      } catch {
        throw new ValidationError('Formato de itens inválido. Informe um array em JSON.');
      }
    }

    if (!Array.isArray(parsedItems)) {
      throw new ValidationError('Itens da prescrição devem ser uma lista.');
    }

    return parsedItems
      .map(item => ({
        name: item.name?.toString().trim(),
        dosage: item.dosage?.toString().trim() || null,
        route: item.route?.toString().trim() || null,
        frequency: item.frequency?.toString().trim() || null,
        duration: item.duration?.toString().trim() || null,
        notes: item.notes?.toString().trim() || null,
      }))
      .filter(item => !!item.name);
  }

  static parseDate(value, { required = false } = {}) {
    if (!value) {
      if (required) {
        throw new ValidationError('Data de emissão é obrigatória.');
      }
      return undefined;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ValidationError('Data de emissão inválida. Use o formato YYYY-MM-DD.');
    }

    return parsed.toISOString().split('T')[0];
  }

  static formatPrescription(prescription, items = []) {
    return {
      id: prescription.id,
      userId: prescription.userId,
      examId: prescription.examId,
      title: prescription.title,
      issueDate: prescription.issueDate,
      posology: prescription.posology,
      status: prescription.status,
      tags: prescription.tags ?? [],
      notes: prescription.notes,
      professional: prescription.professional,
      attachment: {
        path: prescription.attachmentPath,
        mimeType: prescription.attachmentMimeType,
        metadata: prescription.attachmentMetadata,
      },
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        dosage: item.dosage,
        route: item.route,
        frequency: item.frequency,
        duration: item.duration,
        notes: item.notes,
        createdAt: item.createdAt?.toISOString?.() ?? null,
      })),
      createdAt: prescription.createdAt?.toISOString?.() ?? null,
      updatedAt: prescription.updatedAt?.toISOString?.() ?? null,
      deletedAt: prescription.deletedAt?.toISOString?.() ?? null,
    };
  }

  static formatSummary(prescription) {
    return {
      id: prescription.id,
      title: prescription.title,
      issueDate: prescription.issueDate,
      status: prescription.status,
      tags: prescription.tags ?? [],
      professional: prescription.professional,
      createdAt: prescription.createdAt?.toISOString?.() ?? null,
      updatedAt: prescription.updatedAt?.toISOString?.() ?? null,
    };
  }

  async ensureExamBelongsToUser(examId, userId) {
    if (!examId) {
      return;
    }

    const exam = await this.examRepository.findById(examId, userId);
    if (!exam) {
      throw new ValidationError('Exame vinculado não encontrado para este usuário.');
    }
  }

  async createPrescription(userId, data, file) {
    if (!file) {
      throw new ValidationError('Anexo da prescrição é obrigatório.');
    }

    const title = data.title?.toString().trim();
    const posology = data.posology?.toString().trim();

    if (!title) {
      throw new ValidationError('Título é obrigatório.');
    }

    if (!posology) {
      throw new ValidationError('Posologia é obrigatória.');
    }

    const issueDate = PrescriptionService.parseDate(data.issueDate, { required: true });
    const status = PrescriptionService.normalizeStatus(data.status);
    const tags = PrescriptionService.normalizeTags(data.tags);
    const items = PrescriptionService.normalizeItems(data.items);

    const examId = data.examId?.toString().trim() || null;
    if (examId) {
      await this.ensureExamBelongsToUser(examId, userId);
    }

    const prescriptionData = {
      userId,
      examId,
      title,
      issueDate,
      posology,
      status,
      attachmentPath: FileUtil.getRelativePath(file.path),
      attachmentMimeType: file.mimetype,
      attachmentMetadata: FileUtil.extractMetadata(file),
      tags,
      notes: data.notes?.toString().trim() || null,
      professional: data.professional?.toString().trim() || null,
    };

    const created = await this.prescriptionRepository.create(prescriptionData);
    const createdItems = items && items.length
      ? await this.prescriptionRepository.addItems(created.id, items)
      : [];

    return PrescriptionService.formatPrescription(created, createdItems);
  }

  async listPrescriptions(userId, query) {
    const filters = {
      page: query.page || 1,
      limit: query.limit || 10,
      status: query.status ? PrescriptionService.normalizeStatus(query.status) : undefined,
      search: query.search?.toString().trim() || undefined,
      startDate: query.startDate ? PrescriptionService.parseDate(query.startDate) : undefined,
      endDate: query.endDate ? PrescriptionService.parseDate(query.endDate) : undefined,
      tags: PrescriptionService.normalizeTags(query.tags),
      sortField: query.sortField,
      sortOrder: query.sortOrder,
    };

    const { prescriptions, total } = await this.prescriptionRepository.findByUserId(userId, filters);

    return {
      data: prescriptions.map(PrescriptionService.formatSummary),
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getPrescriptionById(id, userId) {
    const result = await this.prescriptionRepository.findById(id, userId);
    if (!result) {
      throw new NotFoundError('Prescrição não encontrada.');
    }

    return PrescriptionService.formatPrescription(result.prescription, result.items);
  }

  async updatePrescription(id, userId, data, file) {
    const existing = await this.prescriptionRepository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Prescrição não encontrada.');
    }

    const updateData = {};

    if (data.title !== undefined) {
      const title = data.title?.toString().trim();
      if (!title) {
        throw new ValidationError('Título não pode ser vazio.');
      }
      updateData.title = title;
    }

    if (data.posology !== undefined) {
      const posology = data.posology?.toString().trim();
      if (!posology) {
        throw new ValidationError('Posologia não pode ser vazia.');
      }
      updateData.posology = posology;
    }

    if (data.issueDate !== undefined) {
      updateData.issueDate = PrescriptionService.parseDate(data.issueDate, { required: true });
    }

    if (data.status !== undefined) {
      updateData.status = PrescriptionService.normalizeStatus(data.status);
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes?.toString().trim() || null;
    }

    if (data.professional !== undefined) {
      updateData.professional = data.professional?.toString().trim() || null;
    }

    if (data.tags !== undefined) {
      updateData.tags = PrescriptionService.normalizeTags(data.tags);
    }

    if (data.examId !== undefined) {
      const examId = data.examId?.toString().trim();
      if (examId) {
        await this.ensureExamBelongsToUser(examId, userId);
        updateData.examId = examId;
      } else {
        updateData.examId = null;
      }
    }

    if (file) {
      const currentPath = existing.prescription.attachmentPath
        ? FileUtil.getFullPath(existing.prescription.attachmentPath)
        : null;

      updateData.attachmentPath = FileUtil.getRelativePath(file.path);
      updateData.attachmentMimeType = file.mimetype;
      updateData.attachmentMetadata = FileUtil.extractMetadata(file);

      if (currentPath) {
        FileUtil.deleteFile(currentPath);
      }
    }

    const updated = await this.prescriptionRepository.update(id, userId, updateData);

    if (!updated) {
      throw new NotFoundError('Falha ao atualizar a prescrição.');
    }

    let items = existing.items;

    if (data.items !== undefined) {
      const parsedItems = PrescriptionService.normalizeItems(data.items) ?? [];
      await this.prescriptionRepository.deleteItemsByPrescriptionId(id);
      items = parsedItems.length
        ? await this.prescriptionRepository.addItems(id, parsedItems)
        : [];
    }

    return PrescriptionService.formatPrescription(updated, items);
  }

  async deletePrescription(id, userId, { hard = false } = {}) {
    const existing = await this.prescriptionRepository.findById(id, userId, { includeDeleted: true });
    if (!existing) {
      throw new NotFoundError('Prescrição não encontrada.');
    }

    if (hard) {
      const deleted = await this.prescriptionRepository.hardDelete(id, userId);
      if (!deleted) {
        throw new NotFoundError('Falha ao excluir a prescrição.');
      }
      if (existing.prescription.attachmentPath) {
        FileUtil.deleteFile(FileUtil.getFullPath(existing.prescription.attachmentPath));
      }
      return;
    }

    const deleted = await this.prescriptionRepository.softDelete(id, userId);
    if (!deleted) {
      throw new NotFoundError('Falha ao excluir a prescrição.');
    }
  }

  async downloadAttachment(id, userId) {
    const existing = await this.prescriptionRepository.findById(id, userId);
    if (!existing) {
      throw new NotFoundError('Prescrição não encontrada.');
    }

    const fullPath = FileUtil.getFullPath(existing.prescription.attachmentPath);
    return {
      path: fullPath,
      filename: existing.prescription.attachmentMetadata?.originalName || `${existing.prescription.title}`,
      mimeType: existing.prescription.attachmentMimeType,
    };
  }
}

