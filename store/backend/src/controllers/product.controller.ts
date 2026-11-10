import { Request, Response, NextFunction } from 'express';
import { listActiveProducts, createProduct, updateProduct } from '../services/product.service';
import { httpError } from '../config/httpError';

export async function list(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const products = await listActiveProducts();
    res.status(200).json(products);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
<<<<<<< Updated upstream
      throw httpError(400, 'ID de producto invalido');
=======
      throw httpError(400, 'ID de producto inválido');
>>>>>>> Stashed changes
    }
    const userId = req.user ? req.user.id : null;
    const updated = await updateProduct(id, req.body, userId);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}