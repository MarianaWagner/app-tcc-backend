import { Router } from 'express';
import { TermController } from '../controllers/term.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import { acceptTermSchema } from '../validators/term.validator.js';

const router = Router();
const termController = new TermController();

// GET /api/term - Obter termo atual (público, não requer autenticação)
router.get('/', termController.getTerm);

// Rotas que requerem autenticação
router.use(authenticate);

// GET /api/term/status - Verificar status do aceite
router.get('/status', termController.checkStatus);

// POST /api/term/accept - Aceitar termo
router.post(
  '/accept',
  validate(acceptTermSchema),
  termController.acceptTerm
);

export default router;

