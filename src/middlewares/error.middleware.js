import { AppError } from '../utils/errors.util.js';
import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Erro não tratado
  console.error('Unhandled error:', err);
  
  return res.status(500).json({
    success: false,
    error: ENV.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};

