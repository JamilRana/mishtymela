"use server";

import { prisma, withDbRetry } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { assertPostingAllowed } from "@/modules/treasury/guard";
import { Decimal } from "@prisma/client/runtime/library";

const D = (n: number | string | Decimal) => new Decimal(n);

const CollectCustomerDueSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().positive("Repayment amount must be greater than zero"),
  accountId: z.string().min(1, "Payment account is required"),
  date: z.string().default(() => new Date().toISOString()),
  note: z.string().trim().optional().or(z.literal("")),
});

const PaySupplierDueSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  amount: z.coerce.number().positive("Disbursement amount must be greater than zero"),
  accountId: z.string().min(1, "Payment account is required"),
  date: z.string().default(() => new Date().toISOString()),
  note: z.string().trim().optional().or(z.literal("")),
});

export async function getDueOverview() {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const contacts = await prisma.contact.findMany({
      where: { organizationId: orgId, active: true },
      select: {
        id: true,
        type: true,
        name: true,
        phone: true,
        currentDue: true,
        creditLimit: true,
        createdAt: true,
      },
    });

    let totalCustomerReceivables = 0;
    let totalSupplierPayables = 0;
    let customerWithDueCount = 0;
    let supplierWithDueCount = 0;

    for (const c of contacts) {
      const due = Number(c.currentDue);
      if (c.type === "CUSTOMER" && due > 0) {
        totalCustomerReceivables += due;
        customerWithDueCount++;
      } else if (c.type === "SUPPLIER" && due > 0) {
        totalSupplierPayables += due;
        supplierWithDueCount++;
      }
    }

    return {
      totalCustomerReceivables,
      totalSupplierPayables,
      customerWithDueCount,
      supplierWithDueCount,
      netDifference: totalCustomerReceivables - totalSupplierPayables,
    };
  });
}

export async function getCustomerDues(options?: { search?: string }) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const where: any = {
      organizationId: orgId,
      type: "CUSTOMER",
      active: true,
    };

    if (options?.search) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    const customers = await prisma.contact.findMany({
      where,
      include: {
        ledgerEntries: {
          orderBy: { date: "desc" },
          take: 1,
        },
      },
      orderBy: { currentDue: "desc" },
    });

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      currentDue: Number(c.currentDue),
      creditLimit: c.creditLimit ? Number(c.creditLimit) : null,
      lastTransactionDate: c.ledgerEntries[0]?.date.toISOString() ?? c.createdAt.toISOString(),
    }));
  });
}

export async function getSupplierDues(options?: { search?: string }) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const where: any = {
      organizationId: orgId,
      type: "SUPPLIER",
      active: true,
    };

    if (options?.search) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.contact.findMany({
      where,
      include: {
        ledgerEntries: {
          orderBy: { date: "desc" },
          take: 1,
        },
        purchases: {
          select: { id: true },
        },
      },
      orderBy: { currentDue: "desc" },
    });

    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      currentDue: Number(s.currentDue),
      billCount: s.purchases.length,
      lastTransactionDate: s.ledgerEntries[0]?.date.toISOString() ?? s.createdAt.toISOString(),
    }));
  });
}

