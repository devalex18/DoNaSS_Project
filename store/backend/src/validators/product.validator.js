const { z } = require('zod');

const noHtml = (text) => !/<[^>]*>/g.test(text);
const twoDecimals = (n) => /^\d+(\.\d{1,2})?$/.test(String(n));

const createProductSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener de 2 a 100 caracteres')
    .max(100, 'El nombre debe tener de 2 a 100 caracteres')
    .refine(noHtml, 'Sin etiquetas HTML'),
  price: z
    .number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0')
    .refine(twoDecimals, 'Máximo 2 decimales'),
  minStock: z
    .number({ required_error: 'El stock mínimo es obligatorio', invalid_type_error: 'El stock mínimo debe ser un entero' })
    .int('El stock mínimo debe ser un entero')
    .min(0, 'El stock mínimo no puede ser negativo'),
  supplierId: z.number().int().positive().nullable().optional(),
  department: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
  brand: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
  category: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
  variants: z
    .array(
      z.object({
        size: z.string({ required_error: 'La talla es obligatoria' }).trim().min(1, 'La talla es obligatoria').max(30),
        color: z.string({ required_error: 'El color es obligatorio' }).trim().min(1, 'El color es obligatorio').max(30),
        stock: z.number({ invalid_type_error: 'El stock debe ser un entero' }).int().min(0, 'El stock no puede ser negativo'),
      }).strict()
    )
    .min(1, 'Agrega al menos una variante'),
}).strict();

const updateProductSchema = z.object({
  name: z.string().trim().min(2).max(100).refine(noHtml, 'Sin etiquetas HTML').optional(),
  price: z
    .number({ invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0')
    .refine(twoDecimals, 'Máximo 2 decimales')
    .optional(),
  minStock: z
    .number({ invalid_type_error: 'El stock mínimo debe ser un entero' })
    .int('El stock mínimo debe ser un entero')
    .min(0, 'El stock mínimo no puede ser negativo')
    .optional(),
  supplierId: z.number().int().positive().nullable().optional(),
  department: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
  brand: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
  category: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
  variants: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        size: z.string().trim().min(1, 'La talla es obligatoria').max(30),
        color: z.string().trim().min(1, 'El color es obligatorio').max(30),
        stock: z.number({ invalid_type_error: 'El stock debe ser un entero' }).int().min(0, 'El stock no puede ser negativo'),
      }).strict()
    )
    .optional(),
}).strict();

module.exports = {
  createProductSchema,
  updateProductSchema,
}; // 6 7 :P