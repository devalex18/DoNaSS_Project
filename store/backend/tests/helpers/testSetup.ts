import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import prisma from '../../src/config/db';
import { ROLES, SECURITY } from '../../src/config/constants';

export async function cleanDatabase() {
  await prisma.stockMovement.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.variant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestUsers() {
  const adminPassword = 'AdminPass123';
  const employeePassword = 'EmployeePass123';

  const adminHash = await bcrypt.hash(adminPassword, SECURITY.BCRYPT_ROUNDS);
  const employeeHash = await bcrypt.hash(employeePassword, SECURITY.BCRYPT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Principal',
      email: 'admin.func@tienda.local',
      passwordHash: adminHash,
      role: ROLES.ADMIN,
      isActive: true,
    },
  });

  const employee = await prisma.user.create({
    data: {
      name: 'Empleado Ventas',
      email: 'empleado.func@tienda.local',
      passwordHash: employeeHash,
      role: ROLES.EMPLOYEE,
      isActive: true,
    },
  });

  const inactive = await prisma.user.create({
    data: {
      name: 'Empleado Inactivo',
      email: 'inactivo.func@tienda.local',
      passwordHash: employeeHash,
      role: ROLES.EMPLOYEE,
      isActive: false,
    },
  });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: admin.email, password: adminPassword });

  const employeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: employee.email, password: employeePassword });

  return {
    admin,
    employee,
    inactive,
    adminPassword,
    employeePassword,
    adminCookie: adminLogin.headers['set-cookie'],
    employeeCookie: employeeLogin.headers['set-cookie'],
  };
}