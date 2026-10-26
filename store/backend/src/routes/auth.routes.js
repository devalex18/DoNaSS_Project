const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const requireAuth = require('../middlewares/auth');
const { loginSchema } = require('../validators/auth.validator');
const { SECURITY } = require('../config/constants');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: SECURITY.LOGIN_WINDOW_MS,
  max: SECURITY.LOGIN_MAX_ATTEMPTS,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos de inicio de sesión. Intenta más tarde.' },
});

router.post('/login', loginLimiter, validate(loginSchema), authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;