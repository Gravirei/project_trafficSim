import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodError } from 'zod';

type Schemas = {
  body?: ZodObject<any>;
  query?: ZodObject<any>;
  params?: ZodObject<any>;
};

export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // mutate req.query in place (Express 5 makes query read-only, so assign via Object.defineProperty fallback)
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(400).json({
          error: 'Validation failed',
          details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        });
        return;
      }
      next(err);
    }
  };
}
