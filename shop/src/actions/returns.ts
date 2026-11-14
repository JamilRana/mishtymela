"use server";

import { prisma, withDbRetry, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { MovementType, ReturnStatus } from "@prisma/client";
import { assertPostingAllowed } from "@/modules/treasury/guard";

const CreateSalesReturnSchema = z.object({
  saleId: z.string().min(1, "Sale ID is required"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.coerce.number().positive("Quantity must be greater than zero"),
        refundRate: z.coerce.number().min(0, "Refund rate must be non-negative"),
        restocked: z.boolean().default(true),
      })
    )
    .min(1, "At least one item must be returned"),
  refundAmount: z.coerce.number().min(0).default(0),
  accountId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
});

const CreatePurchaseReturnSchema = z.object({
  purchaseId: z.string().min(1, "Purchase ID is required"),
  amountCredited: z.coerce.number().positive("Amount credited must be greater than zero"),
  reason: z.string().optional().nullable(),
  refundAccountId: z.string().optional().nullable(), // If supplier refunded cash instead of due adjustment
});

export async function getReturnsOverview(options?: {
  type?: "SALES" | "PURCHASE" | "ALL";
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const filterType = options?.type ?? "ALL";
    const search = options?.search?.trim();

    // 1. Sales Returns query
    let salesReturns: any[] = [];
    if (filterType === "ALL" || filterType === "SALES") {
      const where: any = { organizationId: orgId };
      if (search) {
        where.OR = [
          { returnNo: { contains: search, mode: "insensitive" } },
          { sale: { invoiceNo: { contains: search, mode: "insensitive" } } },
          { sale: { customerName: { contains: search, mode: "insensitive" } } },
        ];
      }
      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = new Date(options.startDate);
        if (options.endDate) where.createdAt.lte = new Date(options.endDate + "T23:59:59.999Z");
      }

      salesReturns = await prisma.salesReturn.findMany({
        where,
        include: {
          sale: {
            select: { id: true, invoiceNo: true, customerName: true, total: true },
          },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    // 2. Purchase Returns query
    let purchaseReturns: any[] = [];
    if (filterType === "ALL" || filterType === "PURCHASE") {
      const where: any = { organizationId: orgId };
      if (search) {
        where.OR = [
          { returnNo: { contains: search, mode: "insensitive" } },
          { purchase: { billNo: { contains: search, mode: "insensitive" } } },
        ];
      }
      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = new Date(options.startDate);
        if (options.endDate) where.createdAt.lte = new Date(options.endDate + "T23:59:59.999Z");
      }

      purchaseReturns = await prisma.purchaseReturn.findMany({
        where,
        include: {
          purchase: {
            include: {
              supplier: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    // Metrics
    let totalSalesRefunded = 0;
    for (const sr of salesReturns) {
      totalSalesRefunded += Number(sr.refundAmount);
    }

    let totalPurchaseCredited = 0;
    for (const pr of purchaseReturns) {
      totalPurchaseCredited += Number(pr.amountCredited);
    }

    return {
      salesReturns: salesReturns.map((sr) => ({
        id: sr.id,
        returnNo: sr.returnNo,
        saleId: sr.saleId,
        invoiceNo: sr.sale?.invoiceNo ?? "",
        customerName: sr.sale?.customerName ?? "Walk-in Customer",
        refundAmount: Number(sr.refundAmount),
        accountId: sr.accountId,
        reason: sr.reason,
        status: sr.status,
        createdAt: sr.createdAt.toISOString(),
        items: sr.items.map((i: any) => ({
          id: i.id,
          productId: i.productId,
          productName: i.product?.name ?? "",
          sku: i.product?.sku ?? "",
          unit: i.product?.unit ?? "pcs",
          quantity: Number(i.quantity),
          refundRate: Number(i.refundRate),
          lineTotal: Number(i.lineTotal),
          restocked: i.restocked,
        })),
      })),
      purchaseReturns: purchaseReturns.map((pr) => ({
        id: pr.id,
        returnNo: pr.returnNo,
        purchaseId: pr.purchaseId,
        billNo: pr.purchase?.billNo ?? "",
        supplierName: pr.purchase?.supplier?.name ?? "Unknown Supplier",
        supplierPhone: pr.purchase?.supplier?.phone ?? "",
        amountCredited: Number(pr.amountCredited),
        reason: pr.reason,
        status: pr.status,
        createdAt: pr.createdAt.toISOString(),
      })),
      metrics: {
        totalSalesRefunded,
        totalPurchaseCredited,
        salesReturnCount: salesReturns.length,
        purchaseReturnCount: purchaseReturns.length,
      },
    };
  });
}

export async function searchSaleForReturn(invoiceNo: string) {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const sale = await prisma.sale.findFirst({
      where: {
        organizationId: orgId,
        invoiceNo: { equals: invoiceNo.trim(), mode: "insensitive" },
        status: "COMPLETED",
      },
      include: {
        contact: true,
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: true, stockQty: true } },
          },
        },
        returns: {
          include: { items: true },
        },
      },
    });

    if (!sale) return null;

    // Calculate previously returned quantities per product
    const returnedQtyMap = new Map<string, number>();
    for (const r of sale.returns) {
      for (const item of r.items) {
        const cur = returnedQtyMap.get(item.productId) ?? 0;
        returnedQtyMap.set(item.productId, cur + Number(item.quantity));
      }
    }

    return {
      id: sale.id,
      invoiceNo: sale.invoiceNo,
      customerName: sale.customerName ?? "Walk-in Customer",
      contactId: sale.contactId,
      total: Number(sale.total),
      paid: Number(sale.paid),
      due: Number(sale.due),
      createdAt: sale.createdAt.toISOString(),
      items: sale.items.map((i) => {
        const originalQty = Number(i.quantity);
        const alreadyReturned = returnedQtyMap.get(i.productId) ?? 0;
        const availableToReturn = Math.max(0, originalQty - alreadyReturned);

        return {
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          sku: i.product.sku,
          unit: i.product.unit,
          unitPrice: Number(i.unitPrice),
          originalQuantity: originalQty,
          alreadyReturnedQuantity: alreadyReturned,
          availableToReturnQuantity: availableToReturn,
          stockQty: Number(i.product.stockQty),
        };
      }),
    };
  });
}

export async function createSalesReturnAction(rawData: z.infer<typeof CreateSalesReturnSchema>) {
  return handleAction("createSalesReturnAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER", "CASHIER"]);
    const orgId = session.organizationId;
    const validated = CreateSalesReturnSchema.parse(rawData);

    const now = new Date();
    await assertPostingAllowed(prisma as any, orgId, now);

    const sale = await prisma.sale.findFirst({
      where: { id: validated.saleId, organizationId: orgId },
      include: { items: true, contact: true },
    });
    if (!sale) throw new BusinessError("Sale invoice not found");

    if (validated.refundAmount > 0 && !validated.accountId) {
      throw new BusinessError("A payment account is required when refunding money to the customer.");
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Generate Return Number: SRTN-YYYYMMDD-XXXX
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.salesReturn.count({
        where: {
          organizationId: orgId,
          returnNo: { startsWith: `SRTN-${yyyymmdd}` },
        },
      });
      const returnNo = `SRTN-${yyyymmdd}-${String(count + 1).padStart(4, "0")}`;

      // 2. Prepare items and inventory movements
      let calculatedTotal = D(0);
      const itemsToCreate = [];

      for (const item of validated.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId: orgId },
        });
        if (!product) throw new BusinessError(`Product not found: ${item.productId}`);

        const returnQty = D(item.quantity);
        const rate = D(item.refundRate);
        const lineTotal = returnQty.times(rate);
        calculatedTotal = calculatedTotal.plus(lineTotal);

        itemsToCreate.push({
          productId: item.productId,
          quantity: returnQty,
          refundRate: rate,
          lineTotal,
          restocked: item.restocked,
        });

        // If restocked, increment stock and log StockMovement(SALE_RETURN)
        if (item.restocked) {
          const newStock = D(product.stockQty).plus(returnQty);
          await tx.product.update({
            where: { id: product.id },
            data: { stockQty: newStock },
          });

          await tx.stockMovement.create({
            data: {
              organizationId: orgId,
              productId: product.id,
              type: MovementType.SALE_RETURN,
              quantityDelta: returnQty,
              unitCost: product.avgCost,
              balanceAfter: newStock,
              note: `Sales Return: ${returnNo} (Invoice ${sale.invoiceNo})`,
              createdById: session.userId,
            },
          });
        }
      }

      // 3. Create SalesReturn Record
      const refundAmount = D(validated.refundAmount);
      const salesReturn = await tx.salesReturn.create({
        data: {
          organizationId: orgId,
          returnNo,
          saleId: sale.id,
          refundAmount,
          accountId: validated.accountId || null,
          reason: validated.reason || null,
          status: ReturnStatus.COMPLETED,
          createdById: session.userId,
          items: {
            create: itemsToCreate,
          },
        },
      });

      // 4. If cash/bank refund given, record EXPENSE transaction
      if (refundAmount.gt(0) && validated.accountId) {
        await tx.transaction.create({
          data: {
            organizationId: orgId,
            type: "EXPENSE",
            source: "REFUND",
            amount: refundAmount,
            accountId: validated.accountId,
            saleId: sale.id,
            description: `Sales Refund: ${returnNo} (Invoice ${sale.invoiceNo})`,
            occurredAt: now,
            createdById: session.userId,
          },
        });
      }

      // 5. If customer contact is linked, update ContactLedger
      if (sale.contactId) {
        const contact = await tx.contact.findUniqueOrThrow({ where: { id: sale.contactId } });
        // Credit the customer in the ledger
        await tx.contactLedger.create({
          data: {
            organizationId: orgId,
            contactId: sale.contactId,
            date: now,
            refType: "RETURN",
            refId: salesReturn.id,
            description: `Sales Return: ${returnNo} (Invoice ${sale.invoiceNo})`,
            debit: 0,
            credit: calculatedTotal,
            balanceAfter: contact.currentDue,
            createdById: session.userId,
          },
        });
      }

      revalidatePath("/returns");
      return {
        returnId: salesReturn.id,
        returnNo: salesReturn.returnNo,
        refundAmount: Number(salesReturn.refundAmount),
      };
    }, TX_OPTIONS);
  });
}

