import { User } from '@prisma/client';

export interface PublicUserDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
}

export function serializeUser(user: User): PublicUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
  };
}