import { ShareLinkService } from '../services/shareLink.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class ShareLinkController {
  constructor() {
    this.shareLinkService = new ShareLinkService();
  }

  createShareLink = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;

      const shareLink = await this.shareLinkService.createShareLink(userId, data);
      return ResponseUtil.created(res, shareLink, 'Share link created successfully');
    } catch (error) {
      next(error);
    }
  };

  getShareLink = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const shareLink = await this.shareLinkService.getShareLinkById(id, userId);
      return ResponseUtil.success(res, shareLink);
    } catch (error) {
      next(error);
    }
  };

  listShareLinks = async (req, res, next) => {
    try {
      const userId = req.userId;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        active: req.query.active === 'true',
      };

      const result = await this.shareLinkService.getShareLinksByUser(userId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getShareLinkStats = async (req, res, next) => {
    try {
      const userId = req.userId;

      const stats = await this.shareLinkService.getShareLinkStats(userId);
      return ResponseUtil.success(res, stats);
    } catch (error) {
      next(error);
    }
  };

  deleteShareLink = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      await this.shareLinkService.deleteShareLink(id, userId);
      return ResponseUtil.success(res, null, 'Share link deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  getAccessLogs = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await this.shareLinkService.getAccessLogs(id, userId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  // Rotas públicas (não requerem autenticação)
  
  requestAccess = async (req, res, next) => {
    try {
      const { token, contact } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.shareLinkService.requestAccess(token, contact, ipAddress, userAgent);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  validateOTP = async (req, res, next) => {
    try {
      const { token, contact, otp } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await this.shareLinkService.validateOTP(token, contact, otp, ipAddress, userAgent);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };
}


