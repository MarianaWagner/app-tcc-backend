import { ReminderService } from '../services/reminder.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class ReminderController {
  constructor() {
    this.reminderService = new ReminderService();
  }

  createReminder = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;

      const reminder = await this.reminderService.createReminder(userId, data);
      return ResponseUtil.created(res, reminder, 'Reminder created successfully');
    } catch (error) {
      next(error);
    }
  };

  getReminder = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const reminder = await this.reminderService.getReminderById(id, userId);
      return ResponseUtil.success(res, reminder);
    } catch (error) {
      next(error);
    }
  };

  listReminders = async (req, res, next) => {
    try {
      const userId = req.userId;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        upcoming: req.query.upcoming === 'true',
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };

      const result = await this.reminderService.getRemindersByUser(userId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  listRemindersByExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;

      const reminders = await this.reminderService.getRemindersByExam(examId, userId);
      return ResponseUtil.success(res, reminders);
    } catch (error) {
      next(error);
    }
  };

  getUpcomingReminders = async (req, res, next) => {
    try {
      const userId = req.userId;
      const daysAhead = req.query.daysAhead ? Number(req.query.daysAhead) : 3;

      const reminders = await this.reminderService.getUpcomingReminders(userId, daysAhead);
      return ResponseUtil.success(res, reminders);
    } catch (error) {
      next(error);
    }
  };

  getReminderStats = async (req, res, next) => {
    try {
      const userId = req.userId;

      const stats = await this.reminderService.getReminderStats(userId);
      return ResponseUtil.success(res, stats);
    } catch (error) {
      next(error);
    }
  };

  updateReminder = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const data = req.body;

      const reminder = await this.reminderService.updateReminder(id, userId, data);
      return ResponseUtil.success(res, reminder, 'Reminder updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteReminder = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      await this.reminderService.deleteReminder(id, userId);
      return ResponseUtil.success(res, null, 'Reminder deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteRemindersByExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;

      const result = await this.reminderService.deleteRemindersByExam(examId, userId);
      return ResponseUtil.success(
        res,
        result,
        `${result.deletedCount} reminder(s) deleted successfully`
      );
    } catch (error) {
      next(error);
    }
  };
}


