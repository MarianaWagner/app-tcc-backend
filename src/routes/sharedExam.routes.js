import { Router } from 'express';
import { SharedExamController } from '../controllers/sharedExam.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  addExamToShareSchema,
  removeExamFromShareSchema,
  getSharedExamsByShareIdSchema,
  getSharedExamsByExamIdSchema,
  getSharedExamCountSchema,
} from '../validators/sharedExam.validator.js';

const router = Router();
const sharedExamController = new SharedExamController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// POST /api/shared-exams - Adicionar um exame a um link de compartilhamento
router.post(
  '/',
  validate(addExamToShareSchema),
  sharedExamController.addExamToShare
);

// GET /api/shared-exams/share/:shareId - Listar exames de um share link
router.get(
  '/share/:shareId',
  validate(getSharedExamsByShareIdSchema),
  sharedExamController.getSharedExamsByShareId
);

// GET /api/shared-exams/share/:shareId/count - Contar exames de um share link
router.get(
  '/share/:shareId/count',
  validate(getSharedExamCountSchema),
  sharedExamController.getSharedExamCount
);

// GET /api/shared-exams/exam/:examId - Listar share links que contêm este exame
router.get(
  '/exam/:examId',
  validate(getSharedExamsByExamIdSchema),
  sharedExamController.getSharedExamsByExamId
);

// DELETE /api/shared-exams/share/:shareId/exam/:examId - Remover exame de um share link
router.delete(
  '/share/:shareId/exam/:examId',
  validate(removeExamFromShareSchema),
  sharedExamController.removeExamFromShare
);

export default router;

