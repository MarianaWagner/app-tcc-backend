import { SharedExamService } from '../services/sharedExam.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class SharedExamController {
  constructor() {
    this.sharedExamService = new SharedExamService();
  }

  addExamToShare = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId, examId } = req.body;

      const sharedExam = await this.sharedExamService.addExamToShare(userId, shareId, examId);
      return ResponseUtil.created(res, sharedExam, 'Exam added to share link successfully');
    } catch (error) {
      next(error);
    }
  };

  getSharedExamsByShareId = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId } = req.params;

      const exams = await this.sharedExamService.getSharedExamsByShareId(userId, shareId);
      return ResponseUtil.success(res, exams);
    } catch (error) {
      next(error);
    }
  };

  getSharedExamsByExamId = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { examId } = req.params;

      const shares = await this.sharedExamService.getSharedExamsByExamId(userId, examId);
      return ResponseUtil.success(res, shares);
    } catch (error) {
      next(error);
    }
  };

  removeExamFromShare = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId, examId } = req.params;

      await this.sharedExamService.removeExamFromShare(userId, shareId, examId);
      return ResponseUtil.success(res, null, 'Exam removed from share link successfully');
    } catch (error) {
      next(error);
    }
  };

  getSharedExamCount = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { shareId } = req.params;

      const result = await this.sharedExamService.getSharedExamCount(userId, shareId);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };
}

