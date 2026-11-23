import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, target: 'body' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = target === 'query' ? req.query : req.body; 
    const result = schema.safeParse(dataToValidate);
    if (!result.success) {
      res.status(422).json({
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }
    
    if (target === 'query') {
      res.locals.validateQuery = result.data;
    } else {
      req.body = result.data;
    }

    next();
  };
}