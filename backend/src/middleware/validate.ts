import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny, ZodError } from 'zod';

type Schemas = {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
};

/**
 * Express middleware that validates `body`, `query`, and `params` against
 * provided zod schemas. On success, the parsed (and transformed) value
 * replaces the original. On failure, responds 400 with structured details.
 */
export function validate(schemas: Schemas) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        // Express 5 makes req.query a getter; reassign through the prototype
        // to apply the parsed/transformed value.
        const parsed = schemas.query.parse(req.query);
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        // params is always defined for matched routes, but typing requires a cast
        const parsed = schemas.params.parse(req.params) as Record<string, string>;
        Object.assign(req.params, parsed);
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
