import { TermService } from '../services/term.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class TermController {
  constructor() {
    this.termService = new TermService();
  }

  /**
   * GET /api/term - Obter termo de responsabilidade atual
   */
  getTerm = async (req, res, next) => {
    try {
      const term = this.termService.getTermDetails();
      return ResponseUtil.success(res, term);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/term/accept - Aceitar termo de responsabilidade
   */
  acceptTerm = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { version } = req.body;

      const result = await this.termService.acceptTerm(userId, version);
      return ResponseUtil.success(res, result, 'Term accepted successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/term/status - Verificar status do aceite do termo
   */
  checkStatus = async (req, res, next) => {
    try {
      const userId = req.userId;

      const status = await this.termService.checkTermStatus(userId);
      return ResponseUtil.success(res, status);
    } catch (error) {
      next(error);
    }
  };
}

