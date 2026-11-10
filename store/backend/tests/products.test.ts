import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import app from '../src/app';
import prisma from '../src/config/db';
import {
  mockAdminUser,
  mockEmployeeUser,
  getSessionCookie,
} from './helpers/testHelper';

describe('Integración por Funcionalidad: Productos (/api/products)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/products - rechaza con 403 cuando un empleado intenta dar de alta un producto', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', empCookie)
      .send({
        name: 'Pantalón Mezclilla',
        price: 450,
        minStock: 3,
        variants: [{ size: '32', color: 'Azul', stock: 10 }],
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/products - rechaza con 422 un precio negativo o un producto sin nombre', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);

    const resNegativePrice = await request(app)
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({
        name: 'Playera Básica',
        price: -50,
        minStock: 2,
        variants: [{ size: 'M', color: 'Negro', stock: 5 }],
      });

    const resMissingName = await request(app)
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({
        price: 250,
        minStock: 2,
        variants: [{ size: 'M', color: 'Negro', stock: 5 }],
      });

    expect(resNegativePrice.status).toBe(422);
    expect(resNegativePrice.body.errors.some((e: any) => e.field === 'price')).toBe(true);
    expect(resMissingName.status).toBe(422);
    expect(resMissingName.body.errors.some((e: any) => e.field === 'name')).toBe(true);
  });

  it('POST /api/products - administrador crea un producto con sus variantes (201)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);
    vi.mocked(prisma.product.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.product.create).mockResolvedValueOnce({
      id: 1,
      name: 'Sudadera Capucha',
      price: 599.9,
      minStock: 3,
      isActive: true,
      variants: [
        { id: 1, productId: 1, size: 'M', color: 'Gris', stock: 8 },
        { id: 2, productId: 1, size: 'G', color: 'Negro', stock: 4 },
      ],
    } as any);

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({
        name: 'Sudadera Capucha',
        price: 599.9,
        minStock: 3,
        variants: [
          { size: 'M', color: 'Gris', stock: 8 },
          { size: 'G', color: 'Negro', stock: 4 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sudadera Capucha');
    expect(res.body.variants).toHaveLength(2);
  });

  it('POST /api/products - rechaza con 409 variantes duplicadas en la misma petición o en BD', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .post('/api/products')
      .set('Cookie', adminCookie)
      .send({
        name: 'Sudadera Capucha',
        price: 599.9,
        minStock: 3,
        variants: [
          { size: 'M', color: 'Gris', stock: 8 },
          { size: 'm', color: 'gris', stock: 2 },
        ],
      });

    expect(res.status).toBe(409);
  });

  it('PATCH /api/products/:id - actualiza precio y stock registrando auditoría en transacción (200)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const existingProduct = {
      id: 1,
      name: 'Sudadera Capucha',
      price: 599.9,
      minStock: 3,
      isActive: true,
      variants: [{ id: 10, productId: 1, size: 'M', color: 'Gris', stock: 8 }],
    };

    vi.mocked(prisma.product.findUnique).mockResolvedValueOnce(existingProduct as any);

    // Simulamos la ejecución de la transacción de Prisma (tx)
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback: any) => {
      const fakeTx = {
        priceHistory: { create: vi.fn().mockResolvedValue({}) },
        stockMovement: { create: vi.fn().mockResolvedValue({}) },
        variant: { update: vi.fn().mockResolvedValue({}) },
        product: {
          update: vi.fn().mockResolvedValue({
            ...existingProduct,
            price: 649.9,
            variants: [{ id: 10, productId: 1, size: 'M', color: 'Gris', stock: 15 }],
          }),
        },
      };
      return callback(fakeTx);
    });

    const res = await request(app)
      .patch('/api/products/1')
      .set('Cookie', adminCookie)
      .send({
        price: 649.9,
        variants: [{ size: 'M', color: 'Gris', stock: 15 }],
      });

    expect(res.status).toBe(200);
    expect(res.body.price).toBe(649.9);
    expect(res.body.variants[0].stock).toBe(15);
  });
});