import { z } from 'zod';

const noHtml = (val: string): boolean => !/<[^>]*>/g.test(val);

const skuSchema = z
  .string({
    required_error: 'El SKU es obligatorio',
    invalid_type_error: 'El SKU debe ser texto',
  })
  .trim()
  .toUpperCase()
  .min(2, 'El SKU debe tener entre 2 y 50 caracteres')
  .max(50, 'El SKU debe tener máximo 50 caracteres')
  .regex(/^[A-Z0-9_-]+$/, 'El SKU solo puede contener letras, números, guiones y guion bajo');

const skuFieldSchema = z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? null : val),
  z
    .string({ invalid_type_error: 'El SKU debe ser texto'})
    .trim()
    .min(2, 'El SKU debe tener entre 2 y 50 caracteres')
    .max(50, 'El SKU debe tener máximo 50 caracteres')
    .regex(/^[A-Za-z0-9_-]+$/, 'El SKU sólo puede contener letras, números, guiones y guion bajo')
    .nullable()
    .optional()
);

const optionalFilterString = (maxLength: number) => z.preprocess(
  (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
  z
    .string()
    .trim()
    .max(maxLength, `Máximo ${maxLength} caracteres`)
    .refine(noHtml, 'Sin etiquetas HTML')
    .optional()
);

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
    sku: skuSchema,
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

const updateVariantSchema = z
  .object({
    id: z.number().int().positive().optional(),
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
      .number({ invalid_type_error: 'El stock debe ser numérico' })
      .int('El stock debe ser entero')
      .min(0, 'El stock no puede ser negativo'),
  })
  .strict();

export const updateProductSchema = z
  .object({
    sku: skuSchema.optional(),
    name: z.string().trim().min(2).max(100).refine(noHtml, 'Sin etiquetas HTML').optional(),
    brand: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    category: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    department: z.string().trim().max(50).refine(noHtml, 'Sin etiquetas HTML').nullable().optional(),
    price: z
      .number({ invalid_type_error: 'El precio debe ser numérico' })
      .positive('El precio debe ser mayor a 0')
      .optional(),
    minStock: z.number().int().min(0, 'El stock mínimo no puede ser negativo').optional(),
    supplierId: z.number().int().positive().nullable().optional(),
    variants: z.array(updateVariantSchema).optional(),
  })
  .strict();

const baseProductFilterFields = {
  q: optionalFilterString(100),
  size: optionalFilterString(30),
  color: optionalFilterString(30),
  department: optionalFilterString(50),
};

export const searchProductsQuerySchema = z.object(baseProductFilterFields).strict();

/*
export const CATALOG_SORT_FIELDS = [
  'id',
  'sku',
  'name',
  'department',
  'brand',
  'category',
  'price',
  'minStock',
  'isActive',
  'supplier',
  'totalStock',
] as constant;


*/

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;
//export type CatalogQuery =