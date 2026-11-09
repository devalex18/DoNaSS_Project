import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/auth';
import { loginSchema } from '../validators/auth.validator';
import { SECURITY } from '../config/constants';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: SECURITY.LOGIN_WINDOW_MS,
  max: SECURITY.LOGIN_MAX_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta más tarde.' },
});

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/logout', requireAuth, logout);

export default router;