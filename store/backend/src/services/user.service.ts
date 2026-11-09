import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import {
  findUserByEmail,
  findUserById,
  findAllUsers,
  countActiveAdmins,
  createUserRecord,
  updateUserRecord,
} from '../models/user.model';
import { httpError } from '../config/httpError';
import { ROLES, Role, SECURITY } from '../config/constants';
import { CreateUserInput, UpdateUserInput } from '../validators/user.validator';
import { SessionUser } from '../types/express';

export async function verifyActiveUserById(userId: number): Promise<SessionUser | null> {
  const user = await findUserById(userId);
  if (!user || !user.isActive) {
    return null;
  }
  return {
    id: user.id,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function listUsers(query: { q?: string; active?: string }): Promise<User[]> {
  const isActive = query.active === undefined ? undefined : query.active === 'true';
  return findAllUsers({ q: query.q, isActive });
}

export async function createUser(data: CreateUserInput, creatorId: number): Promise<User> {
  const existing = await findUserByEmail(data.email);
  if (existing) {
    throw httpError(409, 'El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, SECURITY.BCRYPT_ROUNDS);
  return createUserRecord({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    role: data.role,
    passwordHash,
    isActive: true,
    mustChangePassword: true,
    createdById: creatorId,
  });
}

export async function updateUser(id: number, data: UpdateUserInput): Promise<User> {
  const user = await findUserById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  if (data.email && data.email !== user.email) {
    const duplicate = await findUserByEmail(data.email);
    if (duplicate) throw httpError(409, 'El correo ya está registrado');
  }

  return updateUserRecord(id, data);
}

export async function deactivateUser(targetId: number, currentAdminId: number): Promise<User> {
  if (targetId === currentAdminId) {
    throw httpError(409, 'No puedes eliminar tu propia cuenta');
  }

  const user = await findUserById(targetId);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  if (user.role === ROLES.ADMIN && user.isActive) {
    const activeAdmins = await countActiveAdmins();
    if (activeAdmins <= 1) {
      throw httpError(409, 'No se puede eliminar al último administrador activo');
    }
  }

  return updateUserRecord(targetId, {
    isActive: false,
    deactivatedAt: new Date(),
  });
}

export async function reactivateUser(targetId: number, tempPassword: string): Promise<User> {
  const user = await findUserById(targetId);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  const passwordHash = await bcrypt.hash(tempPassword, SECURITY.BCRYPT_ROUNDS);
  return updateUserRecord(targetId, {
    isActive: true,
    deactivatedAt: null,
    passwordHash,
    mustChangePassword: true,
  });
}

export async function resetTempPassword(targetId: number, tempPassword: string): Promise<User> {
  const user = await findUserById(targetId);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  const passwordHash = await bcrypt.hash(tempPassword, SECURITY.BCRYPT_ROUNDS);
  return updateUserRecord(targetId, {
    passwordHash,
    mustChangePassword: true,
  });
}