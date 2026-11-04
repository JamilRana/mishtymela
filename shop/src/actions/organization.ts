"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getOrganizationAction() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: orgId },
  });

  return {
    id: org.id,
    name: org.name,
    currency: org.currency,
    timezone: org.timezone,
    address: org.address || "",
    phone: org.phone || "",
    email: org.email || "",
    vatNumber: org.vatNumber || "",
    receiptFooter: org.receiptFooter || "",
  };
}

export async function updateOrganizationAction(data: {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  vatNumber?: string;
  receiptFooter?: string;
  currency?: string;
  timezone?: string;
}) {
  return handleAction("updateOrganizationAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    if (!data.name.trim()) {
      throw new Error("Shop name is required.");
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address?.trim() || null,
        vatNumber: data.vatNumber?.trim() || null,
        receiptFooter: data.receiptFooter?.trim() || null,
        currency: data.currency?.trim() || "BDT",
        timezone: data.timezone?.trim() || "Asia/Dhaka",
      },
    });

    try {
      revalidatePath("/settings");
      revalidatePath("/dashboard");
      revalidatePath("/pos");
    } catch {}

    return {
      organization: {
        id: updated.id,
        name: updated.name,
        currency: updated.currency,
        timezone: updated.timezone,
        address: updated.address || "",
        phone: updated.phone || "",
        email: updated.email || "",
        vatNumber: updated.vatNumber || "",
        receiptFooter: updated.receiptFooter || "",
      },
    };
  }, "Failed to update shop details.");
}
