const express = require('express');
const session = require('express-session');
const request = require('supertest');
const bcrypt = require('bcrypt');
const prisma = require('../../src/config/db.js');
const authRoutes = require('../../src/routes/auth.routes.js');
const userRoutes = require('../../src/routes/user.routes.js');
const requireAuth = require('../../src/middlewares/auth.js');
const errorHandler = require('../../src/middlewares/errorHandler.js');
const { ROLES } = require('../../src/config/constants.js');

const testApp = express();
testApp.use(express.json());
testApp.use(
  session({
    secret: 'test_secret_s19',
    resave: false,
    saveUninitialized: false,
  })
);
testApp.use('/api/auth', authRoutes);
testApp.use('/api/users', userRoutes);
testApp.get('/api/session-check', requireAuth, (req, res) => res.status(200).json({ ok: true }));
testApp.use(errorHandler);

describe('Story S19: Manage employee accounts (/api/users)', () => {
  let admin;
  let employee;
  let adminCookie;
  let employeeCookie;
  let createdEmployeeId;

  const basePass = 'ValidPass123';

  beforeAll(async () => {
    await prisma.user.deleteMany();
    const passwordHash = await bcrypt.hash(basePass, 10);

    admin = await prisma.user.create({
      data: {
        name: 'Admin Base',
        email: 'admin@tienda.local',
        passwordHash,
        role: ROLES.ADMIN,
        isActive: true,
      },
    });

    employee = await prisma.user.create({
      data: {
        name: 'Empleado Base',
        email: 'empleado@tienda.local',
        passwordHash,
        role: ROLES.EMPLOYEE,
        isActive: true,
      },
    });

    const adminLogin = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'admin@tienda.local', password: basePass });
    adminCookie = adminLogin.headers['set-cookie'];

    const empLogin = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'empleado@tienda.local', password: basePass });
    employeeCookie = empLogin.headers['set-cookie'];
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  test('ST-48 & ST-59: Employee cannot create an employee or an administrator (403)', async () => {
    const res = await request(testApp)
      .post('/api/users')
      .set('Cookie', employeeCookie)
      .send({
        name: 'Intruso',
        email: 'intruso@tienda.local',
        phone: '4491234567',
        role: 'administrador',
        password: 'TempPass123',
      });

    expect(res.status).toBe(403);
  });

  test('ST-50: Rejects weak temporary password (< 8 chars) with 422', async () => {
    const res = await request(testApp)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Nuevo Empleado',
        email: 'nuevo@tienda.local',
        phone: '4491234567',
        role: 'empleado',
        password: '12345',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
  });

  test('S19: Admin creates an employee with temporary password (201) and mustChangePassword = true', async () => {
    const res = await request(testApp)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Laura Ventas',
        email: 'laura@tienda.local',
        phone: '4491112233',
        role: 'empleado',
        password: 'TempPass123',
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('laura@tienda.local');
    expect(res.body.mustChangePassword).toBe(true);
    expect(res.body.passwordHash).toBeUndefined();

    createdEmployeeId = res.body.id;
  });

  test('ST-49: Creating a user with a duplicate email returns 409', async () => {
    const res = await request(testApp)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Laura Clon',
        email: 'laura@tienda.local',
        phone: '4499998877',
        role: 'empleado',
        password: 'TempPass123',
      });

    expect(res.status).toBe(409);
  });

  test('ST-58: Employee cannot edit their own contact data (403), but Admin can (200)', async () => {
    const resEmp = await request(testApp)
      .patch(`/api/users/${employee.id}`)
      .set('Cookie', employeeCookie)
      .send({ name: 'Nombre Cambiado' });
    expect(resEmp.status).toBe(403);

    const resAdmin = await request(testApp)
      .patch(`/api/users/${createdEmployeeId}`)
      .set('Cookie', adminCookie)
      .send({ phone: '4490001122' });
    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.phone).toBe('4490001122');
  });

  test('ST-53 & ST-54: Administrator cannot delete their own account or the last active admin (409)', async () => {
    const res = await request(testApp)
      .delete(`/api/users/${admin.id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
  });

  test('ST-51 & ST-52: Deleting an employee (soft delete) invalidates their open session immediately (401) and prevents login', async () => {
    const loginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'laura@tienda.local', password: 'TempPass123' });
    const lauraCookie = loginRes.headers['set-cookie'];

    const deleteRes = await request(testApp)
      .delete(`/api/users/${createdEmployeeId}`)
      .set('Cookie', adminCookie);
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.isActive).toBe(false);

    // ST-52: Open session is immediately rejected with 401
    const sessionCheck = await request(testApp)
      .get('/api/session-check')
      .set('Cookie', lauraCookie);
    expect(sessionCheck.status).toBe(401);

    // ST-51: Deleted employee cannot log in
    const reloginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'laura@tienda.local', password: 'TempPass123' });
    expect(reloginRes.status).toBe(401);
  });

  test('ST-61: Reactivating a deleted employee restores access with a new temporary password (200)', async () => {
    const reactivateRes = await request(testApp)
      .patch(`/api/users/${createdEmployeeId}/reactivate`)
      .set('Cookie', adminCookie)
      .send({ password: 'NewTempPass456' });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.isActive).toBe(true);
    expect(reactivateRes.body.mustChangePassword).toBe(true);

    const loginRes = await request(testApp)
      .post('/api/auth/login')
      .send({ email: 'laura@tienda.local', password: 'NewTempPass456' });
    expect(loginRes.status).toBe(200);
  });

  test('ST-60: Administrator can create another administrator (201) and list users (200)', async () => {
    const createAdminRes = await request(testApp)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Segundo Admin',
        email: 'admin2@tienda.local',
        phone: '4495556677',
        role: 'administrador',
        password: 'AdminTemp123',
      });

    expect(createAdminRes.status).toBe(201);
    expect(createAdminRes.body.role).toBe('administrador');

    const listRes = await request(testApp)
      .get('/api/users?q=Laura&active=true')
      .set('Cookie', adminCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
  });
});