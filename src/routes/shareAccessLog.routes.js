import { Router } from 'express';
import { ShareAccessLogController } from '../controllers/shareAccessLog.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createLogSchema,
  getLogsByShareIdSchema,
  getLogStatsSchema,
  deleteLogsSchema,
} from '../validators/shareAccessLog.validator.js';

const router = Router();
const shareAccessLogController = new ShareAccessLogController();

// Todas as rotas requerem autenticação
router.use(authenticate);

// POST /api/share-access-logs - Criar um log manualmente (geralmente feito pelo sistema)
router.post(
  '/',
  validate(createLogSchema),
  shareAccessLogController.createLog
);

// GET /api/share-access-logs/share/:shareId - Listar logs de um share link
router.get(
  '/share/:shareId',
  validate(getLogsByShareIdSchema),
  shareAccessLogController.getLogsByShareId
);

// GET /api/share-access-logs/share/:shareId/stats - Estatísticas de logs
router.get(
  '/share/:shareId/stats',
  validate(getLogStatsSchema),
  shareAccessLogController.getLogStats
);

// DELETE /api/share-access-logs/share/:shareId - Deletar todos os logs de um share link
router.delete(
  '/share/:shareId',
  validate(deleteLogsSchema),
  shareAccessLogController.deleteLogs
);

export default router;

