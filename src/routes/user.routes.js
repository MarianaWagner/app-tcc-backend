import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  deleteUserSchema,
  listUsersSchema,
} from '../validators/user.validator.js';

const router = Router();
const userController = new UserController();

// Rotas públicas (sem autenticação)
// POST /api/users - Criar um novo usuário (registro público)
router.post(
  '/',
  validate(createUserSchema),
  userController.createUser
);

// Rotas protegidas (requerem autenticação)
router.use(authenticate);

// GET /api/users/me - Obter dados do usuário logado
router.get(
  '/me',
  userController.getCurrentUser
);

// PUT /api/users/me - Atualizar dados do usuário logado
router.put(
  '/me',
  validate(updateUserSchema),
  userController.updateCurrentUser
);

// GET /api/users - Listar todos os usuários
router.get(
  '/',
  validate(listUsersSchema),
  userController.listUsers
);

// GET /api/users/:id - Obter um usuário específico
router.get(
  '/:id',
  validate(getUserSchema),
  userController.getUser
);

// PUT /api/users/:id - Atualizar um usuário
router.put(
  '/:id',
  validate(updateUserSchema),
  userController.updateUser
);

// PATCH /api/users/:id - Atualizar parcialmente um usuário
router.patch(
  '/:id',
  validate(updateUserSchema),
  userController.updateUser
);

// DELETE /api/users/:id - Deletar um usuário (soft delete por padrão)
// Query param: ?hard=true para hard delete
router.delete(
  '/:id',
  validate(deleteUserSchema),
  userController.deleteUser
);

// POST /api/users/:id/restore - Restaurar um usuário deletado
router.post(
  '/:id/restore',
  validate(getUserSchema),
  userController.restoreUser
);

export default router;


