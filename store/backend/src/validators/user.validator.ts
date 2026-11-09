import { z } from 'zod';
import { ROLES } from '../config/constants';

const noHtml = (val: string): boolean => !/<[^>]*>/g.test(val);

const passwordRules = z
  .string({ required_error: 'La contraseña temporal es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'Máximo 72 caracteres')
  .regex(/[A-Za-z]/, 'Debe incluir al menos una letra')
  .regex(/\d/, 'Debe incluir al menos un número');

export const createUserSchema = z
  .object({
    name: z
      .string({ required_error: 'El nombre es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener entre 2 y 100 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .refine(noHtml, 'El nombre no puede contener etiquetas HTML'),
    email: z
      .string({ required_error: 'El correo es obligatorio' })
      .trim()
      .toLowerCase()
      .email('Formato de correo inválido')
      .max(120, 'Máximo 120 caracteres'),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
      .nullable()
      .optional(),
    role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE], {
      errorMap: () => ({ message: 'El rol debe ser administrador o empleado' }),
    }),
    password: passwordRules,
  })
  .strict();

export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener entre 2 y 100 caracteres')
      .max(100, 'Máximo 100 caracteres')
      .refine(noHtml, 'Sin etiquetas HTML')
      .optional(),
    email: z.string().trim().toLowerCase().email('Formato de correo inválido').max(120).optional(),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'El teléfono debe tener exactamente 10 dígitos')
      .nullable()
      .optional(),
    role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE]).optional(),
  })
  .strict();

export const tempPasswordSchema = z
  .object({
    password: passwordRules,
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TempPasswordInput = z.infer<typeof tempPasswordSchema>;