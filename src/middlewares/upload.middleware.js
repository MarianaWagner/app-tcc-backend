import multer from 'multer';
import path, { dirname } from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_UPLOAD_DIR = process.env.BASE_UPLOAD_DIR || path.join(__dirname, '../../uploads');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const createStorage = (baseSubdir) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const uploadDir = path.join(BASE_UPLOAD_DIR, baseSubdir, String(year), month);
      ensureDirectory(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
      cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
    },
  });

const createFileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimes.join(', ')}`
      ),
      false
    );
  }
};

const createUploadMiddleware = ({
  baseSubdir,
  allowedMimes,
  maxFileSize,
  fieldName,
  maxFiles = 1,
}) => {
  ensureDirectory(BASE_UPLOAD_DIR);
  const storage = createStorage(baseSubdir);
  const fileFilter = createFileFilter(allowedMimes);
  const uploader = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
    },
  });

  return maxFiles > 1 ? uploader.array(fieldName, maxFiles) : uploader.single(fieldName);
};

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

const EXAM_ALLOWED_MIMES = [
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'video/mp4',
  'video/quicktime',
];

const PRESCRIPTION_ALLOWED_MIMES = [
  ...IMAGE_MIME_TYPES,
  'application/pdf',
];

export const uploadExamFiles = createUploadMiddleware({
  baseSubdir: 'exams',
  allowedMimes: EXAM_ALLOWED_MIMES,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  fieldName: 'files',
  maxFiles: 10,
});

export const uploadSingleFile = createUploadMiddleware({
  baseSubdir: 'exams',
  allowedMimes: EXAM_ALLOWED_MIMES,
  maxFileSize: 50 * 1024 * 1024,
  fieldName: 'file',
});

export const uploadPrescriptionAttachment = createUploadMiddleware({
  baseSubdir: 'prescriptions',
  allowedMimes: PRESCRIPTION_ALLOWED_MIMES,
  maxFileSize: 20 * 1024 * 1024, // 20MB
  fieldName: 'attachment',
});

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Please verify the maximum allowed size for this upload.',
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 10 files per upload.',
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`,
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }
  
  next();
};

