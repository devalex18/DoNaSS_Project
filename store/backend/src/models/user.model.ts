import { Prisma, User } from '@prisma/client';
import prisma from '../config/db';
import { ROLES } from '../config/constants';

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findAllUsers(filters: { q?: string; isActive?: boolean } = {}): Promise<User[]> {
  const { q, isActive } = filters;
  return prisma.user.findMany({
    where: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(q ? { OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        } : {}),
    },
    orderBy: { id: 'asc' },
  });
}

export async function countActiveAdmins(): Promise<number> {
  return prisma.user.count({
    where: { role: ROLES.ADMIN, isActive: true },
  });
}

export async function createUserRecord(data: Prisma.UserUncheckedCreateInput): Promise<User> {
  return prisma.user.create({ data });
}

export async function updateUserRecord(id: number, data: Prisma.UserUncheckedUpdateInput): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}