export async function createPurchaseReturnAction(rawData: z.infer<typeof CreatePurchaseReturnSchema>) {
  return handleAction("createPurchaseReturnAction", async () => {
    const session = await requireRole(["OWNER", "ADMIN", "MANAGER"]);
    const orgId = session.organizationId;
    const validated = CreatePurchaseReturnSchema.parse(rawData);

    const now = new Date();
    await assertPostingAllowed(prisma as any, orgId, now);

    const purchase = await prisma.purchase.findFirst({
      where: { id: validated.purchaseId, organizationId: orgId },
      include: { supplier: true },
    });
    if (!purchase) throw new BusinessError("Purchase bill not found");

    return await prisma.$transaction(async (tx) => {
      // 1. Generate Return No: PRTN-YYYYMMDD-XXXX
      const today = new Date();
      const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, "");
      const count = await tx.purchaseReturn.count({
        where: {
          organizationId: orgId,
          returnNo: { startsWith: `PRTN-${yyyymmdd}` },
        },
      });
      const returnNo = `PRTN-${yyyymmdd}-${String(count + 1).padStart(4, "0")}`;

      const creditAmount = D(validated.amountCredited);

      // 2. Create PurchaseReturn Record
      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          organizationId: orgId,
          returnNo,
          purchaseId: purchase.id,
          supplierId: purchase.contactId,
          amountCredited: creditAmount,
          reason: validated.reason || null,
          status: ReturnStatus.COMPLETED,
          createdById: session.userId,
        },
      });

      // 3. Decrement supplier due or adjust ledger
      const supplier = await tx.contact.findUniqueOrThrow({ where: { id: purchase.contactId } });
      const newDue = D(supplier.currentDue).minus(creditAmount);

      await tx.contact.update({
        where: { id: purchase.contactId },
        data: { currentDue: newDue },
      });

      // 4. Contact Ledger entry
      await tx.contactLedger.create({
        data: {
          organizationId: orgId,
          contactId: purchase.contactId,
          date: now,
          refType: "PURCHASE_RETURN",
          refId: purchaseReturn.id,
          description: `Purchase Return / Debit Note: ${returnNo} (Bill ${purchase.billNo})`,
          debit: creditAmount,
          credit: 0,
          balanceAfter: newDue,
          createdById: session.userId,
        },
      });

      // 5. If supplier paid cash back
      if (validated.refundAccountId) {
        await tx.transaction.create({
          data: {
            organizationId: orgId,
            type: "INCOME",
            source: "REFUND",
            amount: creditAmount,
            accountId: validated.refundAccountId,
            description: `Supplier cash refund: ${returnNo} (Bill ${purchase.billNo})`,
            occurredAt: now,
            createdById: session.userId,
          },
        });
      }

      revalidatePath("/returns");
      return {
        returnId: purchaseReturn.id,
        returnNo: purchaseReturn.returnNo,
        amountCredited: Number(purchaseReturn.amountCredited),
      };
    }, TX_OPTIONS);
  });
}
