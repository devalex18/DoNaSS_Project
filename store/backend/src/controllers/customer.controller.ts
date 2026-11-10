import { Request, Response, NextFunction } from 'express';
import { searchCustomers, getCustomerById, createCustomer } from '../services/customer.service';
import { serializeCustomer } from '../serializers/customer.serializer';
import { httpError } from '../config/httpError';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const customers = await searchCustomers(q);
    res.status(200).json(customers.map(serializeCustomer));
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      throw httpError(400, 'El id debe ser un entero positivo');
    }
    const customer = await getCustomerById(id);
    res.status(200).json(serializeCustomer(customer));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const customer = await createCustomer(req.body);
    res.status(201).json(serializeCustomer(customer));
  } catch (err) {
    next(err);
  }
}