import { z } from "zod";
import { prisma, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { assertPostingAllowed } from "./guard";

export const transferFundsSchema = z.object({
  orgId: z.string().uuid(),
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.coerce.number().positive("Transfer amount must be greater than zero"),
  note: z.string().max(200).optional(),
  occurredAt: z.coerce.date().default(() => new Date()),
  userId: z.string().uuid(),
});

export type TransferFundsInput = z.input<typeof transferFundsSchema>;

/**
 * Transfers money between two accounts belonging to the same organization.
 * Posts two neutral ledger rows with source = TRANSFER and a shared transferId.
 * Never impacts profit or operating expenses.
 */
export async function transferFunds(input: TransferFundsInput) {
  const i = transferFundsSchema.parse(input);

  if (i.fromAccountId === i.toAccountId) {
    throw new BusinessError("Source and destination accounts must be different.");
  }

  return prisma.$transaction(async (tx) => {
    // 1. Guard against closed periods
    await assertPostingAllowed(tx, i.orgId, i.occurredAt);

    // 2. Lock both account rows to prevent race conditions
    const [fromAccount] = await tx.$queryRaw<{ id: string; name: string; type: string }[]>`
      SELECT id, name, type FROM "Account"
      WHERE id = ${i.fromAccountId} AND "organizationId" = ${i.orgId} AND active = true
      FOR UPDATE`;

    if (!fromAccount) {
      throw new BusinessError("Source account not found or inactive.");
    }

    const [toAccount] = await tx.$queryRaw<{ id: string; name: string; type: string }[]>`
      SELECT id, name, type FROM "Account"
      WHERE id = ${i.toAccountId} AND "organizationId" = ${i.orgId} AND active = true
      FOR UPDATE`;

    if (!toAccount) {
      throw new BusinessError("Destination account not found or inactive.");
    }

    // 3. Block overdrawing Cash, Safe, or Owner accounts
    if (["CASH", "SAFE", "OWNER"].includes(fromAccount.type)) {
      const [fromBalanceRow] = await tx.$queryRaw<{ balance: string | null }[]>`
        SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)::text AS balance
        FROM "Transaction"
        WHERE "accountId" = ${fromAccount.id} AND "voidedAt" IS NULL`;

      const currentBalance = Number(fromBalanceRow?.balance ?? 0);
      if (currentBalance < i.amount) {
        throw new BusinessError(
          `Insufficient funds in ${fromAccount.name}. Available: ৳${currentBalance.toFixed(2)}, Requested: ৳${i.amount.toFixed(2)}.`
        );
      }
    }

    // 4. Generate shared transfer ID
    const transferId = crypto.randomUUID();
    const amountDec = D(i.amount).toDecimalPlaces(2);
    const descFrom = i.note?.trim()
      ? `${i.note.trim()} (To: ${toAccount.name})`
      : `Transfer to ${toAccount.name}`;
    const descTo = i.note?.trim()
      ? `${i.note.trim()} (From: ${fromAccount.name})`
      : `Transfer from ${fromAccount.name}`;

    // 5. Post outflow row from source
    const outRow = await tx.transaction.create({
      data: {
        organizationId: i.orgId,
        type: "EXPENSE",
        source: "TRANSFER",
        amount: amountDec,
        accountId: fromAccount.id,
        transferId,
        description: descFrom,
        occurredAt: i.occurredAt,
        createdById: i.userId,
      },
    });

    // 6. Post inflow row to destination
    const inRow = await tx.transaction.create({
      data: {
        organizationId: i.orgId,
        type: "INCOME",
        source: "TRANSFER",
        amount: amountDec,
        accountId: toAccount.id,
        transferId,
        description: descTo,
        occurredAt: i.occurredAt,
        createdById: i.userId,
      },
    });

    // 7. Write audit log entry with user attribution
    await tx.auditLog.create({
      data: {
        organizationId: i.orgId,
        userId: i.userId,
        action: "TRANSFER",
        entity: "Transaction",
        entityId: transferId,
        detail: {
          fromAccount: fromAccount.name,
          toAccount: toAccount.name,
          amount: i.amount,
          note: i.note,
          outTxId: outRow.id,
          inTxId: inRow.id,
        },
      },
    });

    return {
      transferId,
      fromAccount: fromAccount.name,
      toAccount: toAccount.name,
      amount: i.amount,
      outRow,
      inRow,
    };
  }, TX_OPTIONS);
}
