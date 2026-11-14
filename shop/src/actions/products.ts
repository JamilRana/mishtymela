"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getProducts(options?: { sellableOnly?: boolean }) {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const where: any = { organizationId: orgId };
  if (options?.sellableOnly) {
    where.isSellable = true;
    where.active = true;
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true, brand: true, unitRef: true },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    imageUrl: p.imageUrl,
    unit: p.unit,
    sellingPrice: Number(p.sellingPrice),
    wholesalePrice: p.wholesalePrice ? Number(p.wholesalePrice) : null,
    avgCost: Number(p.avgCost),
    stockQty: Number(p.stockQty),
    reorderLevel: Number(p.reorderLevel),
    expiryDays: p.expiryDays ?? null,
    active: p.active,
    productType: p.productType,
    isSellable: p.isSellable,
    categoryName: p.category?.name ?? "Uncategorized",
    categoryId: p.categoryId,
    brandName: p.brand?.name ?? null,
    brandId: p.brandId,
    unitId: p.unitId,
    unitLabel: p.unitRef?.shortName ?? p.unit,
  }));
}

export async function getPackagingBoxes() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const boxes = await prisma.product.findMany({
    where: {
      organizationId: orgId,
      productType: "PACKAGING",
      active: true,
    },
    orderBy: { name: "asc" },
  });

  return boxes.map((b) => ({
    id: b.id,
    name: b.name,
    sku: b.sku,
    unit: b.unit,
    stockQty: Number(b.stockQty),
    avgCost: Number(b.avgCost),
  }));
}

export async function getCategories() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  return prisma.category.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function getCategoriesWithCounts() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const categories = await prisma.category.findMany({
    where: { organizationId: orgId },
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    productCount: c._count.products,
  }));
}

export async function createCategory(name: string) {
  return handleAction("createCategory", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name cannot be empty");

    const existing = await prisma.category.findUnique({
      where: {
        organizationId_name: {
          organizationId: orgId,
          name: trimmed,
        },
      },
    });
    if (existing) throw new Error(`Category "${trimmed}" already exists`);

    const category = await prisma.category.create({
      data: {
        organizationId: orgId,
        name: trimmed,
      },
    });

    try {
      revalidatePath("/products");
      revalidatePath("/settings");
      revalidatePath("/pos");
    } catch {}

    return {
      id: category.id,
      name: category.name,
      organizationId: category.organizationId,
    };
  }, "Failed to create category.");
}

export async function updateCategory(id: string, name: string) {
  return handleAction("updateCategory", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const trimmed = name.trim();
    if (!trimmed) throw new Error("Category name cannot be empty");

    const category = await prisma.category.update({
      where: { id, organizationId: orgId },
      data: { name: trimmed },
    });

    try {
      revalidatePath("/products");
      revalidatePath("/settings");
      revalidatePath("/pos");
    } catch {}

    return {
      id: category.id,
      name: category.name,
      organizationId: category.organizationId,
    };
  }, "Failed to update category.");
}

export async function deleteCategory(id: string) {
  return handleAction("deleteCategory", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    // First unlink any products in this category to avoid foreign key violations
    await prisma.product.updateMany({
      where: { categoryId: id, organizationId: orgId },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id, organizationId: orgId },
    });

    try {
      revalidatePath("/products");
      revalidatePath("/settings");
      revalidatePath("/pos");
    } catch {}

    return {};
  }, "Failed to delete category.");
}

const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  unit: z.string().default("pcs"),
  productType: z.enum(["RETAIL", "RAW_MATERIAL", "PACKAGING"]).default("RETAIL"),
  isSellable: z.boolean().default(true),
  sellingPrice: z.coerce.number().min(0),
  wholesalePrice: z.coerce.number().min(0).optional().nullable(),
  reorderLevel: z.coerce.number().min(0).default(5),
  expiryDays: z.coerce.number().min(0).optional().nullable(),
  openingStock: z.coerce.number().min(0).optional(),
  openingCost: z.coerce.number().min(0).optional(),
});

