import { Request, Response, NextFunction } from 'express';
import {
  searchCatalogProducts,
  createProduct,
  updateProduct
} from '../services/product.service';

import { httpError } from '../config/httpError';
import { serializeProduct, serializeProductList } from '../serializers/product.serializer'
import { ROLES } from '../config/constants'
import { SearchProductsQuery } from '../validators/product.validator'

function parseProductId(rawId: string | undefined): number {
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, 'ID de producto inválido');
  }
  return id;
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filters = (res.locals.validatedQuery ?? {}) as SearchProductsQuery;
    const userRole = req.user?.role ?? ROLES.EMPLOYEE;
    const products = await searchCatalogProducts(filters);
    const data = serializeProductList(products, userRole);

    res.status(200).json({
      data,
      ...(data.length === 0 ? { message: 'Sin resultados' } : {}),
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userRole = req.user?.role ?? ROLES.ADMIN;
    const product = await createProduct(req.body);

    res.status(201).json(serializeProduct(product, userRole));
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseProductId(req.params.id);
    const userId = req.user ? req.user.id : null;
    const userRole = req.user?.role ?? ROLES.ADMIN;
    const updated = await updateProduct(id, req.body, userId);

    res.status(200).json(serializeProduct(updated, userRole));
  } catch (err) {
    next(err);
  }
}