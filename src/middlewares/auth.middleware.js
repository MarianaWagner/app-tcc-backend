import { JwtUtil } from '../utils/jwt.util.js';
import { UnauthorizedError } from '../utils/errors.util.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      const decoded = JwtUtil.verify(token);
      
      req.userId = decoded.userId;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        name: decoded.name || '',
      };

      next();
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = JwtUtil.verify(token);
        req.userId = decoded.userId;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name || '',
        };
      } catch (error) {
        // Token inválido, mas não bloqueia a requisição
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

