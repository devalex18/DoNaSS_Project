import { Product, Variant } from '@prisma/client';
import prisma from '../config/db';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';

export type ProductWithVariants = Product & { variants: Variant[] };

export async function findAllProducts(): Promise<ProductWithVariants[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    orderBy: { id: 'asc' },
  });
}

export async function findProductById(id: number): Promise<ProductWithVariants | null> {
  return prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
}

export async function findDuplicateProduct(
  name: string,
  variants: Array<{ size: string; color: string }>
): Promise<Product | null> {
  return prisma.product.findFirst({
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
}

export async function createProductRecord(productData: CreateProductInput): Promise<ProductWithVariants> {
  const { variants, ...rest } = productData;
  return prisma.product.create({
    data: {
      ...rest,
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
}

export async function updateProductWithAudit(
  productId: number,
  currentProduct: ProductWithVariants,
  updateData: UpdateProductInput,
  userId: number | null
): Promise<ProductWithVariants | null> {
  const { variantUpdates, ...productFields } = updateData;

  return prisma.$transaction(async (tx) => {
    if (productFields.price !== undefined && Number(productFields.price) !== Number(currentProduct.price)) {
      await tx.priceHistory.create({
        data: {
          productId,
          userId,
          previousPrice: currentProduct.price,
          newPrice: productFields.price,
        },
      });
    }

    if (variantUpdates && variantUpdates.length > 0) {
      for (const vu of variantUpdates) {
        const currentVariant = currentProduct.variants.find((v) => v.id === vu.variantId);
        if (currentVariant && currentVariant.stock !== vu.stock) {
          await tx.variant.update({
            where: { id: vu.variantId },
            data: { stock: vu.stock },
          });

          await tx.stockMovement.create({
            data: {
              variantId: vu.variantId,
              userId,
              previousValue: currentVariant.stock,
              newValue: vu.stock,
              reason: vu.reason ?? 'Ajuste manual de inventario',
            },
          });
        }
      }
    }

    await tx.product.update({
      where: { id: productId },
      data: productFields,
    });

    return tx.product.findUnique({
      where: { id: productId },
      include: { variants: true },
    });
  });
}