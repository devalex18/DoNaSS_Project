const userService = require('../services/user.service.js');
const { serializeUser } = require('../serializers/user.serializer.js');
const httpError = require('../config/httpError.js');

const parseId = (raw) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw httpError(400, 'ID de usuario inválido');
  return id;
};

async function list(req, res, next) {
  try {
    const users = await userService.listUsers(req.query);
    return res.status(200).json(users.map(serializeUser));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const user = await userService.createUser(req.body, req.user.id);
    return res.status(201).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const user = await userService.updateUser(parseId(req.params.id), req.body);
    return res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const user = await userService.deactivateUser(parseId(req.params.id), req.user.id);
    return res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

async function reactivate(req, res, next) {
  try {
    const user = await userService.reactivateUser(parseId(req.params.id), req.body.password);
    return res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const user = await userService.resetTempPassword(parseId(req.params.id), req.body.password);
    return res.status(200).json(serializeUser(user));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  create,
  update,
  remove,
  reactivate,
  resetPassword,
};