"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

const BrandSchema = z.object({
  name: z.string().trim().min(2, "Brand name must be at least 2 characters"),
});

export async function getBrands() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const brands = await prisma.brand.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return brands.map((b) => ({
    id: b.id,
    name: b.name,
  }));
}

export async function createBrandAction(rawData: z.infer<typeof BrandSchema>) {
  return handleAction("createBrandAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = BrandSchema.parse(rawData);

    const brand = await prisma.brand.create({
      data: {
        organizationId: orgId,
        name: validated.name,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/products");
    return { brandId: brand.id };
  });
}

export async function updateBrandAction(id: string, rawData: z.infer<typeof BrandSchema>) {
  return handleAction("updateBrandAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = BrandSchema.parse(rawData);

    await prisma.brand.update({
      where: { id, organizationId: orgId },
      data: {
        name: validated.name,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/products");
  });
}

export async function deleteBrandAction(id: string) {
  return handleAction("deleteBrandAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;

    const inUse = await prisma.product.count({ where: { brandId: id } });
    if (inUse > 0) {
      throw new Error("Cannot delete brand that is associated with products.");
    }

    await prisma.brand.delete({ where: { id, organizationId: orgId } });
    revalidatePath("/settings");
    revalidatePath("/products");
  });
}
