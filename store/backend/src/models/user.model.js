const prisma = require('../config/db.js');

const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findById = (id) =>
  prisma.user.findUnique({ where: { id } });

module.exports = {
  findByEmail,
  findById,
};