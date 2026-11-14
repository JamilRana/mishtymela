"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { ContactType } from "@prisma/client";

const ContactSchema = z.object({
  type: z.nativeEnum(ContactType),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  phone: z.string().trim().min(6, "Phone must be at least 6 digits"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  openingBalance: z.coerce.number().default(0),
  creditLimit: z.coerce.number().optional().nullable(),
  monthlySalary: z.coerce.number().optional().nullable(),
  designation: z.string().trim().optional().or(z.literal("")),
});

export async function getContacts(options?: {
  type?: ContactType;
  activeOnly?: boolean;
  search?: string;
}) {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const where: any = { organizationId: orgId };

  if (options?.type) {
    where.type = options.type;
  }
  if (options?.activeOnly) {
    where.active = true;
  }
  if (options?.search) {
    const q = options.search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { designation: { contains: q, mode: "insensitive" } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return contacts.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    phone: c.phone,
    email: c.email,
    address: c.address,
    openingBalance: Number(c.openingBalance),
    currentDue: Number(c.currentDue),
    creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
    monthlySalary: c.monthlySalary ? Number(c.monthlySalary) : null,
    designation: c.designation,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
  }));
}

export async function getContactById(id: string) {
  const session = await requireAuth();
  const contact = await prisma.contact.findFirst({
    where: { id, organizationId: session.organizationId },
    include: {
      ledgerEntries: {
        orderBy: { date: "desc" },
        take: 50,
      },
    },
  });

  if (!contact) return null;

  return {
    ...contact,
    openingBalance: Number(contact.openingBalance),
    currentDue: Number(contact.currentDue),
    creditLimit: contact.creditLimit ? Number(contact.creditLimit) : null,
    monthlySalary: contact.monthlySalary ? Number(contact.monthlySalary) : null,
    createdAt: contact.createdAt.toISOString(),
    ledgerEntries: contact.ledgerEntries.map((l) => ({
      ...l,
      debit: Number(l.debit),
      credit: Number(l.credit),
      balanceAfter: Number(l.balanceAfter),
      date: l.date.toISOString(),
    })),
  };
}

export async function createContactAction(rawData: z.infer<typeof ContactSchema>) {
  return handleAction("createContactAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = ContactSchema.parse(rawData);

    // Initial due is set to openingBalance
    const openingBal = validated.openingBalance || 0;

    const contact = await prisma.$transaction(async (tx) => {
      const created = await tx.contact.create({
        data: {
          organizationId: orgId,
          type: validated.type,
          name: validated.name,
          phone: validated.phone,
          email: validated.email || null,
          address: validated.address || null,
          openingBalance: openingBal,
          currentDue: openingBal,
          creditLimit: validated.creditLimit ? validated.creditLimit : null,
          monthlySalary: validated.monthlySalary ? validated.monthlySalary : null,
          designation: validated.designation || null,
          active: true,
        },
      });

      // If opening balance > 0, write initial ledger record
      if (openingBal !== 0) {
        await tx.contactLedger.create({
          data: {
            organizationId: orgId,
            contactId: created.id,
            refType: "OPENING",
            description: "Opening Balance (প্রারম্ভিক জের)",
            debit: openingBal > 0 ? openingBal : 0,
            credit: openingBal < 0 ? Math.abs(openingBal) : 0,
            balanceAfter: openingBal,
            createdById: session.userId,
          },
        });
      }

      return created;
    });

    revalidatePath("/contacts");
    return { contactId: contact.id };
  });
}

export async function updateContactAction(
  id: string,
  rawData: Partial<z.infer<typeof ContactSchema>> & { active?: boolean }
) {
  return handleAction("updateContactAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;

    const existing = await prisma.contact.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) throw new Error("Contact not found.");

    await prisma.contact.update({
      where: { id },
      data: {
        name: rawData.name ?? existing.name,
        phone: rawData.phone ?? existing.phone,
        email: rawData.email !== undefined ? (rawData.email || null) : existing.email,
        address: rawData.address !== undefined ? (rawData.address || null) : existing.address,
        creditLimit: rawData.creditLimit !== undefined ? rawData.creditLimit : existing.creditLimit,
        monthlySalary: rawData.monthlySalary !== undefined ? rawData.monthlySalary : existing.monthlySalary,
        designation: rawData.designation !== undefined ? (rawData.designation || null) : existing.designation,
        active: rawData.active !== undefined ? rawData.active : existing.active,
      },
    });

    revalidatePath("/contacts");
  });
}

export async function deleteContactAction(id: string) {
  return handleAction("deleteContactAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN"]);
    const orgId = session.organizationId;

    // Check if contact has linked sales, purchases, or ledger entries
    const salesCount = await prisma.sale.count({ where: { contactId: id } });
    const purchasesCount = await prisma.purchase.count({ where: { contactId: id } });

    if (salesCount > 0 || purchasesCount > 0) {
      // Soft-delete by deactivating
      await prisma.contact.update({
        where: { id, organizationId: orgId },
        data: { active: false },
      });
      revalidatePath("/contacts");
      return { deactivated: true, message: "Contact deactivated because transactions exist." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.contactLedger.deleteMany({ where: { contactId: id } });
      await tx.contact.delete({ where: { id, organizationId: orgId } });
    });

    revalidatePath("/contacts");
  });
}
