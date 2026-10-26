const ROLES = Object.freeze({
  ADMIN: 'administrador',
  EMPLOYEE: 'empleado',
});

const SECURITY = Object.freeze({
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 10),
  SESSION_TIMEOUT_MS: Number(process.env.SESSION_TIMEOUT_MIN ?? 30) * 60 * 1000,
  LOGIN_WINDOW_MS: Number(process.env.LOGIN_WINDOW_MIN ?? 15) * 60 * 1000,
  LOGIN_MAX_ATTEMPTS: Number(process.env.LOGIN_MAX_ATTEMPTS ?? 5),
  SESSION_COOKIE_NAME: 'store.sid',
});

module.exports = { ROLES, SECURITY };