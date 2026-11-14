"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { Decimal } from "@prisma/client/runtime/library";

const D = (n: number | string | Decimal) => new Decimal(n);

const PurchaseItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unitCost: z.coerce.number().min(0, "Unit cost must be at least 0"),
  batchNo: z.string().trim().optional().or(z.literal("")),
  expiryDate: z.string().optional().or(z.literal("")),
});

const CreatePurchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  billNo: z.string().trim().optional().or(z.literal("")),
  receivedDate: z.string().default(() => new Date().toISOString()),
  taxAmount: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  paidAmount: z.coerce.number().min(0).default(0),
  accountId: z.string().optional().or(z.literal("")),
  note: z.string().trim().optional().or(z.literal("")),
  items: z.array(PurchaseItemSchema).min(1, "At least one product item is required"),
});

export interface GetPurchasesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  supplierId?: string;
  startDate?: string;
  endDate?: string;
}

export async function getPurchases(options?: GetPurchasesOptions) {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, options?.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId: orgId };

  if (options?.supplierId && options.supplierId !== "all") {
    where.contactId = options.supplierId;
  }

  if (options?.startDate || options?.endDate) {
    where.receivedDate = {};
    if (options.startDate) {
      where.receivedDate.gte = new Date(options.startDate);
    }
    if (options.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      where.receivedDate.lte = end;
    }
  }

  if (options?.search) {
    const q = options.search.trim();
    where.OR = [
      { billNo: { contains: q, mode: "insensitive" } },
      { note: { contains: q, mode: "insensitive" } },
      { supplier: { name: { contains: q, mode: "insensitive" } } },
      { supplier: { phone: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [purchases, totalCount] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
        transactions: {
          include: { account: { select: { name: true } } },
        },
      },
      orderBy: { receivedDate: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.purchase.count({ where }),
  ]);

  return {
    purchases: purchases.map((p) => ({
      id: p.id,
      billNo: p.billNo,
      supplierId: p.contactId,
      supplierName: p.supplier.name,
      supplierPhone: p.supplier.phone,
      subtotal: Number(p.subtotal),
      taxAmount: Number(p.taxAmount),
      discount: Number(p.discount),
      total: Number(p.total),
      paid: Number(p.paid),
      due: Number(p.due),
      note: p.note,
      receivedDate: p.receivedDate.toISOString(),
      createdAt: p.createdAt.toISOString(),
      itemCount: p.items.length,
      items: p.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitCost: Number(i.unitCost),
        lineTotal: Number(i.lineTotal),
        batchNo: i.batchNo,
        expiryDate: i.expiryDate ? i.expiryDate.toISOString() : null,
      })),
      transactions: p.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        accountName: t.account.name,
        occurredAt: t.occurredAt.toISOString(),
      })),
    })),
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

export async function getPurchaseById(id: string) {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const p = await prisma.purchase.findFirst({
    where: { id, organizationId: orgId },
    include: {
      supplier: true,
      items: {
        include: {
          product: { select: { sku: true, unit: true } },
        },
      },
      transactions: {
        include: { account: true },
      },
    },
  });

  if (!p) return null;

  return {
    id: p.id,
    billNo: p.billNo,
    supplierId: p.contactId,
    supplierName: p.supplier.name,
    supplierPhone: p.supplier.phone,
    supplierAddress: p.supplier.address,
    subtotal: Number(p.subtotal),
    taxAmount: Number(p.taxAmount),
    discount: Number(p.discount),
    total: Number(p.total),
    paid: Number(p.paid),
    due: Number(p.due),
    note: p.note,
    receivedDate: p.receivedDate.toISOString(),
    createdAt: p.createdAt.toISOString(),
    items: p.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      sku: i.product.sku,
      unit: i.product.unit,
      quantity: Number(i.quantity),
      unitCost: Number(i.unitCost),
      lineTotal: Number(i.lineTotal),
      batchNo: i.batchNo,
      expiryDate: i.expiryDate ? i.expiryDate.toISOString() : null,
    })),
    transactions: p.transactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      accountName: t.account.name,
      occurredAt: t.occurredAt.toISOString(),
    })),
  };
}

