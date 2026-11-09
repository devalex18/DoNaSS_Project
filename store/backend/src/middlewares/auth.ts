import { Request, Response, NextFunction } from 'express';
import { verifyActiveUserById } from '../services/user.service';

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.session || !req.session.userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const activeUser = await verifyActiveUserById(req.session.userId);
    if (!activeUser) {
      req.session.destroy(() => {});
      res.status(401).json({ message: 'Sesión inválida o usuario inactivo' });
      return;
    }

    req.user = activeUser;
    next();
  } catch (err) {
    next(err);
  }
}