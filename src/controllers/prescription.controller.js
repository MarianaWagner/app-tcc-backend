import { PrescriptionService } from '../services/prescription.service.js';
import { ResponseUtil } from '../utils/response.util.js';

export class PrescriptionController {
  constructor() {
    this.prescriptionService = new PrescriptionService();
  }

  create = async (req, res, next) => {
    try {
      const userId = req.userId;
      const data = req.body;
      const file = req.file;

      const prescription = await this.prescriptionService.createPrescription(userId, data, file);
      return ResponseUtil.created(res, prescription, 'Prescrição criada com sucesso.');
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const userId = req.userId;
      const result = await this.prescriptionService.listPrescriptions(userId, req.query || {});
      return ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const prescription = await this.prescriptionService.getPrescriptionById(id, userId);
      return ResponseUtil.success(res, prescription);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const data = req.body;
      const file = req.file;

      const prescription = await this.prescriptionService.updatePrescription(id, userId, data, file);
      return ResponseUtil.success(res, prescription, 'Prescrição atualizada com sucesso.');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const hard = req.query.hard === 'true';

      await this.prescriptionService.deletePrescription(id, userId, { hard });
      return ResponseUtil.success(res, null, 'Prescrição excluída com sucesso.');
    } catch (error) {
      next(error);
    }
  };

  download = async (req, res, next) => {
    try {
      const userId = req.userId;
      const { id } = req.params;

      const { path, filename, mimeType } = await this.prescriptionService.downloadAttachment(id, userId);

      res.setHeader('Content-Type', mimeType);
      return res.download(path, filename);
    } catch (error) {
      next(error);
    }
  };
}

