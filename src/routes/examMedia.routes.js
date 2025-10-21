import { Router } from 'express';
import { ExamMediaController } from '../controllers/examMedia.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createMediaSchema,
  updateMediaSchema,
  getMediaSchema,
  deleteMediaSchema,
  listMediaByExamSchema,
  deleteMediaByExamSchema,
  getMediaCountSchema,
} from '../validators/examMedia.validator.js';

const router = Router();
const examMediaController = new ExamMediaController();

// Todas as rotas de exam-media requerem autenticação
router.use(authenticate);

// POST /api/exam-media - Criar uma nova mídia vinculada a um exame
router.post(
  '/',
  validate(createMediaSchema),
  examMediaController.createMedia
);

// GET /api/exam-media/:id - Obter uma mídia específica
router.get(
  '/:id',
  validate(getMediaSchema),
  examMediaController.getMedia
);

// GET /api/exam-media/exam/:examId - Listar todas as mídias de um exame
router.get(
  '/exam/:examId',
  validate(listMediaByExamSchema),
  examMediaController.listMediaByExam
);

// GET /api/exam-media/exam/:examId/count - Contar mídias de um exame
router.get(
  '/exam/:examId/count',
  validate(getMediaCountSchema),
  examMediaController.getMediaCount
);

// PUT /api/exam-media/:id - Atualizar uma mídia
router.put(
  '/:id',
  validate(updateMediaSchema),
  examMediaController.updateMedia
);

// PATCH /api/exam-media/:id - Atualizar parcialmente uma mídia
router.patch(
  '/:id',
  validate(updateMediaSchema),
  examMediaController.updateMedia
);

// DELETE /api/exam-media/:id - Deletar uma mídia específica
router.delete(
  '/:id',
  validate(deleteMediaSchema),
  examMediaController.deleteMedia
);

// DELETE /api/exam-media/exam/:examId - Deletar todas as mídias de um exame
router.delete(
  '/exam/:examId',
  validate(deleteMediaByExamSchema),
  examMediaController.deleteMediaByExam
);

export default router;


