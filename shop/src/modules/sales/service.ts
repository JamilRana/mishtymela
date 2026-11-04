import { z } from "zod";
import { prisma, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { applyMovement } from "@/modules/inventory/service";

export const createSaleSchema = z.object({
  orgId: z.string().uuid(),
  idempotencyKey: z.string().min(8).max(100),       // generate once per checkout attempt on the client
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().positive(),
    unitPrice: z.coerce.number().min(0).optional(), // defaults to product selling price
  })).min(1),
  discount: z.coerce.number().min(0).default(0),
  paid: z.coerce.number().min(0).optional(),        // defaults to full payment; less = customer owes the rest
  accountId: z.string().uuid().optional(),          // required when paid > 0
  customerName: z.string().max(100).optional(),
  userId: z.string().uuid().optional(),
});

export async function createSale(input: z.input<typeof createSaleSchema>) {
  const i = createSaleSchema.parse(input);

  // Retried request returns the original sale instead of duplicating it.
  const existing = await prisma.sale.findUnique({ where: { idempotencyKey: i.idempotencyKey }, include: { items: true } });
  if (existing) return existing;

  try {
    return await prisma.$transaction(async (tx) => {
      const seq = await tx.invoiceSequence.upsert({
        where: { organizationId: i.orgId },
        create: { organizationId: i.orgId, lastNo: 1 },
        update: { lastNo: { increment: 1 } },
      });

      // Sorted lock order prevents deadlocks between concurrent sales.
      const lines = [...i.items].sort((a, b) => a.productId.localeCompare(b.productId));
      const built = [];
      let subtotal = D(0);
      for (const l of lines) {
        const product = await tx.product.findFirst({ where: { id: l.productId, organizationId: i.orgId, active: true } });
        if (!product) throw new BusinessError("Product not found or inactive");
        const price = D(l.unitPrice ?? product.sellingPrice);
        const { unitCost } = await applyMovement(tx, {
          orgId: i.orgId, productId: l.productId, type: "SALE", qty: D(l.quantity).neg(),
          refType: "sale", userId: i.userId,
        });
        const lineTotal = price.mul(l.quantity).toDecimalPlaces(2);
        subtotal = subtotal.plus(lineTotal);
        built.push({ productId: l.productId, productName: product.name, quantity: D(l.quantity),
          unitPrice: price, unitCost, lineTotal });
      }

      const discount = D(i.discount);
      if (discount.gt(subtotal)) throw new BusinessError("Discount exceeds subtotal");
      const total = subtotal.minus(discount);
      // In retail POS, customer may tender cash greater than total (change given).
      // Amount credited towards the invoice/income must be capped at total.
      const rawPaid = D(i.paid ?? total);
      if (rawPaid.lt(0)) throw new BusinessError("Payment cannot be negative");
      const paid = rawPaid.gt(total) ? total : rawPaid;
      if (paid.gt(0) && !i.accountId) throw new BusinessError("Select an account for the payment");

      const sale = await tx.sale.create({
        data: {
          organizationId: i.orgId, invoiceNo: `INV-${String(seq.lastNo).padStart(6, "0")}`,
          customerName: i.customerName, subtotal, discount, total, paid,
          idempotencyKey: i.idempotencyKey, createdById: i.userId, items: { create: built },
        },
        include: { items: true },
      });

      if (paid.gt(0)) {
        await tx.transaction.create({
          data: { organizationId: i.orgId, type: "INCOME", source: "SALE", amount: paid,
            accountId: i.accountId!, saleId: sale.id, description: sale.invoiceNo, createdById: i.userId },
        });
      }
      return sale;
    }, TX_OPTIONS);
  } catch (e: any) {
    // Two simultaneous retries with the same key: the loser gets the winner's sale.
    if (e?.code === "P2002" && String(e?.meta?.target).includes("idempotencyKey")) {
      return prisma.sale.findUniqueOrThrow({ where: { idempotencyKey: i.idempotencyKey }, include: { items: true } });
    }
    throw e;
  }
}

/** Collect a later payment on a credit sale. */
export async function recordSalePayment(p: { orgId: string; saleId: string; amount: number; accountId: string; userId?: string }) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({ where: { id: p.saleId, organizationId: p.orgId, status: "COMPLETED" } });
    if (!sale) throw new BusinessError("Sale not found");
    const amount = D(p.amount);
    if (amount.lte(0) || sale.paid.plus(amount).gt(sale.total)) throw new BusinessError("Invalid payment amount");
    await tx.sale.update({ where: { id: sale.id }, data: { paid: sale.paid.plus(amount) } });
    return tx.transaction.create({
      data: { organizationId: p.orgId, type: "INCOME", source: "SALE", amount, accountId: p.accountId,
        saleId: sale.id, description: `${sale.invoiceNo} payment`, createdById: p.userId },
    });
  }, TX_OPTIONS);
}

/** Void a completed sale: stock returns at the sold cost, linked income is voided. History is kept. */
export async function voidSale(p: { orgId: string; saleId: string; userId?: string }) {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({ where: { id: p.saleId, organizationId: p.orgId }, include: { items: true } });
    if (!sale) throw new BusinessError("Sale not found");
    if (sale.status === "VOID") throw new BusinessError("Sale already voided");
    for (const it of [...sale.items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      await applyMovement(tx, { orgId: p.orgId, productId: it.productId, type: "SALE_VOID", qty: it.quantity,
        unitCost: it.unitCost, refType: "sale", refId: sale.id, userId: p.userId });
    }
    const now = new Date();
    await tx.transaction.updateMany({ where: { saleId: sale.id, voidedAt: null }, data: { voidedAt: now } });
    return tx.sale.update({ where: { id: sale.id }, data: { status: "VOID", voidedAt: now } });
  }, TX_OPTIONS);
}
