const { z } = require('zod');

const noHtml = (text) => !/<[^>]*>/g.test(text);

const createProductSchema = z.object({
  name: z.string({ required_error: 'El nombre es obligatorio' })
    .trim().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres')
    .refine(noHtml, 'Sin etiquetas HTML'),
  price: z.number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0'),
  minStock: z.number({ required_error: 'El stock mínimo es obligatorio' })
    .int('Debe ser entero').min(0, 'No puede ser negativo'),
  supplierId: z.number().int().positive().nullable().optional(),
  department: z.string().trim().max(50).nullable().optional(),
  variants: z.array(
    z.object({
      size: z.string({ required_error: 'Talla obligatoria' }).trim().min(1).max(30),
      color: z.string({ required_error: 'Color obligatorio' }).trim().min(1).max(30),
      stock: z.number().int().min(0, 'El stock no puede ser negativo'),
    }).strict()
  ).min(1, 'Agrega al menos una variante'),
}).strict();

module.exports = { createProductSchema };