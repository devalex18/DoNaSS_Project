import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../src/config/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import app from '../src/app';
import prisma from '../src/config/db';
import { mockEmployeeUser, getSessionCookie } from './helpers/testHelper';

describe('Integración por Funcionalidad: Clientes (/api/customers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/customers - rechaza con 422 un teléfono con letras o menor a 10 dígitos', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockEmployeeUser as any);

    const resLetters = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({ name: 'María López', phone: 'abcdefghij' });

    const resShort = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({ name: 'María López', phone: '449123' });

    expect(resLetters.status).toBe(422);
    expect(resShort.status).toBe(422);
    expect(resLetters.body.errors.some((e: any) => e.field === 'phone')).toBe(true);
  });

  it('POST /api/customers - registra un cliente válido con teléfono de 10 dígitos y red social (201)', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.customer.create).mockResolvedValueOnce({
      id: 1,
      name: 'María López',
      phone: '4491234567',
      socialMediaProfile: 'ig: @marialopez_ags',
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({
        name: 'María López',
        phone: '4491234567',
        socialMediaProfile: 'ig: @marialopez_ags',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      name: 'María López',
      phone: '4491234567',
      socialMediaProfile: 'ig: @marialopez_ags',
    });
  });

  it('POST /api/customers - rechaza con 409 un teléfono de cliente duplicado', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 1,
      name: 'María López',
      phone: '4491234567',
      socialMediaProfile: null,
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({
        name: 'Otra Persona',
        phone: '4491234567',
      });

    expect(res.status).toBe(409);
  });

  it('GET /api/customers?q=... - permite buscar clientes por nombre o teléfono (200)', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.customer.findMany).mockResolvedValueOnce([
      {
        id: 1,
        name: 'María López',
        phone: '4491234567',
        socialMediaProfile: 'ig: @marialopez_ags',
        createdAt: new Date(),
      },
    ] as any);

    const res = await request(app)
      .get('/api/customers?q=4491234567')
      .set('Cookie', empCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('María López');
  });
});