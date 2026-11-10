import { vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app';
import prisma from '../../src/config/db';
import { ROLES, SECURITY } from '../../src/config/constants';
import { required } from '../../src/config';

export const TEST_ENV = {
  adminEmail: required('ADMIN_EMAIL'),
  adminPassword: required('ADMIN_PASSWORD'),
  adminName: required('ADMIN_NAME'),
};

export const mockAdminUser = {
  id: 1,
  name: TEST_ENV.adminName,
  email: TEST_ENV.adminEmail,
  passwordHash: bcrypt.hashSync(TEST_ENV.adminPassword, SECURITY.BCRYPT_ROUNDS),
  role: ROLES.ADMIN,
  phone: '4491112233',
  isActive: true,
  mustChangePassword: false,
  deactivatedAt: null,
  createdById: null,
  createdAt: new Date(),
};

export const mockEmployeeUser = {
  id: 2,
  name: 'Empleado Ventas',
  email: 'empleado@donass.local',
  passwordHash: bcrypt.hashSync(TEST_ENV.adminPassword, SECURITY.BCRYPT_ROUNDS),
  role: ROLES.EMPLOYEE,
  phone: '4494445566',
  isActive: true,
  mustChangePassword: false,
  deactivatedAt: null,
  createdById: 1,
  createdAt: new Date(),
};

export async function getSessionCookie(userToLogin = mockAdminUser): Promise<string[]> {
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(userToLogin as any);

  const res = await request(app)
    .post('/api/auth/login')
    .send({
      email: userToLogin.email,
      password: TEST_ENV.adminPassword,
    });

  const rawCookie = res.headers['set-cookie'];
  return Array.isArray(rawCookie) ? rawCookie : [rawCookie];
}