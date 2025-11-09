import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requireTermAcceptance } from '../middlewares/termAcceptance.middleware.js';
import { handleMulterError, uploadPrescriptionAttachment } from '../middlewares/upload.middleware.js';
import { validate } from '../middlewares/validation.middleware.js';
import {
  createPrescriptionSchema,
  deletePrescriptionSchema,
  downloadPrescriptionSchema,
  getPrescriptionSchema,
  listPrescriptionsSchema,
  updatePrescriptionSchema,
} from '../validators/prescription.validator.js';

const router = Router();
const prescriptionController = new PrescriptionController();

router.use(authenticate);
router.use(requireTermAcceptance);

router.post(
  '/',
  uploadPrescriptionAttachment,
  handleMulterError,
  validate(createPrescriptionSchema),
  prescriptionController.create
);

router.get(
  '/',
  validate(listPrescriptionsSchema),
  prescriptionController.list
);

router.get(
  '/:id/download',
  validate(downloadPrescriptionSchema),
  prescriptionController.download
);

router.get(
  '/:id',
  validate(getPrescriptionSchema),
  prescriptionController.getById
);

router.put(
  '/:id',
  uploadPrescriptionAttachment,
  handleMulterError,
  validate(updatePrescriptionSchema),
  prescriptionController.update
);

router.delete(
  '/:id',
  validate(deletePrescriptionSchema),
  prescriptionController.delete
);

export default router;

