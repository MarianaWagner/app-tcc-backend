import { ZodError } from 'zod';
import { ResponseUtil } from '../utils/response.util.js';

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return ResponseUtil.error(res, JSON.stringify(errors), 400);
      }
      return ResponseUtil.error(res, 'Validation failed', 400);
    }
  };
};

