const authService = require('../services/auth.service.js');
const { serializeUser } = require('../serializers/user.serializer.js');
const { SECURITY } = require('../config/constants.js');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.authenticate(email, password);

    req.session.userId = user.id;
    req.session.role = user.role;

    return res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie(SECURITY.SESSION_COOKIE_NAME);
    return res.status(200).json({ message: 'Sesión cerrada correctamente' });
  });
}

module.exports = { login, logout };