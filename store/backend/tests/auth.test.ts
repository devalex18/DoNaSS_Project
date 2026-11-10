import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import app from '../src/app';
import prisma from '../src/config/db';
import { ROLES } from '../src/config/constants';
import { TEST_ENV, mockAdminUser, getSessionCookie } from './helpers/testHelper';

describe('Autenticación (/api/auth)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/auth/login inicia sesión con credenciales validas (200), devuelve cookie y oculta passwordHash', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_ENV.adminEmail,
        password: TEST_ENV.adminPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(TEST_ENV.adminEmail);
    expect(res.body.role).toBe(ROLES.ADMIN);
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('POST /api/auth/login rechaza con 401 y mensaje generico cuando el correo no existe o la contraseña falla', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(null);

    const resNoUser = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@donass.local',
        password: TEST_ENV.adminPassword,
      });

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const resWrongPass = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_ENV.adminEmail,
        password: 'Organista666',
      });

    expect(resNoUser.status).toBe(401);
    expect(resWrongPass.status).toBe(401);
    expect(resNoUser.body.message).toBe('Correo o contraseña incorrectos');
    expect(resWrongPass.body.message).toBe(resNoUser.body.message);
  });

  it('POST /api/auth/login rechaza con 401 a un usuario dado de baja', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      ...mockAdminUser,
      isActive: false,
    } as any);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_ENV.adminEmail,
        password: TEST_ENV.adminPassword,
      });

    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login rechaza con 422 entradas con formato de correo invalido o campos vacios', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'correo-invalido',
        password: '',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((e: any) => e.field === 'email')).toBe(true);
  });

  it('POST /api/auth/logout destruye la sesión activa y limpia la cookie (200)', async () => {
    const cookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Sesión cerrada correctamente');
  });
});