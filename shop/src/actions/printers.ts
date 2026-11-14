"use server";

import { prisma, withDbRetry, BusinessError } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

const SavePrinterSettingSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Printer name is required"),
  connectionType: z.enum(["USB", "BLUETOOTH", "NETWORK"]),
  paperWidth: z.coerce.number().int().refine((val) => val === 58 || val === 80, {
    message: "Paper width must be 58mm or 80mm",
  }),
  ipAddress: z.string().optional().nullable(),
  port: z.coerce.number().int().default(9100).optional().nullable(),
  autoCut: z.boolean().default(true),
  openCashDrawer: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export async function getPrinterSettings() {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const printers = await prisma.printerSetting.findMany({
      where: { organizationId: orgId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return printers.map((p) => ({
      id: p.id,
      name: p.name,
      connectionType: p.connectionType,
      paperWidth: p.paperWidth,
      ipAddress: p.ipAddress,
      port: p.port,
      autoCut: p.autoCut,
      openCashDrawer: p.openCashDrawer,
      isDefault: p.isDefault,
    }));
  });
}

export async function savePrinterSettingAction(rawData: z.infer<typeof SavePrinterSettingSchema>) {
  return handleAction("savePrinterSettingAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;
    const validated = SavePrinterSettingSchema.parse(rawData);

    if (validated.connectionType === "NETWORK" && !validated.ipAddress?.trim()) {
      throw new BusinessError("IP Address is required for Network/Ethernet printers.");
    }

    return await prisma.$transaction(async (tx) => {
      // If marking as default, reset other printers
      if (validated.isDefault) {
        await tx.printerSetting.updateMany({
          where: { organizationId: orgId },
          data: { isDefault: false },
        });
      }

      let printer;
      if (validated.id) {
        printer = await tx.printerSetting.update({
          where: { id: validated.id },
          data: {
            name: validated.name,
            connectionType: validated.connectionType,
            paperWidth: validated.paperWidth,
            ipAddress: validated.ipAddress?.trim() || null,
            port: validated.port ?? 9100,
            autoCut: validated.autoCut,
            openCashDrawer: validated.openCashDrawer,
            isDefault: validated.isDefault,
          },
        });
      } else {
        // If this is the first printer, make it default automatically
        const count = await tx.printerSetting.count({ where: { organizationId: orgId } });
        const isDefault = count === 0 || validated.isDefault;

        printer = await tx.printerSetting.create({
          data: {
            organizationId: orgId,
            name: validated.name,
            connectionType: validated.connectionType,
            paperWidth: validated.paperWidth,
            ipAddress: validated.ipAddress?.trim() || null,
            port: validated.port ?? 9100,
            autoCut: validated.autoCut,
            openCashDrawer: validated.openCashDrawer,
            isDefault,
          },
        });
      }

      revalidatePath("/settings");
      return printer;
    });
  });
}

export async function deletePrinterSettingAction(id: string) {
  return handleAction("deletePrinterSettingAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;

    const printer = await prisma.printerSetting.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!printer) throw new BusinessError("Printer configuration not found.");

    await prisma.printerSetting.delete({ where: { id: printer.id } });
    revalidatePath("/settings");
    return { success: true };
  });
}

export async function setDefaultPrinterAction(id: string) {
  return handleAction("setDefaultPrinterAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;

    return await prisma.$transaction(async (tx) => {
      await tx.printerSetting.updateMany({
        where: { organizationId: orgId },
        data: { isDefault: false },
      });

      const updated = await tx.printerSetting.update({
        where: { id },
        data: { isDefault: true },
      });

      revalidatePath("/settings");
      return updated;
    });
  });
}
