import { Request, Response, NextFunction } from 'express';
import { authenticateUser } from '../services/auth.service';
import { serializeUser } from '../serializers/user.serializer';
import { Role, SECURITY } from '../config/constants';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await authenticateUser(email, password);

    req.session.userId = user.id;
    req.session.role = user.role as Role;

    res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export function logout(req: Request, res: Response, next: NextFunction): void {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(SECURITY.SESSION_COOKIE_NAME);
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
  });
}