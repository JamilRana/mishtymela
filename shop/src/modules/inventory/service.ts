import { MovementType, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma, D, BusinessError, TX_OPTIONS, type Tx } from "@/lib/prisma";
import { assertPostingAllowed } from "@/modules/treasury/guard";

interface MoveInput {
  orgId: string; productId: string; type: MovementType;
  qty: Prisma.Decimal.Value;            // SIGNED
  unitCost?: Prisma.Decimal.Value;      // required for PURCHASE; others use current avg cost unless given
  refType?: string; refId?: string; note?: string; userId?: string;
}

/** Single entry point for every stock change. Locks the product row, blocks negative stock,
 *  keeps weighted-average cost, writes the ledger row. Must run inside a transaction. */
export async function applyMovement(tx: Tx, m: MoveInput) {
  const rows = await tx.$queryRaw<{ stockQty: Prisma.Decimal; avgCost: Prisma.Decimal }[]>`
    SELECT "stockQty", "avgCost" FROM "Product"
    WHERE id = ${m.productId} AND "organizationId" = ${m.orgId} FOR UPDATE`;
  const p = rows[0];
  if (!p) throw new BusinessError("Product not found");

  const qty = D(m.qty);
  const stock = D(p.stockQty), avg = D(p.avgCost);
  const newStock = stock.plus(qty);
  if (newStock.lt(0)) throw new BusinessError("Insufficient stock");

  const unitCost = m.unitCost !== undefined ? D(m.unitCost) : avg;
  let newAvg = avg;
  if (m.type === "PURCHASE" || (m.type === "PRODUCTION" && qty.gt(0))) {
    if (qty.lte(0)) throw new BusinessError("Purchase or production output quantity must be positive");
    newAvg = stock.lte(0) ? unitCost : stock.mul(avg).plus(qty.mul(unitCost)).div(newStock);
  }

  await tx.product.update({
    where: { id: m.productId },
    data: { stockQty: newStock, avgCost: newAvg.toDecimalPlaces(4) },
  });
  await tx.stockMovement.create({
    data: {
      organizationId: m.orgId, productId: m.productId, type: m.type, quantityDelta: qty,
      unitCost: unitCost.toDecimalPlaces(4), balanceAfter: newStock, refType: m.refType,
      refId: m.refId, note: m.note, createdById: m.userId,
    },
  });
  return { unitCost, balanceAfter: newStock };
}

export const receiveStockSchema = z.object({
  orgId: z.string().uuid(), productId: z.string().uuid(),
  quantity: z.coerce.number().positive(), unitCost: z.coerce.number().min(0),
  accountId: z.string().uuid().optional(),   // set when paid now; omit for unpaid stock
  note: z.string().max(200).optional(), userId: z.string().uuid().optional(),
});

/** Stock in. Optionally records the cash out as a PURCHASE transaction (not an operating expense). */
export async function receiveStock(input: z.input<typeof receiveStockSchema>) {
  const i = receiveStockSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    if (i.accountId) {
      await assertPostingAllowed(tx, i.orgId, new Date());
    }
    const r = await applyMovement(tx, {
      orgId: i.orgId, productId: i.productId, type: "PURCHASE", qty: i.quantity,
      unitCost: i.unitCost, note: i.note, userId: i.userId, refType: "purchase",
    });
    if (i.accountId) {
      await tx.transaction.create({
        data: { organizationId: i.orgId, type: "EXPENSE", source: "PURCHASE", accountId: i.accountId,
          amount: D(i.quantity).mul(i.unitCost).toDecimalPlaces(2), description: i.note ?? "Stock purchase",
          createdById: i.userId },
      });
    }
    return r;
  }, TX_OPTIONS);
}

export const adjustStockSchema = z.object({
  orgId: z.string().uuid(), productId: z.string().uuid(),
  quantityDelta: z.coerce.number().refine((n) => n !== 0, "Delta cannot be zero"),
  reason: z.string().min(2).max(200), userId: z.string().uuid().optional(),
});

/** Damage, loss, count corrections. Always needs a reason. */
export async function adjustStock(input: z.input<typeof adjustStockSchema>) {
  const i = adjustStockSchema.parse(input);
  return prisma.$transaction((tx) =>
    applyMovement(tx, { orgId: i.orgId, productId: i.productId, type: "ADJUSTMENT", qty: i.quantityDelta,
      note: i.reason, userId: i.userId, refType: "adjustment" }), TX_OPTIONS);
}

export async function lowStockProducts(orgId: string) {
  return prisma.$queryRaw<{ id: string; name: string; sku: string; stockQty: Prisma.Decimal; reorderLevel: Prisma.Decimal }[]>`
    SELECT id, name, sku, "stockQty", "reorderLevel" FROM "Product"
    WHERE "organizationId" = ${orgId} AND active AND "stockQty" <= "reorderLevel"
    ORDER BY "stockQty" ASC`;
}