export async function createPurchaseAction(rawData: z.infer<typeof CreatePurchaseSchema>) {
  return handleAction("createPurchaseAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = CreatePurchaseSchema.parse(rawData);

    // Verify books closed cutoff guard
    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: orgId },
      select: { booksClosedThrough: true },
    });
    const receivedDate = new Date(validated.receivedDate);
    if (org.booksClosedThrough && receivedDate <= org.booksClosedThrough) {
      throw new Error("Cannot record purchase on or before closed books cutoff date.");
    }

    // Verify supplier exists
    const supplier = await prisma.contact.findFirst({
      where: { id: validated.supplierId, organizationId: orgId, active: true },
    });
    if (!supplier) throw new Error("Supplier contact not found or inactive.");

    // Verify account if paying immediately
    if (validated.paidAmount > 0) {
      if (!validated.accountId) {
        throw new Error("Please select a payment account for the paid amount.");
      }
      const account = await prisma.account.findFirst({
        where: { id: validated.accountId, organizationId: orgId, active: true },
      });
      if (!account) throw new Error("Payment account not found or inactive.");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Generate Bill Number if empty
      let finalBillNo = validated.billNo?.trim();
      if (!finalBillNo) {
        const seq = await tx.invoiceSequence.upsert({
          where: { organizationId: orgId },
          create: { organizationId: orgId, lastNo: 0, lastPurchaseNo: 1 },
          update: { lastPurchaseNo: { increment: 1 } },
        });
        finalBillNo = `PUR-${String(seq.lastPurchaseNo).padStart(6, "0")}`;
      } else {
        const exists = await tx.purchase.findUnique({
          where: { organizationId_billNo: { organizationId: orgId, billNo: finalBillNo } },
        });
        if (exists) {
          throw new Error(`Bill Number "${finalBillNo}" already exists in the system.`);
        }
      }

      // 2. Compute totals
      let subtotal = D(0);
      for (const item of validated.items) {
        subtotal = subtotal.plus(D(item.quantity).times(D(item.unitCost)));
      }
      const taxAmount = D(validated.taxAmount || 0);
      const discount = D(validated.discount || 0);
      const total = subtotal.plus(taxAmount).minus(discount);
      const paid = D(Math.min(Number(total), validated.paidAmount || 0));
      const due = total.minus(paid);

      // 3. Create Purchase Record
      const purchase = await tx.purchase.create({
        data: {
          organizationId: orgId,
          billNo: finalBillNo,
          contactId: supplier.id,
          subtotal,
          taxAmount,
          discount,
          total,
          paid,
          due,
          note: validated.note || null,
          receivedDate,
          createdById: session.userId,
        },
      });

      // 4. Update Stock & Recalculate Weighted-Average Cost (WAC) per item
      for (const item of validated.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId: orgId },
        });
        if (!product) throw new Error(`Product ${item.productId} not found.`);

        const inwardQty = D(item.quantity);
        const inwardCost = D(item.unitCost);
        const currentQty = D(product.stockQty);
        const currentAvgCost = D(product.avgCost);

        const newQty = currentQty.plus(inwardQty);
        // WAC = ((currentQty * currentCost) + (inwardQty * inwardCost)) / newQty
        let newAvgCost = inwardCost;
        if (newQty.gt(0)) {
          newAvgCost = currentQty
            .times(currentAvgCost)
            .plus(inwardQty.times(inwardCost))
            .dividedBy(newQty);
        }

        // Update product stock and avgCost
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQty: newQty,
            avgCost: newAvgCost,
          },
        });

        // Insert PurchaseItem line
        await tx.purchaseItem.create({
          data: {
            purchaseId: purchase.id,
            productId: product.id,
            productName: product.name,
            quantity: inwardQty,
            unitCost: inwardCost,
            lineTotal: inwardQty.times(inwardCost),
            batchNo: item.batchNo || null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          },
        });

        // Record StockMovement
        await tx.stockMovement.create({
          data: {
            organizationId: orgId,
            productId: product.id,
            type: "PURCHASE",
            quantityDelta: inwardQty,
            unitCost: inwardCost,
            balanceAfter: newQty,
            refType: "PURCHASE",
            refId: purchase.id,
            batchNo: item.batchNo || null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            note: `Purchase Bill #${finalBillNo}`,
            createdById: session.userId,
          },
        });
      }

      // 5. Post Transaction for immediate payment if paid > 0
      if (paid.gt(0) && validated.accountId) {
        await tx.transaction.create({
          data: {
            organizationId: orgId,
            type: "EXPENSE",
            source: "PURCHASE",
            amount: paid,
            accountId: validated.accountId,
            purchaseId: purchase.id,
            occurredAt: receivedDate,
            createdById: session.userId,
            description: `Supplier payment for Bill #${finalBillNo} (${supplier.name})`,
          },
        });
      }

      // 6. Update Supplier Due and Ledger if due > 0
      if (due.gt(0)) {
        const newSupplierDue = D(supplier.currentDue).plus(due);
        await tx.contact.update({
          where: { id: supplier.id },
          data: { currentDue: newSupplierDue },
        });

        await tx.contactLedger.create({
          data: {
            organizationId: orgId,
            contactId: supplier.id,
            date: receivedDate,
            refType: "PURCHASE",
            refId: purchase.id,
            description: `Purchase Bill #${finalBillNo} (Due balance added)`,
            debit: 0,
            credit: due,
            balanceAfter: newSupplierDue,
            createdById: session.userId,
          },
        });
      }

      try {
        revalidatePath("/purchases");
        revalidatePath("/inventory");
        revalidatePath("/finance");
        revalidatePath("/contacts");
      } catch {}

      return { purchaseId: purchase.id, billNo: finalBillNo };
    });
  });
}
