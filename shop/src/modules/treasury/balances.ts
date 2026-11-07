import { prisma, D, BusinessError, type Tx } from "@/lib/prisma";

export interface AccountBalanceItem {
  id: string;
  name: string;
  type: string;
  balance: number;
}

export interface StatementLine {
  id: string;
  occurredAt: Date;
  type: "INCOME" | "EXPENSE";
  source: string;
  amount: number;
  description: string | null;
  transferId: string | null;
  saleId: string | null;
  runningBalance: number;
  user: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export interface StatementResult {
  account: {
    id: string;
    name: string;
    type: string;
  };
  from: Date;
  to: Date;
  openingBalance: number;
  closingBalance: number;
  lines: StatementLine[];
}

/**
 * Calculates current running balance per account as of a given timestamp (voided rows excluded).
 */
export async function balancesAsOf(
  orgId: string,
  asOf: Date = new Date(),
  tx: Tx = prisma
): Promise<AccountBalanceItem[]> {
  const rows = await tx.$queryRaw<{ id: string; name: string; type: string; balance: string }[]>`
    SELECT a.id, a.name, a.type,
      COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END), 0)::text AS balance
    FROM "Account" a
    LEFT JOIN "Transaction" t
      ON t."accountId" = a.id
      AND t."voidedAt" IS NULL
      AND t."occurredAt" <= ${asOf}
    WHERE a."organizationId" = ${orgId} AND a.active = true
    GROUP BY a.id, a.name, a.type
    ORDER BY a.name ASC`;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    balance: Number(r.balance),
  }));
}

/**
 * Returns a detailed lifetime or period account statement with accurate running balance
 * and user attribution for every single transaction.
 */
export async function accountStatement(
  orgId: string,
  accountId: string,
  from: Date,
  to: Date,
  tx: Tx = prisma
): Promise<StatementResult> {
  const account = await tx.account.findFirst({
    where: { id: accountId, organizationId: orgId },
    select: { id: true, name: true, type: true },
  });

  if (!account) {
    throw new BusinessError("Account not found.");
  }

  // 1. Calculate scalar opening balance strictly prior to `from`
  const [openingRow] = await tx.$queryRaw<{ balance: string | null }[]>`
    SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)::text AS balance
    FROM "Transaction"
    WHERE "organizationId" = ${orgId}
      AND "accountId" = ${accountId}
      AND "voidedAt" IS NULL
      AND "occurredAt" < ${from}`;

  let running = Number(openingRow?.balance ?? 0);
  const openingBalance = running;

  // 2. Query transactions in the [from, to] range with user attribution
  const txs = await tx.transaction.findMany({
    where: {
      organizationId: orgId,
      accountId,
      voidedAt: null,
      occurredAt: {
        gte: from,
        lte: to,
      },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: [
      { occurredAt: "asc" },
      { id: "asc" },
    ],
  });

  const lines: StatementLine[] = [];
  for (const t of txs) {
    const amt = Number(t.amount);
    if (t.type === "INCOME") {
      running += amt;
    } else {
      running -= amt;
    }

    lines.push({
      id: t.id,
      occurredAt: t.occurredAt,
      type: t.type,
      source: t.source,
      amount: amt,
      description: t.description,
      transferId: t.transferId,
      saleId: t.saleId,
      runningBalance: Number(running.toFixed(2)),
      user: t.createdBy
        ? {
            id: t.createdBy.id,
            name: t.createdBy.name,
            role: t.createdBy.role,
          }
        : null,
    });
  }

  return {
    account,
    from,
    to,
    openingBalance: Number(openingBalance.toFixed(2)),
    closingBalance: Number(running.toFixed(2)),
    lines,
  };
}
