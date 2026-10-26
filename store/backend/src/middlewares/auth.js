const userModel = require('../models/user.model.js');

async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const user = await userModel.findById(req.session.userId);
    if (!user || !user.isActive) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Sesión inválida o usuario inactivo' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = requireAuth;