import { Customer } from '@prisma/client';
import {
  findCustomerByPhone,
  findCustomerById,
  searchCustomerRecords,
  createCustomerRecord,
} from '../models/customer.model';
import { httpError } from '../config/httpError';
import { CreateCustomerInput } from '../validators/customer.validator';

export async function searchCustomers(q?: string): Promise<Customer[]> {
  return searchCustomerRecords(q);
}

export async function getCustomerById(id: number): Promise<Customer> {
  const customer = await findCustomerById(id);
  if (!customer) {
    throw httpError(404, 'Cliente no encontrado');
  }
  return customer;
}

export async function createCustomer(data: CreateCustomerInput): Promise<Customer> {
  const existing = await findCustomerByPhone(data.phone);
  if (existing) {
    throw httpError(409, 'Ya existe un cliente registrado con ese número de teléfono');
  }
  return createCustomerRecord({
    name: data.name,
    phone: data.phone,
    socialMediaProfile: data.socialMediaProfile ?? null,
  });
}