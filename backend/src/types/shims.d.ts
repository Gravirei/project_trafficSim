/**
 * Type shims for modules that ship without their own type definitions.
 * Keeps the rest of the typecheck green even when a dev dep is missing.
 */
declare module 'swagger-ui-express' {
  import type { RequestHandler, Request, Response, NextFunction } from 'express';
  const serve: RequestHandler[];
  function setup(
    spec: unknown,
    options?: { customSiteTitle?: string; [k: string]: unknown },
  ): (req: Request, res: Response, next: NextFunction) => void;
  const swaggerUi: { serve: RequestHandler[]; setup: typeof setup };
  export default swaggerUi;
}
