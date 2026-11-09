import bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { findUserByEmail } from '../models/user.model';
import { httpError } from '../config/httpError';

const GENERIC_ERROR = 'Correo o contraseña incorrectos';
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8D0R6V5P5K1.eH.q0T5Y5G6uH8yK2a';

export async function authenticateUser(email: string, password: string): Promise<User> {
  const user = await findUserByEmail(email);

  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    throw httpError(401, GENERIC_ERROR);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid || !user.isActive) {
    throw httpError(401, GENERIC_ERROR);
  }

  return user;
}