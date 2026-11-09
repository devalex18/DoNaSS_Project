import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../config/httpError';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    res.status(400).json({ message: 'Formato JSON inválido' });
    return;
  }

  if (err instanceof HttpError && err.statusCode < 500) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    const customErr = err as { statusCode: number; message: string };
    if (customErr.statusCode < 500) {
      res.status(customErr.statusCode).json({ message: customErr.message });
      return;
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error('[Internal Error]:', err);
  }

  res.status(500).json({ message: 'Error interno del servidor' });
}