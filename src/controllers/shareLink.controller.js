import { ShareLinkService } from '../services/shareLink.service.js';
import { ResponseUtil } from '../utils/response.util.js';
import { requestAccessSchema, validateOTPSchema } from '../validators/shareLink.validator.js';
import { AppError, ValidationError, UnauthorizedError } from '../utils/errors.util.js';

const wantsHtmlResponse = (req) => {
  const accept = req.headers.accept || '';
  const contentType = req.headers['content-type'] || '';
  const prefersJson = accept.includes('application/json') || contentType.includes('application/json');

  if (prefersJson) {
    return false;
  }

  return accept.includes('text/html') || accept === '*/*' || accept === '';
};

const extractClientInfo = (req) => {
  const ipAddress =
    req.ip ||
    req.connection?.remoteAddress ||
    req.headers['x-forwarded-for'] ||
    'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  return { ipAddress, userAgent };
};

export class ShareLinkController {
  constructor() {
    this.shareLinkService = new ShareLinkService();
  }

  shouldRenderHtml = (req) => wantsHtmlResponse(req);

  renderShareView = async (req, res, overrides = {}) => {
    const { code } = req.params;
    let summary = overrides.hasOwnProperty('summary') ? overrides.summary : undefined;

    if (summary === undefined) {
      try {
        const result = await this.shareLinkService.getShareSummary(
          code,
          overrides.token ? { checkMaxUses: false } : undefined,
        );
        summary = result.summary;
      } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).render('share/page', {
          code,
          state: 'error',
          summary: null,
          errorMessage: error.message,
        });
      }
    }

    // Garantir que summary sempre seja passado (mesmo que null)
    if (summary === undefined) {
      summary = null;
    }

    const statusCode = overrides.status || 200;

    return res.status(statusCode).render('share/page', {
      code,
      state: overrides.state || 'email',
      summary,
      email: overrides.email || '',
      share: overrides.share || null,
      token: overrides.token || null,
      successMessage: overrides.successMessage || null,
      errorMessage: overrides.errorMessage || null,
    });
  };

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
    const { code } = req.params;

    if (!this.shouldRenderHtml(req)) {
      try {
        const share = await this.shareLinkService.getShareByCode(code);
        return ResponseUtil.success(res, share);
      } catch (error) {
        return next(error);
      }
    }

    const { token } = req.query;

    let summaryResult;
    try {
      summaryResult = await this.shareLinkService.getShareSummary(
        code,
        token ? { checkMaxUses: false } : undefined,
      );
    } catch (error) {
      const statusCode = error.statusCode || 500;
      return this.renderShareView(req, res, {
        state: 'error',
        status: statusCode,
        summary: null,
        errorMessage: error.message,
      });
    }

    const summary = summaryResult.summary;
    const { ipAddress, userAgent } = extractClientInfo(req);

    if (token) {
      try {
        const { content } = await this.shareLinkService.getShareContentForToken(
          code,
          token,
          ipAddress,
          userAgent,
        );

        return this.renderShareView(req, res, {
          state: 'documents',
          summary,
          share: content,
          token,
        });
      } catch (error) {
        const statusCode = error.statusCode || 401;
        return this.renderShareView(req, res, {
          state: 'email',
          summary,
          status: statusCode,
          errorMessage: error.message,
        });
      }
    }

    const state = req.query.step === 'otp' ? 'otp' : 'email';
    const email = typeof req.query.email === 'string' ? req.query.email : '';

    return this.renderShareView(req, res, {
      state,
      summary,
      email,
    });
  };

  /**
   * POST /s/:code/request-access - Solicitar acesso (envia OTP)
   */
  requestAccess = async (req, res, next) => {
    const prefersHtml = this.shouldRenderHtml(req);

    try {
      await requestAccessSchema.parseAsync({
        params: req.params,
        body: req.body,
      });
    } catch (error) {
      if (prefersHtml) {
        const message = error?.errors?.[0]?.message || 'Dados inválidos';
        return this.renderShareView(req, res, {
          state: 'email',
          status: 400,
          email: req.body?.email || '',
          summary: null,
          errorMessage: message,
        });
      }

      if (error instanceof AppError) {
        return next(error);
      }

      return ResponseUtil.error(res, 'Validation failed', 400);
    }

    try {
      const { code } = req.params;
      const { email } = req.body;
      const { ipAddress, userAgent } = extractClientInfo(req);

      const result = await this.shareLinkService.requestAccess(code, email, ipAddress, userAgent);

      if (prefersHtml) {
        return this.renderShareView(req, res, {
          state: 'otp',
          email,
          summary: null,
          successMessage: 'Enviamos um código de verificação para o seu e-mail.',
        });
      }

      return ResponseUtil.success(res, result);
    } catch (error) {
      if (!prefersHtml) {
        return next(error);
      }

      const statusCode = error.statusCode || 500;
      const { email } = req.body || {};

      if (error instanceof ValidationError || error instanceof UnauthorizedError) {
        return this.renderShareView(req, res, {
          state: 'email',
          status: statusCode,
          email,
          summary: null,
          errorMessage: error.message,
        });
      }

      return this.renderShareView(req, res, {
        state: 'error',
        status: statusCode,
        summary: null,
        errorMessage: error.message,
      });
    }
  };

  /**
   * POST /s/:code/validate-otp - Validar OTP e obter token temporário
   */
  validateOTP = async (req, res, next) => {
    const prefersHtml = this.shouldRenderHtml(req);

    try {
      await validateOTPSchema.parseAsync({
        params: req.params,
        body: req.body,
      });
    } catch (error) {
      if (prefersHtml) {
        const message = error?.errors?.[0]?.message || 'Dados inválidos';
        return this.renderShareView(req, res, {
          state: 'otp',
          status: 400,
          email: req.body?.email || '',
          summary: null,
          errorMessage: message,
        });
      }

      if (error instanceof AppError) {
        return next(error);
      }

      return ResponseUtil.error(res, 'Validation failed', 400);
    }

    try {
      const { code } = req.params;
      const { email, otp } = req.body;
      const { ipAddress, userAgent } = extractClientInfo(req);

      const result = await this.shareLinkService.validateOTP(code, email, otp, ipAddress, userAgent);

      if (prefersHtml) {
        const redirectUrl = `/s/${code}?token=${encodeURIComponent(result.accessToken)}`;
        return res.redirect(303, redirectUrl);
      }

      return ResponseUtil.success(res, result);
    } catch (error) {
      if (!prefersHtml) {
        return next(error);
      }

      const statusCode = error.statusCode || 500;
      const { email } = req.body || {};
      const isRecoverable = error instanceof ValidationError || error instanceof UnauthorizedError;

      return this.renderShareView(req, res, {
        state: isRecoverable ? 'otp' : 'error',
        status: statusCode,
        email,
        summary: null,
        errorMessage: error.message,
      });
    }
  };
}
