import { Request, Response, NextFunction } from 'express';
import { Role } from '../config/constants';

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
      return;
    }
    next();
  };
}