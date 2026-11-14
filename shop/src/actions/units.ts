"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

const UnitSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  shortName: z.string().trim().min(1, "Short label is required"),
  conversionRate: z.coerce.number().positive("Conversion rate must be greater than zero"),
});

export async function getUnits() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const units = await prisma.unit.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });

  return units.map((u) => ({
    id: u.id,
    name: u.name,
    shortName: u.shortName,
    conversionRate: Number(u.conversionRate),
  }));
}

export async function createUnitAction(rawData: z.infer<typeof UnitSchema>) {
  return handleAction("createUnitAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = UnitSchema.parse(rawData);

    const unit = await prisma.unit.create({
      data: {
        organizationId: orgId,
        name: validated.name,
        shortName: validated.shortName,
        conversionRate: validated.conversionRate,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/products");
    return { unitId: unit.id };
  });
}

export async function updateUnitAction(id: string, rawData: z.infer<typeof UnitSchema>) {
  return handleAction("updateUnitAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = UnitSchema.parse(rawData);

    await prisma.unit.update({
      where: { id, organizationId: orgId },
      data: {
        name: validated.name,
        shortName: validated.shortName,
        conversionRate: validated.conversionRate,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/products");
  });
}

export async function deleteUnitAction(id: string) {
  return handleAction("deleteUnitAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;

    const inUse = await prisma.product.count({ where: { unitId: id } });
    if (inUse > 0) {
      throw new Error("Cannot delete unit that is associated with products.");
    }

    await prisma.unit.delete({ where: { id, organizationId: orgId } });
    revalidatePath("/settings");
    revalidatePath("/products");
  });
}
