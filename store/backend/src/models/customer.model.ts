import { Customer, Prisma } from '@prisma/client';
import prisma from '../config/db';

export async function findCustomerByPhone(phone: string): Promise<Customer | null> {
  return prisma.customer.findUnique({ where: { phone } });
}

export async function findCustomerById(id: number): Promise<Customer | null> {
  return prisma.customer.findUnique({ where: { id } });
}

export async function searchCustomerRecords(q?: string): Promise<Customer[]> {
  return prisma.customer.findMany({
    where: q ? { OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ],
    } : {}, orderBy: { name: 'asc' },
  });
}

export async function createCustomerRecord(data: Prisma.CustomerCreateInput): Promise<Customer> {
  return prisma.customer.create({ data });
}