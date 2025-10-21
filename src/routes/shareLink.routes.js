import { Router } from 'express';
import { ShareLinkController } from '../controllers/shareLink.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createShareLinkSchema,
  getShareLinkSchema,
  deleteShareLinkSchema,
  listShareLinksSchema,
  requestAccessSchema,
  validateOTPSchema,
  getAccessLogsSchema,
} from '../validators/shareLink.validator.js';

const router = Router();
const shareLinkController = new ShareLinkController();

// ROTAS PÚBLICAS (sem autenticação) - Para quem está acessando o link compartilhado

// POST /api/share-links/request-access - Solicitar acesso (envia OTP)
router.post(
  '/request-access',
  validate(requestAccessSchema),
  shareLinkController.requestAccess
);

// POST /api/share-links/validate-otp - Validar OTP e obter acesso
router.post(
  '/validate-otp',
  validate(validateOTPSchema),
  shareLinkController.validateOTP
);

// ROTAS PROTEGIDAS (requerem autenticação) - Para o dono dos exames

router.use(authenticate);

// POST /api/share-links - Criar um novo link de compartilhamento
router.post(
  '/',
  validate(createShareLinkSchema),
  shareLinkController.createShareLink
);

// GET /api/share-links - Listar todos os links do usuário
router.get(
  '/',
  validate(listShareLinksSchema),
  shareLinkController.listShareLinks
);

// GET /api/share-links/stats - Estatísticas de links do usuário
router.get(
  '/stats',
  shareLinkController.getShareLinkStats
);

// GET /api/share-links/:id - Obter um link específico
router.get(
  '/:id',
  validate(getShareLinkSchema),
  shareLinkController.getShareLink
);

// DELETE /api/share-links/:id - Deletar um link de compartilhamento
router.delete(
  '/:id',
  validate(deleteShareLinkSchema),
  shareLinkController.deleteShareLink
);

// GET /api/share-links/:id/logs - Ver logs de acesso de um link
router.get(
  '/:id/logs',
  validate(getAccessLogsSchema),
  shareLinkController.getAccessLogs
);

export default router;

