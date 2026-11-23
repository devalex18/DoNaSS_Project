import { Prisma, Product, Supplier, Variant } from '@prisma/client';
import prisma from '../config/db';
import {
  //CatalogSortField,
  CreateProductInput,
  SearchProductsQuery,
  UpdateProductInput,
} from '../validators/product.validator'

const PRODUCT_INCLUDE = {
  variants: { orderBy: { id: 'asc' as const } },
  supplier: true,
};

export type ProductWithRelations = Product & {
  variants: Variant[];
  supplier?: Supplier | null;
};

function buildProductWhereClause(
  filters: SearchProductsQuery & { includeInactive?: boolean }
): Prisma.ProductWhereInput {
  const { q, size, color, department, includeInactive = false } = filters;
  const variantFilter: Prisma.VariantWhereInput = {
    ...(size ? { size: { equals: size, mode: 'insensitive' } } : {}),
    ...(color ? { color: {equals: color, mode: 'insensitive' } } : {}),
  };

  const hasVariantFilter = Boolean(size || color);

  return {
    ...( includeInactive ? {} : { isActive: true }),
    ...( department ? { department: { equals: department, mode: 'insensitive' } } : {} ),
    ...(q ? { OR: [
          { name: { contains: q, mode: 'insensitive' } },
          //{ sku: { contains: q, mode: 'insensitive' } },
        ],
      } : {}
    ),
    ...(hasVariantFilter ? { variants : { some: variantFilter } } : {}),
  };
}

export async function searchActiveProducts(
  filters: SearchProductsQuery
): Promise<ProductWithRelations[]> {
  return prisma.product.findMany({
    where: buildProductWhereClause({ ...filters, includeInactive: false }),
    include: PRODUCT_INCLUDE,
    orderBy: { name: 'asc' },
  });
}

export type ProductWithVariants = Product & { variants: Variant[] };

export async function findAllProducts(): Promise<ProductWithVariants[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { variants: true },
    orderBy: { id: 'asc' },
  });
}

export async function findProductById(id: number): Promise<ProductWithRelations | null> {
  return prisma.product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });
}
  
export async function findProductBySku(sku: string): Promise<Product | null> {
  return prisma.product.findFirst({
    where: {
      sku: { equals: sku, mode: 'insensitive' },
    },
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
    include: PRODUCT_INCLUDE,
  });
}

export async function updateProductWithAudit(
  productId: number,
  currentProduct: ProductWithRelations,
  updateData: UpdateProductInput,
  userId: number | null
): Promise<ProductWithRelations> {
  const { variants, ...productFields } = updateData;

  return prisma.$transaction(async (tx) => {
    if (
      productFields.price !== undefined &&
      Number(productFields.price) !== Number(currentProduct.price)
    ) {
      await tx.priceHistory.create({
        data: {
          productId,
          userId,
          previousPrice: currentProduct.price,
          newPrice: productFields.price,
        },
      });
    }

    if (Array.isArray(variants)) {
      for (const v of variants) {
        const existingVariant = currentProduct.variants.find(
          (ev) =>
            (v.id !== undefined && ev.id === v.id) ||
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
                userId,
                previousValue: existingVariant.stock,
                newValue: v.stock,
                reason: 'ajuste',
              },
            });
          }
        } else {
          const createdVariant = await tx.variant.create({
            data: {
              productId,
              size: v.size,
              color: v.color,
              stock: v.stock,
            },
          });

          await tx.stockMovement.create({
            data: {
              variantId: createdVariant.id,
              userId,
              previousValue: 0,
              newValue: v.stock,
              reason: 'ajuste',
            },
          });
        }
      }
    }

    return tx.product.update({
      where: { id: productId },
      data: productFields,
      include: PRODUCT_INCLUDE,
    });
  });
}