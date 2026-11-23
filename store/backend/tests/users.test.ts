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

describe('Usuarios (/api/users)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/users rechaza petición sin sesión activa con 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/users lista usuarios con filtros q y active (200)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([mockEmployeeUser as any]);

    const res = await request(app)
      .get('/api/users')
      .query({ q: 'empleado', active: 'true' })
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].email).toBe(mockEmployeeUser.email);
    expect(res.body[0].passwordHash).toBeUndefined();
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        OR: [
          { name: { contains: 'empleado', mode: 'insensitive' } },
          { email: { contains: 'empleado', mode: 'insensitive' } },
        ],
      },
      orderBy: { id: 'asc' },
    });
  });

  it('POST /api/users rechaza con 403 cuando un empleado intenta crear un usuario', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
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

  it('POST /api/users administrador crea un empleado valido (201) sin exponer passwordHash', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(null);

    vi.mocked(prisma.user.create).mockResolvedValueOnce({
      ...mockEmployeeUser,
      id: 10,
      name: 'Eddy Reprobado',
      email: 'edphos@donass.local',
      mustChangePassword: true,
    } as any);

    const res = await request(app)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Eddy Reprobado',
        email: 'edphos@donass.local',
        phone: '4491234567',
        password: TEST_ENV.adminPassword,
        role: ROLES.EMPLOYEE,
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('edphos@donass.local');
    expect(res.body.mustChangePassword).toBe(true);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /api/users rechaza con 422 nombre con etiquetas HTML o rol invalido', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);

    const resHtml = await request(app)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: '<script>alert(1)</script>',
        email: 'html@donass.local',
        password: TEST_ENV.adminPassword,
        role: ROLES.EMPLOYEE,
      });

    const resRole = await request(app)
      .post('/api/users')
      .set('Cookie', adminCookie)
      .send({
        name: 'Usuario Rol Malo',
        email: 'rolmalo@donass.local',
        password: TEST_ENV.adminPassword,
        role: 'INVITADO',
      });

    expect(resHtml.status).toBe(422);
    expect(resHtml.body.errors.some((e: any) => e.field === 'name')).toBe(true);
    expect(resRole.status).toBe(422);
    expect(resRole.body.errors.some((e: any) => e.field === 'role')).toBe(true);
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

  it('PATCH /api/users/:id retorna 400 si el id es invalido', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .patch('/api/users/abc')
      .set('Cookie', adminCookie)
      .send({ name: 'Nombre Valido' });

    expect(res.status).toBe(400);
  });

  it('PATCH /api/users/:id retorna 404 si el usuario no existe', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(null);

    const res = await request(app)
      .patch('/api/users/999')
      .set('Cookie', adminCookie)
      .send({ name: 'No Existe' });

    expect(res.status).toBe(404);
  });

  it('PATCH /api/users/:id rechaza con 409 si el nuevo correo ya existe', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(mockEmployeeUser as any)
      .mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .patch(`/api/users/${mockEmployeeUser.id}`)
      .set('Cookie', adminCookie)
      .send({ email: mockAdminUser.email });

    expect(res.status).toBe(409);
  });

  it('PATCH /api/users/:id actualiza un usuario correctamente (200)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(mockEmployeeUser as any)
      .mockResolvedValueOnce(null);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      ...mockEmployeeUser,
      name: 'Empleado Actualizado',
      email: 'actualizado@donass.local',
    } as any);

    const res = await request(app)
      .patch(`/api/users/${mockEmployeeUser.id}`)
      .set('Cookie', adminCookie)
      .send({
        name: 'Empleado Actualizado',
        email: 'actualizado@donass.local',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Empleado Actualizado');
    expect(res.body.email).toBe('actualizado@donass.local');
  });

  it('DELETE /api/users/:id impide que el administrador se de de baja a si mismo (409)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockAdminUser as any);

    const res = await request(app)
      .delete(`/api/users/${mockAdminUser.id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('No puedes eliminar tu propia cuenta');
  });

  it('DELETE /api/users/:id impide dar de baja al ultimo administrador activo (409)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);
    const anotherAdmin = {
      ...mockAdminUser,
      id: 99,
      email: 'admin2@donass.local',
    };

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(anotherAdmin as any);
    vi.mocked(prisma.user.count).mockResolvedValueOnce(1);

    const res = await request(app)
      .delete(`/api/users/${anotherAdmin.id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('último administrador activo');
  });

  it('DELETE /api/users/:id realiza baja logica de un empleado (200) y PATCH /:id/reactivate lo reactiva', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(mockEmployeeUser as any);
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
      .set('Cookie', adminCookie)
      .send({ password: TEST_ENV.adminPassword });

    expect(reactivateRes.status).toBe(200);
    expect(reactivateRes.body.isActive).toBe(true);
  });

  it('POST /api/users/:id/reset-password restablece la contraseña temporal (200)', async () => {
    const adminCookie = await getSessionCookie(mockAdminUser);

    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce(mockAdminUser as any)
      .mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.user.update).mockResolvedValueOnce({
      ...mockEmployeeUser,
      mustChangePassword: true,
    } as any);

    const res = await request(app)
      .post(`/api/users/${mockEmployeeUser.id}/reset-password`)
      .set('Cookie', adminCookie)
      .send({ password: TEST_ENV.adminPassword });

    expect(res.status).toBe(200);
    expect(res.body.mustChangePassword).toBe(true);
  });
});