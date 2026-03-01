import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodObject, ZodRawShape, ZodType } from 'zod';
import logger from '../config/logger';

/**
 * Middleware factory that validates request body, params, and/or query
 * against provided Zod schemas.
 */
export const validateRequest = (schemas: {
  body?: ZodType;
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
}) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Record<string, string>;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Record<string, string>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: formattedErrors,
        });

        res.status(400).json({
          message: 'Validation error',
          errors: formattedErrors,
        });
        return;
      }
      next(error);
    }
  };
};
