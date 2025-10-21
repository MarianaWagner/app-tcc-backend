import { ExamMediaService } from '../services/examMedia.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class ExamMediaController {
  constructor() {
    this.examMediaService = new ExamMediaService();
  }

  createMedia = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;

      const media = await this.examMediaService.createMedia(userId, data);
      return ResponseUtil.created(res, media, 'Media created successfully');
    } catch (error) {
      next(error);
    }
  };

  getMedia = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const media = await this.examMediaService.getMediaById(id, userId);
      return ResponseUtil.success(res, media);
    } catch (error) {
      next(error);
    }
  };

  listMediaByExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        mediaType: req.query.mediaType,
      };

      const result = await this.examMediaService.getMediasByExam(examId, userId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateMedia = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const data = req.body;

      const media = await this.examMediaService.updateMedia(id, userId, data);
      return ResponseUtil.success(res, media, 'Media updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteMedia = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      await this.examMediaService.deleteMedia(id, userId);
      return ResponseUtil.success(res, null, 'Media deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteMediaByExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;

      const result = await this.examMediaService.deleteMediasByExam(examId, userId);
      return ResponseUtil.success(
        res,
        result,
        `${result.deletedCount} media(s) deleted successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  getMediaCount = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;

      const result = await this.examMediaService.getMediaCount(examId, userId);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };
}


