const { z } = require('zod');
const { ROLES } = require('../config/constants.js');

const noHtml = (val) => !/<[^>]*>/g.test(val);
const passwordRules = z
  .string({ required_error: 'La contraseña temporal es obligatoria' })
  .min(8, 'Mínimo 8 caracteres, con letras y números')
  .max(72, 'Máximo 72 caracteres')
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, 'Mínimo 8 caracteres, con letras y números');

const createUserSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener de 2 a 100 caracteres')
    .max(100, 'El nombre debe tener de 2 a 100 caracteres')
    .refine(noHtml, 'Sin etiquetas HTML'),
  email: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .email('Escribe un correo válido')
    .max(120, 'Máximo 120 caracteres'),
  phone: z
    .string()
    .regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos')
    .optional(),
  role: z.enum([ROLES.ADMIN, ROLES.EMPLOYEE], {
    errorMap: () => ({ message: 'El rol debe ser administrador o empleado' }),
  }),
  password: passwordRules,
}).strict();

const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(100).refine(noHtml, 'Sin etiquetas HTML').optional(),
  email: z.string().trim().email('Escribe un correo válido').max(120).optional(),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos').optional(),
}).strict();

const tempPasswordSchema = z.object({
  password: passwordRules,
}).strict();

module.exports = {
  createUserSchema,
  updateUserSchema,
  tempPasswordSchema,
};