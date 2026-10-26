const bcrypt = require('bcrypt');
const userModel = require('../models/user.model.js');
const httpError = require('../config/httpError.js');

const GENERIC_ERROR = 'Correo o contraseña incorrectos';
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8D0R6V5P5K1.eH.q0T5Y5G6uH8yK2a';

async function authenticate(email, password) {
  const user = await userModel.findByEmail(email);

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

module.exports = { authenticate };