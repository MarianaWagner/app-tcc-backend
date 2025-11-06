import { ReminderRepository } from '../repositories/reminder.repository.js';
import { ExamRepository } from '../repositories/exam.repository.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.util.js';

export class ReminderService {
  constructor() {
    this.reminderRepository = new ReminderRepository();
    this.examRepository = new ExamRepository();
  }

  formatReminderResponse(reminder, exam = null) {
    const response = {
      id: reminder.id,
      userId: reminder.userId,
      examId: reminder.examId || null,
      title: reminder.title,
      reminderDate: reminder.reminderDate?.toISOString() || null,
      requiresFasting: reminder.requiresFasting === 1 || reminder.requiresFasting === true,
      fastingDuration: reminder.fastingDuration || null,
      fastingAlertTime: reminder.fastingAlertTime?.toISOString() || null,
      notes: reminder.notes || null,
      createdAt: reminder.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: reminder.updatedAt?.toISOString() || new Date().toISOString(),
    };

    if (exam) {
      response.exam = {
        id: exam.id,
        name: exam.name,
        examDate: exam.examDate || null,
      };
    }

    return response;
  }

  async validateExamOwnership(examId, userId) {
    const exam = await this.examRepository.findById(examId, userId);
    
    if (!exam) {
      throw new NotFoundError('Exam not found or you do not have permission');
    }

    return exam;
  }

  async validateReminderDate(reminderDate) {
    const date = new Date(reminderDate);
    const now = new Date();

    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid reminder date');
    }

    // Permitir lembretes no passado para registros históricos
    // mas avisar se a data é muito antiga (mais de 1 ano no passado)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    if (date < oneYearAgo) {
      throw new ValidationError('Reminder date cannot be more than 1 year in the past');
    }

    return date;
  }

  async createReminder(userId, data) {
    // Validar que o exame existe e pertence ao usuário (apenas se examId for fornecido)
    if (data.examId) {
      await this.validateExamOwnership(data.examId, userId);
    }

    // Validar data do lembrete
    console.log(data.reminderDate);
    const reminderDate = await this.validateReminderDate(data.reminderDate);

    const newReminder = {
      userId,
      examId: data.examId || null,
      title: data.title,
      reminderDate,
      requiresFasting: data.requiresFasting ? 1 : 0,
      fastingDuration: data.fastingDuration || null,
      fastingAlertTime: data.fastingAlertTime || null,
      notes: data.notes || null,
    };

    const reminder = await this.reminderRepository.create(newReminder);
    return this.formatReminderResponse(reminder);
  }

  async getReminderById(reminderId, userId) {
    const result = await this.reminderRepository.findByIdWithExam(reminderId);

    if (!result || !result.reminder) {
      throw new NotFoundError('Reminder not found');
    }

    // Verificar se o lembrete pertence ao usuário
    if (result.reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this reminder');
    }

    // Garantir que exam seja null se não existir
    const exam = result.exam && result.exam.id ? result.exam : null;
    return this.formatReminderResponse(result.reminder, exam);
  }

  async getRemindersByUser(userId, query) {
    const { reminders, total } = await this.reminderRepository.findByUserId(userId, query);

    const page = query.page || 1;
    const limit = query.limit || 50;

    return {
      data: reminders.map(reminder => this.formatReminderResponse(reminder)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRemindersByExam(examId, userId) {
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(examId, userId);

    const reminders = await this.reminderRepository.findByExamId(examId, userId);

    return reminders.map(reminder => this.formatReminderResponse(reminder));
  }

  async getUpcomingReminders(userId, daysAhead = 3) {
    const reminders = await this.reminderRepository.findUpcoming(userId, daysAhead);

    return reminders.map(item => {
      // Garantir que exam seja null se não existir
      const exam = item.exam && item.exam.id ? item.exam : null;
      return this.formatReminderResponse(item.reminder, exam);
    });
  }

  async updateReminder(reminderId, userId, data) {
    const result = await this.reminderRepository.findByIdWithExam(reminderId);

    if (!result || !result.reminder) {
      throw new NotFoundError('Reminder not found');
    }

    // Verificar se o lembrete pertence ao usuário
    if (result.reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this reminder');
    }

    const updateData = {};

    if (data.title !== undefined) {
      updateData.title = data.title;
    }

    if (data.reminderDate !== undefined) {
      updateData.reminderDate = await this.validateReminderDate(data.reminderDate);
    }

    if (data.examId !== undefined) {
      // Se mudar o exame, validar o novo exame (apenas se não for null)
      if (data.examId !== null) {
        await this.validateExamOwnership(data.examId, userId);
      }
      updateData.examId = data.examId;
    }

    if (data.requiresFasting !== undefined) {
      updateData.requiresFasting = data.requiresFasting ? 1 : 0;
    }

    if (data.fastingDuration !== undefined) {
      updateData.fastingDuration = data.fastingDuration || null;
    }

    if (data.fastingAlertTime !== undefined) {
      updateData.fastingAlertTime = data.fastingAlertTime || null;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }

    const updated = await this.reminderRepository.update(reminderId, updateData);

    if (!updated) {
      throw new NotFoundError('Failed to update reminder');
    }

    // Buscar o lembrete atualizado com o exame (se houver)
    const updatedResult = await this.reminderRepository.findByIdWithExam(reminderId);
    const exam = updatedResult && updatedResult.exam && updatedResult.exam.id ? updatedResult.exam : null;
    return this.formatReminderResponse(updated, exam);
  }

  async deleteReminder(reminderId, userId) {
    const result = await this.reminderRepository.findByIdWithExam(reminderId);

    if (!result || !result.reminder) {
      throw new NotFoundError('Reminder not found');
    }

    // Verificar se o lembrete pertence ao usuário
    if (result.reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this reminder');
    }

    const deleted = await this.reminderRepository.delete(reminderId);

    if (!deleted) {
      throw new NotFoundError('Failed to delete reminder');
    }
  }

  async deleteRemindersByExam(examId, userId) {
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(examId, userId);

    const deletedCount = await this.reminderRepository.deleteByExamId(examId);

    return { deletedCount };
  }

  async getReminderStats(userId) {
    const totalCount = await this.reminderRepository.countByUserId(userId);
    const upcomingCount = await this.reminderRepository.countUpcomingByUserId(userId);

    return {
      total: totalCount,
      upcoming: upcomingCount,
      past: totalCount - upcomingCount,
    };
  }
}


