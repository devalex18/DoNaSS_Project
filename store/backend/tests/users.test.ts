import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import app from '../src/app';
import prisma from '../src/config/db';
import { ROLES } from '../src/config/constants';
import {
  TEST_ENV,
  mockAdminUser,
  mockEmployeeUser,
  getSessionCookie,
} from './helpers/testHelper';

describe('Integración por Funcionalidad: Usuarios (/api/users)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/users - rechaza petición sin sesión activa con 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('POST /api/users - rechaza con 403 cuando un empleado intenta crear un usuario', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    // Llamada de verificación de sesión en el middleware requireAuth
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', empCookie)
      .send({
        name: 'Nuevo Empleado',
        email: 'nuevo@donass.local',
        password: TEST_ENV.adminPassword,
        role: ROLES.EMPLOYEE,
      });

    expect(res.status).toBe(403);
  });

  it('POST /api/users - administrador crea un empleado válido (201) sin exponer passwordHash', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    // 1ra llamada: middleware requireAuth verifica al admin
    // 2da llamada: userService verifica que el correo no esté duplicado
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(null);

    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      ...mockEmployeeUser,
      id: 10,
      name: 'Laura Cajera',
      email: 'laura@donass.local',
      mustChangePassword: true,
    } as any);

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Laura Cajera',
        email: 'laura@donass.local',
        phone: '4491234567',
        password: TEST_ENV.adminPassword,
        role: ROLES.EMPLOYEE,
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('laura@donass.local');
    expect(res.body.mustChangePassword).toBe(true);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /api/users - rechaza correo duplicado con 409', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(mockEmployeeUser as any);

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Duplicado',
        email: mockEmployeeUser.email,
        password: TEST_ENV.adminPassword,
        role: ROLES.EMPLOYEE,
      });

    expect(res.status).toBe(409);
  });

  it('DELETE /api/users/:id - impide que el administrador se dé de baja a sí mismo (409)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .delete(`/api/users/${mockAdminUser.id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('ti mismo');
  });

  it('DELETE /api/users/:id - realiza baja lógica de un empleado (200) y PATCH /:id/reactivate lo reactiva', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);

    // Baja lógica
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any) // requireAuth
      .mockResolvedValueOnce(mockEmployeeUser as any); // findById en service
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      ...mockEmployeeUser,
      isActive: false,
      deactivatedAt: new Date(),
    } as any);

    const deleteRes = await request(app)
      .delete(`/api/users/${mockEmployeeUser.id}`)
      .set('Cookie', adminCookie);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.isActive).toBe(false);

    // Reactivación
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce({ ...mockEmployeeUser, isActive: false } as any);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      ...mockEmployeeUser,
      isActive: true,
      deactivatedAt: null,
    } as any);

    const reactivateRes = await request(app)
      .patch(`/api/users/${mockEmployeeUser.id}/reactivate`)
      .set('Cookie', adminCookie);

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.isActive).toBe(true);
  });
});