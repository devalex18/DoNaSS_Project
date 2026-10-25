const { z } = require('zod');

const noHtml = (val) => !/<[^>]*>/g.test(val);

const createCustomerSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener de 2 a 100 caracteres')
    .max(100, 'El nombre debe tener de 2 a 100 caracteres')
    .refine(noHtml, 'Sin etiquetas HTML'),
  phone: z
    .string({ required_error: 'El teléfono es obligatorio' })
    .regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  socialMediaProfile: z
    .string()
    .trim()
    .max(100, 'Máximo 100 caracteres')
    .refine(noHtml, 'Sin etiquetas HTML')
    .nullable()
    .optional(),
}).strict();

module.exports = { createCustomerSchema };