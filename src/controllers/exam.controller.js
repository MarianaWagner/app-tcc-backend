import { ExamService } from '../services/exam.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class ExamController {
  constructor() {
    this.examService = new ExamService();
  }

  createExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;
      const files = req.files || []; // Arquivos do multer

      const exam = await this.examService.createExam(userId, data, files);
      
      const message = files.length > 0 
        ? `Exam created successfully with ${files.length} file(s)` 
        : 'Exam created successfully';
      
      return ResponseUtil.created(res, exam, message);
    } catch (error) {
      next(error);
    }
  };

  getExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const exam = await this.examService.getExamById(id, userId);
      return ResponseUtil.success(res, exam);
    } catch (error) {
      next(error);
    }
  };

  listExams = async (req, res, next) => {
    try {
      const userId = req.userId;
      const query = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
        search: req.query.search,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        includeDeleted: req.query.includeDeleted === 'true',
      };

      const result = await this.examService.getExamsByUser(userId, query);
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  updateExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const data = req.body;

      const exam = await this.examService.updateExam(id, userId, data);
      return ResponseUtil.success(res, exam, 'Exam updated successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const hard = req.query.hard === 'true';

      await this.examService.deleteExam(id, userId, hard);
      return ResponseUtil.success(res, null, 'Exam deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  restoreExam = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const exam = await this.examService.restoreExam(id, userId);
      return ResponseUtil.success(res, exam, 'Exam restored successfully');
    } catch (error) {
      next(error);
    }
  };
}

