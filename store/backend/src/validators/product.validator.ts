import { z } from 'zod';

const noHtml = (val: string): boolean => !/<[^>]*>/g.test(val);

const variantSchema = z
  .object({
    size: z
      .string({ required_error: 'La talla es obligatoria' })
      .trim()
      .min(1, 'La talla es obligatoria')
      .max(30)
      .refine(noHtml, 'Sin etiquetas HTML'),
    color: z
      .string({ required_error: 'El color es obligatorio' })
      .trim()
      .min(1, 'El color es obligatorio')
      .max(30)
      .refine(noHtml, 'Sin etiquetas HTML'),
    stock: z
      .number({
        required_error: 'El stock es obligatorio',
        invalid_type_error: 'El stock debe ser numérico',
      })
      .int('El stock debe ser entero')
      .min(0, 'El stock no puede ser negativo'),
  })
  .strict();

export const createProductSchema = z
  .object({
    name: z
      .string({ required_error: 'El nombre del producto es obligatorio' })
      .trim()
      .min(2, 'El nombre debe tener entre 2 y 100 caracteres')
      .max(100)
      .refine(noHtml, 'Sin etiquetas HTML'),
    brand: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    category: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    department: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    price: z
      .number({
        required_error: 'El precio es obligatorio',
        invalid_type_error: 'El precio debe ser numérico',
      })
      .positive('El precio debe ser mayor a 0'),
    minStock: z.number().int().min(0, 'El stock mínimo no puede ser negativo').default(0),
    supplierId: z.number().int().positive().nullable().optional(),
    variants: z.array(variantSchema).min(1, 'Debes registrar al menos una variante'),
  })
  .strict();

const updateVariantStockSchema = z
  .object({
    variantId: z.number().int().positive(),
    stock: z.number().int().min(0, 'El stock no puede ser negativo'),
    reason: z.string().trim().min(3, 'El motivo del ajuste es obligatorio').max(100).optional(),
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(100).refine(noHtml, 'Sin etiquetas HTML').optional(),
    brand: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    category: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    department: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    price: z
      .number({ invalid_type_error: 'El precio debe ser numérico' })
      .positive('El precio debe ser mayor a 0')
      .optional(),
    minStock: z.number().int().min(0).optional(),
    variantUpdates: z.array(updateVariantStockSchema).optional(),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;