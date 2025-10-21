import { ShareAccessLogService } from '../services/shareAccessLog.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class ShareAccessLogController {
  constructor() {
    this.shareAccessLogService = new ShareAccessLogService();
  }

  createLog = async (req, res, next) => {
    try {
      const data = req.body;
      
      // Adicionar IP e User-Agent automaticamente se não fornecidos
      if (!data.ipAddress) {
        data.ipAddress = req.ip || req.connection.remoteAddress;
      }
      if (!data.userAgent) {
        data.userAgent = req.headers['user-agent'];
      }

      const log = await this.shareAccessLogService.createLog(data);
      return ResponseUtil.created(res, log, 'Log created successfully');
    } catch (error) {
      next(error);
    }
  };

  getLogsByShareId = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId } = req.params;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      };

      const result = await this.shareAccessLogService.getLogsByShareId(userId, shareId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getLogStats = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId } = req.params;

      const stats = await this.shareAccessLogService.getLogStats(userId, shareId);
      return ResponseUtil.success(res, stats);
    } catch (error) {
      next(error);
    }
  };

  deleteLogs = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId } = req.params;

      const result = await this.shareAccessLogService.deleteLogsByShareId(userId, shareId);
      return ResponseUtil.success(
        res, 
        result, 
        `${result.deletedCount} log(s) deleted successfully`
      );
    } catch (error) {
      next(error);
    }
  };
}

