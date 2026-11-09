import { required } from './index';

export const ROLES = Object.freeze({
  ADMIN: 'administrador',
  EMPLOYEE: 'empleado',
} as const);

export type Role = (typeof ROLES)[keyof typeof ROLES];

const bcryptRounds = Number(required('BCRYPT_ROUNDS'));
const sessionTimeoutMin = Number(required('SESSION_TIMEOUT_MIN'));
const loginWindowMin = Number(required('LOGIN_WINDOW_MIN'));
const loginMaxAttempts = Number(required('LOGIN_MAX_ATTEMPTS'));

export const SECURITY = Object.freeze({
  BCRYPT_ROUNDS: bcryptRounds,
  SESSION_TIMEOUT_MS: sessionTimeoutMin * 60 * 1000,
  LOGIN_WINDOW_MS: loginWindowMin * 60 * 1000,
  LOGIN_MAX_ATTEMPTS: loginMaxAttempts,
  SESSION_COOKIE_NAME: 'store.sid',
});