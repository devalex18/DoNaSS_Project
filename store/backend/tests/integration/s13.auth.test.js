const express = require('express');
const session = require('express-session');
const request = require('supertest');
const bcrypt = require('bcrypt');
const prisma = require('../../src/config/db');
const authRoutes = require('../../src/routes/auth.routes');
const requireAuth = require('../../src/middlewares/auth');
const errorHandler = require('../../src/middlewares/errorHandler');
const { ROLES } = require('../../src/config/constants');

const testApp = express();
testApp.use(express.json());
testApp.use(
  session({
    secret: 'test_secret',
    resave: false,
    saveUninitialized: false,
  })
);
testApp.use('/api/auth', authRoutes);
testApp.get('/api/protected-check', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});
testApp.use(errorHandler);

describe('Story S13: Log in with roles (/api/auth)', () => {
  const validPass = 'AdminPass123';

  beforeAll(async () => {
    await prisma.user.deleteMany();
    const passwordHash = await bcrypt.hash(validPass, 10);

    await prisma.user.createMany({
      data: [
        {
          name: 'Admin Test',
          email: 'admin@tienda.local',
          passwordHash,
          role: ROLES.ADMIN,
          isActive: true,
        },
        {
          name: 'Inactive User',
          email: 'inactivo@tienda.local',
          passwordHash,
          role: ROLES.EMPLOYEE,
          isActive: false,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('ST-01: Valid credentials return 200, create session cookie, return role and hide passwordHash', async () => {
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'admin@tienda.local', password: validPass });

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('administrador');
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('ST-02 & ST-03: Wrong password and non-existent email return 401 with same generic message', async () => {
    const badPass = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'admin@tienda.local', password: 'WrongPassword123' });

    const badEmail = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'noexiste@tienda.local', password: 'WrongPassword123' });

    expect(badPass.status).toBe(401);
    expect(badEmail.status).toBe(401);
    expect(badPass.body.message).toBe('Correo o contraseña incorrectos');
    expect(badEmail.body.message).toBe(badPass.body.message);
  });

  test('ST-07: Inactive user cannot log in (401)', async () => {
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'inactivo@tienda.local', password: validPass });

    expect(res.status).toBe(401);
  });

  test('ST-08: Password in database is stored as bcrypt hash, never plain text', async () => {
    const userInDb = await prisma.user.findUnique({ where: { email: 'admin@tienda.local' } });
    expect(userInDb.passwordHash).not.toBe(validPass);
    expect(userInDb.passwordHash.startsWith('$2b$')).toBe(true);
  });

  test('ST-05: Protected route without session returns 401, and logout destroys session', async () => {
    const noSessionRes = await request(testApp).get('/api/protected-check');
    expect(noSessionRes.status).toBe(401);

    const loginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'admin@tienda.local', password: validPass });
    const cookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(testApp).post('/api/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    const afterLogoutRes = await request(testApp).get('/api/protected-check').set('Cookie', cookie);
    expect(afterLogoutRes.status).toBe(401);
  });
});