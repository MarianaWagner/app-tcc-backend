import { AuthService } from '../services/auth.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class AuthController {
  constructor() {
    this.authService = new AuthService();
  }

  register = async (req, res, next) => {
    try {
      const data = req.body;

      const result = await this.authService.register(data);
      return ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const data = req.body;

      const result = await this.authService.login(data);
      return ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  verifyToken = async (req, res, next) => {
    try {
      const { token } = req.body;

      const result = await this.authService.verifyToken(token);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req, res, next) => {
    try {
      const { token } = req.body;

      const result = await this.authService.refreshToken(token);
      return ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;

      const result = await this.authService.changePassword(userId, data);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req, res, next) => {
    try {
      const userId = req.userId;

      const result = await this.authService.getCurrentUser(userId);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      // Em uma implementação real com refresh tokens armazenados,
      // você invalidaria o token aqui (ex: adicionar a uma blacklist)
      // Por ora, o logout é tratado no cliente (removendo o token)
      
      return ResponseUtil.success(res, { message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  };
}