export async function createProduct(formData: z.input<typeof productSchema>) {
  return handleAction("createProduct", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const data = productSchema.parse(formData);

    const product = await prisma.product.create({
      data: {
        organizationId: orgId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || null,
        imageUrl: data.imageUrl || null,
        categoryId: data.categoryId || null,
        brandId: data.brandId || null,
        unitId: data.unitId || null,
        unit: data.unit,
        productType: data.productType,
        isSellable: data.isSellable,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice ? data.wholesalePrice : null,
        reorderLevel: data.reorderLevel,
        expiryDays: data.expiryDays ? data.expiryDays : null,
        stockQty: data.openingStock || 0,
        avgCost: data.openingCost || 0,
      },
    });

    if (data.openingStock && data.openingStock > 0) {
      await prisma.stockMovement.create({
        data: {
          organizationId: orgId,
          productId: product.id,
          type: "PURCHASE",
          quantityDelta: data.openingStock,
          unitCost: data.openingCost || 0,
          balanceAfter: data.openingStock,
          note: "Opening stock balance",
        },
      });
    }

    try {
      revalidatePath("/products");
      revalidatePath("/inventory");
      revalidatePath("/pos");
    } catch {}

    const serialized = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      unit: product.unit,
      sellingPrice: Number(product.sellingPrice),
      wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
      avgCost: Number(product.avgCost),
      stockQty: Number(product.stockQty),
      reorderLevel: Number(product.reorderLevel),
      expiryDays: product.expiryDays,
      active: product.active,
      productType: product.productType,
      isSellable: product.isSellable,
      categoryId: product.categoryId,
      brandId: product.brandId,
      unitId: product.unitId,
    };

    return { product: serialized };
  }, "Failed to create product.");
}

export async function updateProduct(
  id: string,
  formData: Partial<z.input<typeof productSchema>>
) {
  return handleAction("updateProduct", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const partialSchema = productSchema.partial();
    const data = partialSchema.parse(formData);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.barcode !== undefined) updateData.barcode = data.barcode || null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.brandId !== undefined) updateData.brandId = data.brandId || null;
    if (data.unitId !== undefined) updateData.unitId = data.unitId || null;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.productType !== undefined) updateData.productType = data.productType;
    if (data.isSellable !== undefined) updateData.isSellable = data.isSellable;
    if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice;
    if (data.wholesalePrice !== undefined) updateData.wholesalePrice = data.wholesalePrice ? data.wholesalePrice : null;
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.expiryDays !== undefined) updateData.expiryDays = data.expiryDays ? data.expiryDays : null;

    const product = await prisma.product.update({
      where: { id, organizationId: orgId },
      data: updateData,
    });

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/pos");
    } catch {}

    const serialized = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      unit: product.unit,
      sellingPrice: Number(product.sellingPrice),
      wholesalePrice: product.wholesalePrice ? Number(product.wholesalePrice) : null,
      avgCost: Number(product.avgCost),
      stockQty: Number(product.stockQty),
      reorderLevel: Number(product.reorderLevel),
      expiryDays: product.expiryDays,
      active: product.active,
      productType: product.productType,
      isSellable: product.isSellable,
      categoryId: product.categoryId,
      brandId: product.brandId,
      unitId: product.unitId,
    };

    return { product: serialized };
  }, "Failed to update product.");
}

export async function toggleProductActive(id: string, active: boolean) {
  return handleAction("toggleProductActive", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    await prisma.product.update({
      where: { id, organizationId: orgId },
      data: { active },
    });

    try {
      revalidatePath("/products");
      revalidatePath("/pos");
    } catch {}

    return { active };
  }, "Failed to update product status.");
}

export async function deleteProduct(id: string) {
  return handleAction("deleteProduct", async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    // Check if product exists in this organization
    const product = await prisma.product.findUnique({
      where: { id, organizationId: orgId },
      include: {
        _count: {
          select: { saleItems: true },
        },
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Protect sales integrity
    if (product._count.saleItems > 0) {
      throw new Error(
        `Cannot delete "${product.name}" because it has recorded sales history (${product._count.saleItems} invoices). Please deactivate it instead to hide it from the POS and public catalog.`
      );
    }

    // Delete associated stock movements
    await prisma.stockMovement.deleteMany({
      where: { productId: id, organizationId: orgId },
    });

    // Delete product
    await prisma.product.delete({
      where: { id, organizationId: orgId },
    });

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath("/inventory");
      revalidatePath("/pos");
    } catch {}

    return { id };
  }, "Failed to delete product.");
}