export async function collectCustomerDueAction(rawData: z.infer<typeof CollectCustomerDueSchema>) {
  return handleAction("collectCustomerDueAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER", "CASHIER"]);
    const orgId = session.organizationId;
    const validated = CollectCustomerDueSchema.parse(rawData);
    const paymentDate = new Date(validated.date);

    // Guard books closed cutoff
    await assertPostingAllowed(prisma as any, orgId, paymentDate);

    const customer = await prisma.contact.findFirst({
      where: { id: validated.customerId, organizationId: orgId, type: "CUSTOMER", active: true },
    });
    if (!customer) throw new Error("Customer not found or inactive.");

    const account = await prisma.account.findFirst({
      where: { id: validated.accountId, organizationId: orgId, active: true },
    });
    if (!account) throw new Error("Payment account not found or inactive.");

    const payAmount = D(validated.amount);
    const prevDue = D(customer.currentDue);
    const newDue = prevDue.minus(payAmount);

    return await prisma.$transaction(async (tx) => {
      // 1. Update Customer Current Due
      await tx.contact.update({
        where: { id: customer.id },
        data: { currentDue: newDue },
      });

      // 2. Insert ContactLedger entry
      const ledger = await tx.contactLedger.create({
        data: {
          organizationId: orgId,
          contactId: customer.id,
          date: paymentDate,
          refType: "DUE_COLLECTION",
          description: validated.note?.trim()
            ? `Due Collection (বাকি আদায়): ${validated.note.trim()}`
            : `Due Repayment Collection (বাকি আদায়)`,
          debit: 0,
          credit: payAmount,
          balanceAfter: newDue,
          createdById: session.userId,
        },
      });

      // 3. Post Transaction into Account
      const transaction = await tx.transaction.create({
        data: {
          organizationId: orgId,
          type: "INCOME",
          source: "CUSTOMER_DUE_PAYMENT",
          amount: payAmount,
          accountId: account.id,
          occurredAt: paymentDate,
          createdById: session.userId,
          description: `Due collection from ${customer.name} (Phone: ${customer.phone})`,
        },
      });

      try {
        revalidatePath("/dues");
        revalidatePath("/contacts");
        revalidatePath("/finance");
        revalidatePath("/sales");
      } catch {}

      return {
        success: true,
        receiptId: ledger.id,
        customerId: customer.id,
        customerName: customer.name,
        amount: Number(payAmount),
        remainingDue: Number(newDue),
        accountName: account.name,
        date: paymentDate.toISOString(),
      };
    });
  });
}

export async function paySupplierDueAction(rawData: z.infer<typeof PaySupplierDueSchema>) {
  return handleAction("paySupplierDueAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = PaySupplierDueSchema.parse(rawData);
    const paymentDate = new Date(validated.date);

    // Guard books closed cutoff
    await assertPostingAllowed(prisma as any, orgId, paymentDate);

    const supplier = await prisma.contact.findFirst({
      where: { id: validated.supplierId, organizationId: orgId, type: "SUPPLIER", active: true },
    });
    if (!supplier) throw new Error("Supplier not found or inactive.");

    const account = await prisma.account.findFirst({
      where: { id: validated.accountId, organizationId: orgId, active: true },
    });
    if (!account) throw new Error("Payment account not found or inactive.");

    const payAmount = D(validated.amount);
    const prevDue = D(supplier.currentDue);
    const newDue = prevDue.minus(payAmount);

    return await prisma.$transaction(async (tx) => {
      // 1. Update Supplier Current Due
      await tx.contact.update({
        where: { id: supplier.id },
        data: { currentDue: newDue },
      });

      // 2. Insert ContactLedger entry
      const ledger = await tx.contactLedger.create({
        data: {
          organizationId: orgId,
          contactId: supplier.id,
          date: paymentDate,
          refType: "DUE_PAYMENT",
          description: validated.note?.trim()
            ? `Supplier Due Payment (সাপ্লাইয়ারকে বাকি পরিশোধ): ${validated.note.trim()}`
            : `Supplier Due Payment (সাপ্লাইয়ারকে বাকি পরিশোধ)`,
          debit: payAmount,
          credit: 0,
          balanceAfter: newDue,
          createdById: session.userId,
        },
      });

      // 3. Post Transaction as EXPENSE into Account
      const transaction = await tx.transaction.create({
        data: {
          organizationId: orgId,
          type: "EXPENSE",
          source: "SUPPLIER_DUE_PAYMENT",
          amount: payAmount,
          accountId: account.id,
          occurredAt: paymentDate,
          createdById: session.userId,
          description: `Due disbursement to supplier ${supplier.name} (${supplier.phone})`,
        },
      });

      try {
        revalidatePath("/dues");
        revalidatePath("/contacts");
        revalidatePath("/finance");
        revalidatePath("/purchases");
      } catch {}

      return {
        success: true,
        voucherId: ledger.id,
        supplierId: supplier.id,
        supplierName: supplier.name,
        amount: Number(payAmount),
        remainingDue: Number(newDue),
        accountName: account.name,
        date: paymentDate.toISOString(),
      };
    });
  });
}
