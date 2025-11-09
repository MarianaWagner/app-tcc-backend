import { Router } from 'express';
import { ShareLinkController } from '../controllers/shareLink.controller.js';
import { ShareDownloadController } from '../controllers/shareDownload.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTermAcceptance } from '../middlewares/termAcceptance.middleware.js';
import { validateShareAccess } from '../middlewares/shareAccess.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createShareLinkSchema,
  getShareLinkSchema,
  deleteShareLinkSchema,
  listShareLinksSchema,
  getAccessLogsSchema,
  updateExpirationSchema,
} from '../validators/shareLink.validator.js';

const router = Router();
const shareLinkController = new ShareLinkController();
const shareDownloadController = new ShareDownloadController();

// ROTAS PÚBLICAS (sem autenticação) - Para quem está acessando o link compartilhado
// Formato: /s/:code

// GET /s/:code - Obter informações do compartilhamento (público)
router.get(
  '/:code',
  shareLinkController.getShareByCode
);

// POST /s/:code/request-access - Solicitar acesso (envia OTP)
router.post(
  '/:code/request-access',
  shareLinkController.requestAccess
);

// POST /s/:code/validate-otp - Validar OTP e obter token temporário
router.post(
  '/:code/validate-otp',
  shareLinkController.validateOTP
);

// Rotas protegidas por token temporário de compartilhamento
// GET /s/:code/files - Listar arquivos disponíveis
router.get(
  '/:code/files',
  validateShareAccess,
  shareDownloadController.listFiles
);

// GET /s/:code/files/:mediaId/download - Download de arquivo
router.get(
  '/:code/files/:mediaId/download',
  validateShareAccess,
  shareDownloadController.downloadFile
);

// GET /s/:code/download-all - Download de todos os arquivos como ZIP
router.get(
  '/:code/download-all',
  validateShareAccess,
  shareDownloadController.downloadAll
);

// ROTAS PROTEGIDAS (requerem autenticação) - Para o dono dos exames
// Formato: /api/share-links

const protectedRouter = Router();
protectedRouter.use(authenticate);
protectedRouter.use(requireTermAcceptance);

// POST /api/share-links - Criar um novo link de compartilhamento
protectedRouter.post(
  '/',
  validate(createShareLinkSchema),
  shareLinkController.createShareLink
);

// GET /api/share-links - Listar todos os links do usuário
protectedRouter.get(
  '/',
  validate(listShareLinksSchema),
  shareLinkController.listShareLinks
);

// GET /api/share-links/stats - Estatísticas de links do usuário
protectedRouter.get(
  '/stats',
  shareLinkController.getShareLinkStats
);

// GET /api/share-links/exam/:examId - Listar compartilhamentos de um exame específico
protectedRouter.get(
  '/exam/:examId',
  shareLinkController.getShareLinksByExam
);

// GET /api/share-links/:id - Obter um link específico
protectedRouter.get(
  '/:id',
  validate(getShareLinkSchema),
  shareLinkController.getShareLink
);

// PATCH /api/share-links/:id/expiration - Atualizar expiração
protectedRouter.patch(
  '/:id/expiration',
  validate(updateExpirationSchema),
  shareLinkController.updateExpiration
);

// POST /api/share-links/:id/revoke - Revogar compartilhamento
protectedRouter.post(
  '/:id/revoke',
  validate(getShareLinkSchema),
  shareLinkController.revokeShareLink
);

// DELETE /api/share-links/:id - Deletar um link de compartilhamento
protectedRouter.delete(
  '/:id',
  validate(deleteShareLinkSchema),
  shareLinkController.deleteShareLink
);

// GET /api/share-links/:id/logs - Ver logs de acesso de um link
protectedRouter.get(
  '/:id/logs',
  validate(getAccessLogsSchema),
  shareLinkController.getAccessLogs
);

export default router;
export { protectedRouter as shareLinkProtectedRoutes };
