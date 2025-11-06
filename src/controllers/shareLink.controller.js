import { ShareLinkService } from '../services/shareLink.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class ShareLinkController {
  constructor() {
    this.shareLinkService = new ShareLinkService();
  }

  // Rotas protegidas (requerem autenticação)

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
        examId: req.query.examId,
      };

      const result = await this.shareLinkService.getShareLinksByUser(userId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getShareLinksByExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;

      const shareLinks = await this.shareLinkService.getShareLinksByExam(examId, userId);
      return ResponseUtil.success(res, shareLinks);
    } catch (error) {
      next(error);
    }
  };

  revokeShareLink = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const result = await this.shareLinkService.revokeShareLink(id, userId);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateExpiration = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { expiresInDays } = req.body;

      const shareLink = await this.shareLinkService.updateExpiration(id, userId, expiresInDays);
      return ResponseUtil.success(res, shareLink, 'Expiration updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteShareLink = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const result = await this.shareLinkService.deleteShareLink(id, userId);
      return ResponseUtil.success(res, result);
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

  getShareLinkStats = async (req, res, next) => {
    try {
      const userId = req.userId;

      const stats = await this.shareLinkService.getShareLinkStats(userId);
      return ResponseUtil.success(res, stats);
    } catch (error) {
      next(error);
    }
  };

  // Rotas públicas (não requerem autenticação)

  /**
   * GET /s/:code - Acesso público ao compartilhamento
   * Retorna informações do exame (sem dados sensíveis)
   */
  getShareByCode = async (req, res, next) => {
    try {
      const { code } = req.params;

      const share = await this.shareLinkService.getShareByCode(code);
      return ResponseUtil.success(res, share);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /s/:code/request-access - Solicitar acesso (envia OTP)
   */
  requestAccess = async (req, res, next) => {
    try {
      const { code } = req.params;
      const { email } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await this.shareLinkService.requestAccess(code, email, ipAddress, userAgent);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /s/:code/validate-otp - Validar OTP e obter token temporário
   */
  validateOTP = async (req, res, next) => {
    try {
      const { code } = req.params;
      const { email, otp } = req.body;
      const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await this.shareLinkService.validateOTP(code, email, otp, ipAddress, userAgent);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };
}
