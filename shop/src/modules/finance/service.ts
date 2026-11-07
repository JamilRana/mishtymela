import { z } from "zod";
import { prisma, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { assertPostingAllowed } from "@/modules/treasury/guard";

export const manualTxSchema = z.object({
  orgId: z.string().uuid(),
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.coerce.number().positive(),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(200).optional(),
  occurredAt: z.coerce.date().default(() => new Date()),
  userId: z.string().uuid().optional(),
});

/** Rent, salary, utilities, other income. Sales and stock purchases are posted automatically. */
export async function addManualTransaction(input: z.input<typeof manualTxSchema>) {
  const i = manualTxSchema.parse(input);
  return prisma.$transaction(async (tx) => {
    await assertPostingAllowed(tx, i.orgId, i.occurredAt);
    return tx.transaction.create({
      data: {
        organizationId: i.orgId,
        type: i.type,
        source: "MANUAL",
        amount: D(i.amount),
        accountId: i.accountId,
        categoryId: i.categoryId,
        description: i.description,
        occurredAt: i.occurredAt,
        createdById: i.userId,
      },
    });
  }, TX_OPTIONS);
}

export async function voidTransaction(orgId: string, id: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.transaction.findFirst({
      where: { id, organizationId: orgId, source: "MANUAL", voidedAt: null },
    });
    if (!existing) {
      throw new BusinessError("Transaction not found or already voided.");
    }
    await assertPostingAllowed(tx, orgId, existing.occurredAt);
    return tx.transaction.update({
      where: { id: existing.id },
      data: { voidedAt: new Date() },
    });
  }, TX_OPTIONS);
}

/** Current balance per account = money in minus money out (voided rows excluded). */
export async function accountBalances(orgId: string) {
  return prisma.$queryRaw<{ id: string; name: string; type: string; balance: string }[]>`
    SELECT a.id, a.name, a.type,
      COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END), 0)::text AS balance
    FROM "Account" a
    LEFT JOIN "Transaction" t ON t."accountId" = a.id AND t."voidedAt" IS NULL
    WHERE a."organizationId" = ${orgId} GROUP BY a.id ORDER BY a.name`;
}
