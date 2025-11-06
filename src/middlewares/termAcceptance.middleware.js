import { UserRepository } from '../repositories/user.repository.js';
import { ForbiddenError } from '../utils/errors.util.js';

/**
 * Middleware que verifica se o usuário aceitou o termo de responsabilidade
 * Bloqueia o acesso se o termo não foi aceito
 */
export const requireTermAcceptance = async (req, res, next) => {
  try {
    if (!req.userId) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const userRepository = new UserRepository();
    const user = await userRepository.findById(req.userId);

    if (!user) {
      return next(new ForbiddenError('User not found'));
    }

    // Verificar se o termo foi aceito
    if (!user.termAccepted || !user.termVersion) {
      return res.status(403).json({
        success: false,
        error: 'Term of responsibility not accepted',
        code: 'TERM_NOT_ACCEPTED',
        message: 'You must accept the terms of responsibility to access the application',
      });
    }

    // Adicionar informação do termo ao request
    req.user.termAccepted = user.termAccepted;
    req.user.termVersion = user.termVersion;

    next();
  } catch (error) {
    next(error);
  }
};

