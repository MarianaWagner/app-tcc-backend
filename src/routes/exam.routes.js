import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { uploadExamFiles, handleMulterError } from '../middlewares/upload.middleware.js';
import {
  createExamSchema,
  updateExamSchema,
  getExamSchema,
  deleteExamSchema,
  listExamsSchema,
} from '../validators/exam.validator.js';

const router = Router();
const examController = new ExamController();

// Todas as rotas de exam requerem autenticação
router.use(authenticate);

// POST /api/exams - Criar um novo exame (com upload de arquivos)
router.post(
  '/',
  uploadExamFiles,
  handleMulterError,
  validate(createExamSchema),
  examController.createExam
);

// GET /api/exams - Listar todos os exames do usuário
router.get(
  '/',
  validate(listExamsSchema),
  examController.listExams
);

// GET /api/exams/:id - Obter um exame específico
router.get(
  '/:id',
  validate(getExamSchema),
  examController.getExam
);

// PUT /api/exams/:id - Atualizar um exame
router.put(
  '/:id',
  validate(updateExamSchema),
  examController.updateExam
);

// PATCH /api/exams/:id - Atualizar parcialmente um exame (usa o mesmo schema)
router.patch(
  '/:id',
  validate(updateExamSchema),
  examController.updateExam
);

// DELETE /api/exams/:id - Deletar um exame (soft delete por padrão)
// Query param: ?hard=true para hard delete
router.delete(
  '/:id',
  validate(deleteExamSchema),
  examController.deleteExam
);

// POST /api/exams/:id/restore - Restaurar um exame deletado
router.post(
  '/:id/restore',
  validate(getExamSchema),
  examController.restoreExam
);

export default router;

