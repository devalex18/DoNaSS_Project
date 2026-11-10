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

describe('Clientes (/api/customers)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/customers rechaza con 422 un telefono con letras o menor a 10 digitos', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(mockEmployeeUser as any);

    const resLetters = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({ name: 'Danna Lopez', phone: 'abcdefghij' });

    const resShort = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({ name: 'Danna Lopez', phone: '449123' });

    expect(resLetters.status).toBe(422);
    expect(resShort.status).toBe(422);
    expect(resLetters.body.errors.some((e: any) => e.field === 'phone')).toBe(true);
  });

  it('POST /api/customers registra un cliente valido con telefono de 10 digitos y red social (201)', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.customer.create).mockResolvedValueOnce({
      id: 1,
      name: 'Danna Lopez',
      phone: '4491234567',
      socialMediaProfile: 'ig: @dannalopez_ags',
      createdAt: new Date(),
    } as any);

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', empCookie)
      .send({
        name: 'Danna Lopez',
        phone: '4491234567',
        socialMediaProfile: 'ig: @dannalopez_ags',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 1,
      name: 'Danna Lopez',
      phone: '4491234567',
      socialMediaProfile: 'ig: @dannalopez_ags',
    });
  });

  it('POST /api/customers rechaza con 409 un telefono de cliente duplicado', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.customer.findUnique).mockResolvedValueOnce({
      id: 1,
      name: 'Danna Lopez',
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

  it('GET /api/customers?q=... permite buscar clientes por nombre o telefono (200)', async () => {
    const empCookie = await getSessionCookie(mockEmployeeUser as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce(mockEmployeeUser as any);
    vi.mocked(prisma.customer.findMany).mockResolvedValueOnce([
      {
        id: 1,
        name: 'Danna Lopez',
        phone: '4491234567',
        socialMediaProfile: 'ig: @dannalopez_ags',
        createdAt: new Date(),
      },
    ] as any);

    const res = await request(app)
      .get('/api/customers?q=4491234567')
      .set('Cookie', empCookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Danna Lopez');
  });
});