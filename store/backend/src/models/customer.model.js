const prisma = require('../config/db.js');

const findByPhone = (phone) => prisma.customer.findUnique({ where: { phone } });
const findById = (id) => prisma.customer.findUnique({ where: { id } });

const search = (q) =>
  prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q } },
          ],
        }
      : {},
    orderBy: { name: 'asc' },
  });

const create = (data) => prisma.customer.create({ data });

module.exports = { findByPhone, findById, search, create };