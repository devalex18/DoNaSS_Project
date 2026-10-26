const prisma = require('../config/db.js');

const findDuplicate = (name, variants) => 
  prisma.product.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      variants: {
        some: {
          OR: variants.map((v) => ({
            size: { equals: v.size, mode: 'insensitive' },
            color: { equals: v.color, mode: 'insensitive' },
          })),
        },
      },
    },
  });

const create = (data) => {
  const { variants, ...productData } = data;
  return prisma.product.create({
    data: {
      ...productData,
      variants: {
        create: variants.map((v) => ({
          size: v.size,
          color: v.color,
          stock: v.stock,
        })),
      },
    },
    include: { variants: true },
  });
};

module.exports = { findDuplicate, create };