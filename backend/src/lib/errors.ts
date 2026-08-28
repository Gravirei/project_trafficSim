import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
