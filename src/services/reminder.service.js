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
      examId: reminder.examId,
      title: reminder.title,
      reminderDate: reminder.reminderDate?.toISOString() || null,
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
    // Validar que o exame existe e pertence ao usuário
    await this.validateExamOwnership(data.examId, userId);

    // Validar data do lembrete
    const reminderDate = await this.validateReminderDate(data.reminderDate);

    const newReminder = {
      userId,
      examId: data.examId,
      title: data.title,
      reminderDate,
    };

    const reminder = await this.reminderRepository.create(newReminder);
    return this.formatReminderResponse(reminder);
  }

  async getReminderById(reminderId, userId) {
    const result = await this.reminderRepository.findByIdWithExam(reminderId);

    if (!result) {
      throw new NotFoundError('Reminder not found');
    }

    // Verificar se o lembrete pertence ao usuário
    if (result.reminder.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this reminder');
    }

    return this.formatReminderResponse(result.reminder, result.exam);
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
    const allUpcoming = await this.reminderRepository.findUpcoming(daysAhead);

    // Filtrar apenas os lembretes do usuário
    const userReminders = allUpcoming.filter(
      item => item.reminder.userId === userId
    );

    return userReminders.map(item => 
      this.formatReminderResponse(item.reminder, item.exam)
    );
  }

  async updateReminder(reminderId, userId, data) {
    const result = await this.reminderRepository.findByIdWithExam(reminderId);

    if (!result) {
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
      // Se mudar o exame, validar o novo exame
      await this.validateExamOwnership(data.examId, userId);
      updateData.examId = data.examId;
    }

    const updated = await this.reminderRepository.update(reminderId, updateData);

    if (!updated) {
      throw new NotFoundError('Failed to update reminder');
    }

    return this.formatReminderResponse(updated);
  }

  async deleteReminder(reminderId, userId) {
    const result = await this.reminderRepository.findByIdWithExam(reminderId);

    if (!result) {
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


