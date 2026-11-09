import {
  ProductWithVariants,
  findAllProducts,
  findProductById,
  findDuplicateProduct,
  createProductRecord,
  updateProductWithAudit,
} from '../models/product.model';
import { httpError } from '../config/httpError';
import { CreateProductInput, UpdateProductInput } from '../validators/product.validator';

export async function listActiveProducts(): Promise<ProductWithVariants[]> {
  return findAllProducts();
}

export async function createProduct(data: CreateProductInput): Promise<ProductWithVariants> {
  const combinations = new Set<string>();
  for (const v of data.variants) {
    const key = `${v.size.toLowerCase()}-${v.color.toLowerCase()}`;
    if (combinations.has(key)) {
      throw httpError(409, 'No puedes repetir la misma combinación de talla y color');
    }
    combinations.add(key);
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
): Promise<ProductWithVariants> {
  const currentProduct = await findProductById(id);
  if (!currentProduct) {
    throw httpError(404, 'Producto no encontrado');
  }

  const updated = await updateProductWithAudit(id, currentProduct, data, userId);
  if (!updated) {
    throw httpError(404, 'Producto no encontrado');
  }
  return updated;
}