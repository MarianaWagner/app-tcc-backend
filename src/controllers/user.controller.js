import { UserService } from '../services/user.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class UserController {
  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req, res, next) => {
    try {
      const data = req.body;

      const user = await this.userService.createUser(data);
      return ResponseUtil.created(res, user, 'User created successfully');
    } catch (error) {
      next(error);
    }
  };

  getUser = async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await this.userService.getUserById(id);
      return ResponseUtil.success(res, user);
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req, res, next) => {
    try {
      const userId = req.userId;

      const user = await this.userService.getUserById(userId);
      return ResponseUtil.success(res, user);
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req, res, next) => {
    try {
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search,
        includeDeleted: req.query.includeDeleted === 'true',
      };

      const result = await this.userService.getAllUsers(query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const user = await this.userService.updateUser(id, data);
      return ResponseUtil.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  updateCurrentUser = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;

      const user = await this.userService.updateUser(userId, data);
      return ResponseUtil.success(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const hard = req.query.hard === 'true';

      await this.userService.deleteUser(id, hard);
      return ResponseUtil.success(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  restoreUser = async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await this.userService.restoreUser(id);
      return ResponseUtil.success(res, user, 'User restored successfully');
    } catch (error) {
      next(error);
    }
  };
}


