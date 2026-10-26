const prisma = require('../config/db.js');
const { ROLES } = require('../config/constants.js');

const findByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });

const findById = (id) =>
  prisma.user.findUnique({ where: { id } });

const findAll = ({ q, isActive }) =>
  prisma.user.findMany({
    where: {
      ...(isActive !== undefined && { isActive }),
      ...(q && { name: { contains: q, mode: 'insensitive' } }),
    },
    orderBy: { id: 'asc' },
  });

const countActiveAdmins = () =>
  prisma.user.count({ where: { role: ROLES.ADMIN, isActive: true } });

const create = (data) =>
  prisma.user.create({ data });

const update = (id, data) =>
  prisma.user.update({ where: { id }, data });

module.exports = {
  findByEmail,
  findById,
  findAll,
  countActiveAdmins,
  create,
  update,
};