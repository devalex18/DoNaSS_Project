const express = require('express');
const request = require('supertest');
const prisma = require('../../src/config/db.js');
const productRoutes = require('../../src/routes/product.routes.js');
const errorHandler = require('../../src/middlewares/errorHandler.js');

// Mini-app aislada para probar S2 sin depender de login
const testApp = express();
testApp.use(express.json());

// Simulamos que el usuario es Administrador (S2 requiere admin)
testApp.use((req, res, next) => {
  req.user = { id: 1, role: 'administrador' };
  next();
});

testApp.use('/api/products', productRoutes);
testApp.use(errorHandler);

describe('Story S2 (Isolated): Add Product (/api/products)', () => {
  beforeAll(async () => {
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
  });

  afterAll(async () => {
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.$disconnect();
  });

  test('ST-20: Rejects negative price with 422', async () => {
    const res = await request(testApp).post('/api/products').send({
      name: 'Playera',
      price: -10,
      minStock: 2,
      variants: [{ size: 'M', color: 'Negro', stock: 5 }],
    });
    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'price')).toBe(true);
  });

  test('ST-21: Rejects missing required fields (name) with 422', async () => {
    const res = await request(testApp).post('/api/products').send({
      price: 100,
      minStock: 2,
      variants: [{ size: 'M', color: 'Negro', stock: 5 }],
    });
    expect(res.status).toBe(422);
    expect(res.body.errors.some(e => e.field === 'name')).toBe(true);
  });

  test('S2: Creates a valid product and its variants (201)', async () => {
    const res = await request(testApp).post('/api/products').send({
      name: 'Sudadera Capucha',
      price: 599.99,
      department: 'Invierno',
      minStock: 3,
      variants: [
        { size: 'M', color: 'Gris', stock: 8 },
        { size: 'L', color: 'Gris', stock: 4 }
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sudadera Capucha');
    expect(res.body.variants).toHaveLength(2);
  });

  test('ST-22: Rejects duplicate product (same name, size, color) with 409', async () => {
    const res = await request(testApp).post('/api/products').send({
      name: 'Sudadera Capucha',
      price: 600,
      minStock: 1,
      variants: [{ size: 'M', color: 'Gris', stock: 5 }],
    });
    expect(res.status).toBe(409);
  });
});