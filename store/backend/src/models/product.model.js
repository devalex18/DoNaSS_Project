const prisma = require('../config/db');
const findById = (id) =>
  prisma.product.findUnique({
    where: { id },
    include: {
      variants: true,
      priceHistory: { orderBy: { changedAt: 'desc' } },
    },
  });

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


const updateWithHistory = async (id, currentProduct, data, userId) => {
  const { variants, ...fieldsToUpdate } = data;

  return prisma.$transaction(async (tx) => {
    if (
      fieldsToUpdate.price !== undefined &&
      Number(fieldsToUpdate.price) !== Number(currentProduct.price)
    ) {
      await tx.priceHistory.create({
        data: {
          productId: id,
          userId: userId ?? null,
          previousPrice: currentProduct.price,
          newPrice: fieldsToUpdate.price,
        },
      });
    }
    if (Array.isArray(variants)) {
      for (const v of variants) {
        const existingVariant = currentProduct.variants.find(
          (ev) =>
            (v.id && ev.id === v.id) ||
            (ev.size.toLowerCase() === v.size.toLowerCase() &&
              ev.color.toLowerCase() === v.color.toLowerCase())
        );

        if (existingVariant) {
          if (existingVariant.stock !== v.stock) {
            await tx.variant.update({
              where: { id: existingVariant.id },
              data: { stock: v.stock, size: v.size, color: v.color },
            });
            await tx.stockMovement.create({
              data: {
                variantId: existingVariant.id,
                userId: userId ?? null,
                previousValue: existingVariant.stock,
                newValue: v.stock,
                reason: 'ajuste',
              },
            });
          }
        } else {
          const createdVar = await tx.variant.create({
            data: {
              productId: id,
              size: v.size,
              color: v.color,
              stock: v.stock,
            },
          });
          await tx.stockMovement.create({
            data: {
              variantId: createdVar.id,
              userId: userId ?? null,
              previousValue: 0,
              newValue: v.stock,
              reason: 'ajuste',
            },
          });
        }
      }
    }
    return tx.product.update({
      where: { id },
      data: fieldsToUpdate,
      include: {
        variants: true,
        priceHistory: { orderBy: { changedAt: 'desc' } },
      },
    });
  });
};
module.exports = {
  findById,
  findDuplicate,
  create,
  updateWithHistory,
};