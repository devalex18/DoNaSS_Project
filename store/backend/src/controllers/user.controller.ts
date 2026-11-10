import { Request, Response, NextFunction } from 'express';
import {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetTempPassword,
} from '../services/user.service';
import { serializeUser } from '../serializers/user.serializer';
import { httpError } from '../config/httpError';

function parseId(raw?: string): number {
  const id = Number(raw);
<<<<<<< Updated upstream
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID de usuario invalido');
=======
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID de usuario inválido');
>>>>>>> Stashed changes
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const active = typeof req.query.active === 'string' ? req.query.active : undefined;
    const users = await listUsers({ q, active });
    res.status(200).json(users.map(serializeUser));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await createUser(req.body, req.user!.id);
    res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await updateUser(parseId(req.params.id), req.body);
    res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await deactivateUser(parseId(req.params.id), req.user!.id);
    res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function reactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await reactivateUser(parseId(req.params.id), req.body.password);
    res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await resetTempPassword(parseId(req.params.id), req.body.password);
    res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}