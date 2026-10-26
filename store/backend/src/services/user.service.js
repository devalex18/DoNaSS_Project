const bcrypt = require('bcrypt');
const userModel = require('../models/user.model.js');
const httpError = require('../config/httpError.js');
const { ROLES, SECURITY } = require('../config/constants.js');

async function listUsers(query) {
  const isActive = query.active === undefined ? undefined : query.active === 'true';
  return userModel.findAll({ q: query.q, isActive });
}

async function createUser(data, creatorId) {
  const existing = await userModel.findByEmail(data.email);
  if (existing) {
    throw httpError(409, 'El correo ya está registrado');
  }

  const passwordHash = await bcrypt.hash(data.password, SECURITY.BCRYPT_ROUNDS);
  return userModel.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    passwordHash,
    isActive: true,
    mustChangePassword: true,
    createdById: creatorId,
  });
}

async function updateUser(id, data) {
  const user = await userModel.findById(id);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  if (data.email && data.email !== user.email) {
    const duplicate = await userModel.findByEmail(data.email);
    if (duplicate) throw httpError(409, 'El correo ya está registrado');
  }

  return userModel.update(id, data);
}

async function deactivateUser(targetId, currentAdminId) {
  if (targetId === currentAdminId) {
    throw httpError(409, 'No puedes eliminar tu propia cuenta');
  }

  const user = await userModel.findById(targetId);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  if (user.role === ROLES.ADMIN && user.isActive) {
    const activeAdmins = await userModel.countActiveAdmins();
    if (activeAdmins <= 1) {
      throw httpError(409, 'No se puede eliminar al último administrador activo');
    }
  }

  return userModel.update(targetId, {
    isActive: false,
    deactivatedAt: new Date(),
  });
}

async function reactivateUser(targetId, tempPassword) {
  const user = await userModel.findById(targetId);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  const passwordHash = await bcrypt.hash(tempPassword, SECURITY.BCRYPT_ROUNDS);
  return userModel.update(targetId, {
    isActive: true,
    deactivatedAt: null,
    passwordHash,
    mustChangePassword: true,
  });
}

async function resetTempPassword(targetId, tempPassword) {
  const user = await userModel.findById(targetId);
  if (!user) throw httpError(404, 'Usuario no encontrado');

  const passwordHash = await bcrypt.hash(tempPassword, SECURITY.BCRYPT_ROUNDS);
  return userModel.update(targetId, {
    passwordHash,
    mustChangePassword: true,
  });
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  resetTempPassword,
};