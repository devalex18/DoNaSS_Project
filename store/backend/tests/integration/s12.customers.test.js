const request = require('supertest');
const app = require('../../src/app.js');
const prisma = require('../../src/config/db.js');

describe('Story S12: Save and Search Customer Profile (/api/customers)', () => {
  let createdCustomerId;

  beforeAll(async () => {
    await prisma.customer.deleteMany();
  });

  afterAll(async () => {
    await prisma.customer.deleteMany();
    await prisma.$disconnect();
  });

  test('ST-29: Rejects invalid phone format (letters or fewer than 10 digits) with 422', async () => {
    const resLetters = await request(app)
      .post('/api/customers')
      .send({ name: 'María López', phone: 'abcdefghij' });

    const resShort = await request(app)
      .post('/api/customers')
      .send({ name: 'María López', phone: '449123' });

    expect(resLetters.status).toBe(422);
    expect(resShort.status).toBe(422);
    expect(resLetters.body.errors.some((e) => e.field === 'phone')).toBe(true);
  });

  test('ST-33: Rejects HTML tags in customer name with 422', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({ name: '<script>alert(1)</script>', phone: '4491234567' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
  });

  test('S12: Creates a customer with valid 10-digit phone and social media profile (201)', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({
        name: 'María López',
        phone: '4491234567',
        socialMediaProfile: 'ig: @marialopez_ags',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: 'María López',
      phone: '4491234567',
      socialMediaProfile: 'ig: @marialopez_ags',
    });

    createdCustomerId = res.body.id;
  });

  test('ST-30: Rejects duplicate customer phone number with 409', async () => {
    const res = await request(app)
      .post('/api/customers')
      .send({
        name: 'Otra Persona',
        phone: '4491234567',
      });

    expect(res.status).toBe(409);
  });

  test('S12: Searches existing customer by phone or name (200)', async () => {
    const resByPhone = await request(app).get('/api/customers?q=4491234567');
    const resByName = await request(app).get('/api/customers?q=maría');

    expect(resByPhone.status).toBe(200);
    expect(resByPhone.body).toHaveLength(1);
    expect(resByName.body[0].name).toBe('María López');
  });

  test('S12 & ST-35 & ST-36: Gets customer by ID (200), returns 400 on invalid ID and 404 on non-existent ID', async () => {
    const resOk = await request(app).get(`/api/customers/${createdCustomerId}`);
    const resBadId = await request(app).get('/api/customers/abc');
    const resNotFound = await request(app).get('/api/customers/99999');

    expect(resOk.status).toBe(200);
    expect(resOk.body.name).toBe('María López');
    expect(resBadId.status).toBe(400);
    expect(resNotFound.status).toBe(404);
  });
});