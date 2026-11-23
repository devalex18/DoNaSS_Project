import { Product, Supplier, Variant } from '@prisma/client';
import { ROLES, Role } from '../config/constants';

export type ProductWithRelations = Product & {
    sku: string | null;
    variants: Variant[];
    supplier?: Supplier | null;
};

export interface PublicVariantDto {
    id: number;
    size: string;
    color: string;
    stock: number;
    reservedStock: number;
    availableStock: number;
}

export interface PublicSupplierSummaryDto {
    id: number;
    name: string;
    phone: string | null;
    isActive: boolean;
}

export interface PublicProductDto {
    id: number;
    sku: string;
    name: string;
    brand: string | null;
    category: string | null;
    department: string | null;
    price: number;
    minStock: number;
    isActive: boolean;
    totalStock: number;
    totalAvailableStock: number;
    variants: PublicVariantDto[];
    supplierId?: number | null;
    supplier?: PublicSupplierSummaryDto | null;
}

export function serializeVariant(variant: Variant): PublicVariantDto {
    const reservedStock = variant.reservedStock ?? 0;
    return {
        id: variant.id,
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        reservedStock,
        availableStock: variant.stock - reservedStock,
    };
}

export function serializeProduct(
    product: ProductWithRelations,
    userRole: Role
): PublicProductDto {
    const variants = Array.isArray(product.variants) ? product.variants.map(serializeVariant) : [];
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    const totalAvailableStock = variants.reduce((sum,v) => sum + v.availableStock, 0);
    const base: PublicProductDto = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand ?? null,
        category: product.category ?? null,
        department: product.department ?? null,
        price: Number(product.price),
        minStock: product.minStock,
        isActive: product.isActive,
        totalStock,
        totalAvailableStock,
        variants,
    };

    if (userRole === ROLES.ADMIN) {
        base.supplierId = product.supplierId ?? null;
        base.supplier = product.supplier ? {
            id: product.supplier.id,
            name: product.supplier.name,
            phone: product.supplier.phone ?? null,
            isActive: product.supplier.isActive,
        }
        : null;
    }

    return base;
}

export function serializeProductList(
    products: ProductWithRelations[],
    userRole: Role
): PublicProductDto[] {
    return products.map((product) => serializeProduct(product, userRole));
}