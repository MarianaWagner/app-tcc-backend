import { Router } from 'express';
import { ReminderController } from '../controllers/reminder.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createReminderSchema,
  updateReminderSchema,
  getReminderSchema,
  deleteReminderSchema,
  listRemindersSchema,
  listRemindersByExamSchema,
  deleteRemindersByExamSchema,
  getUpcomingRemindersSchema,
} from '../validators/reminder.validator.js';

const router = Router();
const reminderController = new ReminderController();

// Todas as rotas de reminder requerem autenticação
router.use(authenticate);

// POST /api/reminders - Criar um novo lembrete
router.post(
  '/',
  validate(createReminderSchema),
  reminderController.createReminder
);

// GET /api/reminders - Listar todos os lembretes do usuário
router.get(
  '/',
  validate(listRemindersSchema),
  reminderController.listReminders
);

// GET /api/reminders/upcoming - Listar lembretes próximos (nos próximos N dias)
router.get(
  '/upcoming',
  validate(getUpcomingRemindersSchema),
  reminderController.getUpcomingReminders
);

// GET /api/reminders/stats - Estatísticas de lembretes do usuário
router.get(
  '/stats',
  reminderController.getReminderStats
);

// GET /api/reminders/exam/:examId - Listar lembretes de um exame específico
router.get(
  '/exam/:examId',
  validate(listRemindersByExamSchema),
  reminderController.listRemindersByExam
);

// GET /api/reminders/:id - Obter um lembrete específico
router.get(
  '/:id',
  validate(getReminderSchema),
  reminderController.getReminder
);

// PUT /api/reminders/:id - Atualizar um lembrete
router.put(
  '/:id',
  validate(updateReminderSchema),
  reminderController.updateReminder
);

// PATCH /api/reminders/:id - Atualizar parcialmente um lembrete
router.patch(
  '/:id',
  validate(updateReminderSchema),
  reminderController.updateReminder
);

// DELETE /api/reminders/:id - Deletar um lembrete
router.delete(
  '/:id',
  validate(deleteReminderSchema),
  reminderController.deleteReminder
);

// DELETE /api/reminders/exam/:examId - Deletar todos os lembretes de um exame
router.delete(
  '/exam/:examId',
  validate(deleteRemindersByExamSchema),
  reminderController.deleteRemindersByExam
);

export default router;


