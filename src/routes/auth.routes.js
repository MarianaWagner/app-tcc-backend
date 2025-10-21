import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  verifyTokenSchema,
  refreshTokenSchema,
} from '../validators/auth.validator.js';

const router = Router();
const authController = new AuthController();

// ROTAS PÚBLICAS (sem autenticação)

// POST /api/auth/register - Registrar novo usuário
router.post(
  '/register',
  validate(registerSchema),
  authController.register
);

// POST /api/auth/login - Login (retorna token JWT)
router.post(
  '/login',
  validate(loginSchema),
  authController.login
);

// POST /api/auth/verify-token - Verificar se um token é válido
router.post(
  '/verify-token',
  validate(verifyTokenSchema),
  authController.verifyToken
);

// POST /api/auth/refresh-token - Renovar token JWT
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);

// ROTAS PROTEGIDAS (requerem autenticação)

router.use(authenticate);

// GET /api/auth/me - Obter dados do usuário logado
router.get(
  '/me',
  authController.getCurrentUser
);

// POST /api/auth/change-password - Alterar senha
router.post(
  '/change-password',
  validate(changePasswordSchema),
  authController.changePassword
);

// POST /api/auth/logout - Logout
router.post(
  '/logout',
  authController.logout
);

export default router;

