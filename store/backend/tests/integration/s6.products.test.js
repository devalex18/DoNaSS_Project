const express = require('express');
const request = require('supertest');
const prisma = require('../../src/config/db.js');
const productRoutes = require('../../src/routes/product.routes.js');
const errorHandler = require('../../src/middlewares/errorHandler.js');

const testApp = express();
testApp.use(express.json());
testApp.use((req, _res, next) => {
  req.user = { id: null, role: 'administrador' };
  next();
});
testApp.use('/api/products', productRoutes);
testApp.use(errorHandler);

describe('Story S6: Modify Product and Keep Price/Stock History (/api/products/:id)', () => {
  let productId;
  let variantId;

  beforeAll(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.priceHistory.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();

    const created = await prisma.product.create({
      data: {
        name: 'Camisa Lino',
        price: 450.0,
        minStock: 2,
        department: 'Caballeros',
        variants: {
          create: [{ size: 'M', color: 'Blanco', stock: 5 }],
        },
      },
      include: { variants: true },
    });

    productId = created.id;
    variantId = created.variants[0].id;
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.priceHistory.deleteMany();
    await prisma.variant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.$disconnect();
  });

  test('S6: Rejects negative price or negative stock on update with 422', async () => {
    const resPrice = await request(testApp)
      .patch(`/api/products/${productId}`)
      .send({ price: -50 });

    const resStock = await request(testApp)
      .patch(`/api/products/${productId}`)
      .send({ variants: [{ id: variantId, size: 'M', color: 'Blanco', stock: -3 }] });

    expect(resPrice.status).toBe(422);
    expect(resStock.status).toBe(422);
  });

  test('S6: Updates price and stock, recording PriceHistory and StockMovement (200)', async () => {
    const res = await request(testApp)
      .patch(`/api/products/${productId}`)
      .send({
        price: 499.5,
        minStock: 4,
        variants: [{ id: variantId, size: 'M', color: 'Blanco', stock: 12 }],
      });

    expect(res.status).toBe(200);
    expect(Number(res.body.price)).toBe(499.5);
    expect(res.body.variants[0].stock).toBe(12);

    const priceLogs = await prisma.priceHistory.findMany({ where: { productId } });
    expect(priceLogs).toHaveLength(1);
    expect(Number(priceLogs[0].previousPrice)).toBe(450);
    expect(Number(priceLogs[0].newPrice)).toBe(499.5);

    const stockLogs = await prisma.stockMovement.findMany({ where: { variantId } });
    expect(stockLogs).toHaveLength(1);
    expect(stockLogs[0].previousValue).toBe(5);
    expect(stockLogs[0].newValue).toBe(12);
  });

  test('S6: Returns 400 on invalid ID and 404 on non-existent product ID', async () => {
    const resBadId = await request(testApp)
      .patch('/api/products/abc')
      .send({ price: 500 });
    const resNotFound = await request(testApp)
      .patch('/api/products/99999')
      .send({ price: 500 });

    expect(resBadId.status).toBe(400);
    expect(resNotFound.status).toBe(404);
  });
});