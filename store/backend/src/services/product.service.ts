import { Variant } from '@prisma/client';
import {
  ProductWithRelations,
  searchActiveProducts,
  ProductWithVariants,
  findAllProducts,
  findProductBySku,
  findProductById,
  findDuplicateProduct,
  createProductRecord,
  updateProductWithAudit,
} from '../models/product.model';
import { httpError } from '../config/httpError';
import { ROLES, Role } from '../config/constants'
import { CreateProductInput, UpdateProductInput, SearchProductsQuery } from '../validators/product.validator';

function prioritizeMatchingVariants(
  variants: Variant[],
  filters: Pick<SearchProductsQuery, 'size' | 'color'>
): Variant[] {
  const { size, color } = filters;
  if (!size && !color) {
    return variants;
  }

  const targetSize = size?.toLowerCase();
  const targetColor = color?.toLowerCase();
  const matching: Variant[] = [];
  const others: Variant[] = [];

  for (const variant of variants) {
    const matchesSize = !targetSize || variant.size.toLowerCase() === targetSize;
    const matchesColor = !targetColor || variant.color.toLowerCase() === targetColor;

    if (matchesSize && matchesColor) {
      matching.push(variant);
    } else {
      others.push(variant);
    }
  }

  return [...matching, ...others];
}

export async function searchCatalogProducts(
  filters: SearchProductsQuery
): Promise<ProductWithRelations[]> {
  const products = await searchActiveProducts(filters);

  return products.map((product) => ({
    ...product,
    variants: prioritizeMatchingVariants(product.variants, {
      size: filters.size,
      color: filters.color,
    }),
  }));
}

export async function createProduct(data: CreateProductInput): Promise<ProductWithRelations> {
  const combinations = new Set<string>();
  for (const v of data.variants) {
    const key = `${v.size.toLowerCase()}-${v.color.toLowerCase()}`;
    if (combinations.has(key)) {
      throw httpError(409, 'No puedes repetir la misma combinación de talla y color');
    }
    combinations.add(key);
  }

  const existingSku = await findProductBySku(data.sku);
  if (existingSku) {
    throw httpError(409, 'Ya existe un producto con ese SKU');
  }

  const existing = await findDuplicateProduct(data.name, data.variants);
  if (existing) {
    throw httpError(409, 'Ya existe un producto con el mismo nombre, talla y color');
  }

  return createProductRecord(data);
}

export async function updateProduct(
  id: number,
  data: UpdateProductInput,
  userId: number | null
): Promise<ProductWithRelations> {
  const currentProduct = await findProductById(id);
  if (!currentProduct) {
    throw httpError(404, 'Producto no encontrado');
  }

  if (data.sku && data.sku !== currentProduct.sku.toUpperCase()) {
    const existingSku = await findProductBySku(data.sku);
    if (existingSku && existingSku.id !== id) {
      throw httpError(409, 'Ya existe un producto con ese SKU');
    }
  }

  return updateProductWithAudit(id, currentProduct, data, userId);
}