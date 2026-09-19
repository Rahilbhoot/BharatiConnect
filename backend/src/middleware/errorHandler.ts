import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ZodError } from 'zod';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.errors
    });
  }

  if (err.name === 'ValidationError') { // Mongoose validation error
    return res.status(400).json({
      status: 'error',
      message: err.message
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }

  console.error('Unhandled Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error'
  });
};
