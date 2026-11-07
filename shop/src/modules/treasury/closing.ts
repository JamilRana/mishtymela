import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma, D, BusinessError, TX_OPTIONS } from "@/lib/prisma";
import { assertPostingAllowed } from "./guard";

export interface AccountClosingCalculation {
  accountId: string;
  accountName: string;
  accountType: string;
  openingBalance: number;
  salesIn: number;
  otherIn: number;
  expensesOut: number;
  purchasesOut: number;
  transfersNet: number;
  expectedBalance: number;
}

export interface CashierSalesSummary {
  userId: string;
  userName: string;
  userRole: string;
  orderCount: number;
  totalSales: number;
}

export interface PrepareClosingResult {
  session: {
    id: string;
    openedAt: Date;
    businessDate: Date;
    openedBy: { id: string; name: string; role: string };
  };
  accounts: AccountClosingCalculation[];
  cashierSummary: CashierSalesSummary[];
  fingerprint: string;
}

export const closeDaySchema = z.object({
  orgId: z.string().uuid(),
  counted: z.array(
    z.object({
      accountId: z.string().uuid(),
      amount: z.coerce.number().min(0, "Counted amount cannot be negative"),
      reason: z.string().max(255).optional(),
    })
  ).min(1, "At least one account count is required"),
  fingerprint: z.string().min(1, "Closing fingerprint is required"),
  approverId: z.string().uuid().optional(),
  approverPassword: z.string().optional(),
  note: z.string().max(200).optional(),
  userId: z.string().uuid(),
});

export type CloseDayInput = z.input<typeof closeDaySchema>;

/**
 * Computes expected balances per account, cashier sales contribution, and optimistic fingerprint.
 */
export async function prepareClosing(orgId: string): Promise<PrepareClosingResult> {
  const session = await prisma.daySession.findFirst({
    where: { organizationId: orgId, status: "OPEN" },
    include: {
      openedBy: { select: { id: true, name: true, role: true } },
    },
  });

  if (!session) {
    throw new BusinessError("No trading day is currently open.");
  }

  // Session start window: start from previous session closedAt, or current session openedAt
  const previousSession = await prisma.daySession.findFirst({
    where: {
      organizationId: orgId,
      status: "CLOSED",
      closedAt: { lt: session.openedAt },
    },
    include: {
      closings: true,
    },
    orderBy: { closedAt: "desc" },
  });

  const sessionStart = previousSession?.closedAt ?? session.openedAt;

  // Active accounts
  const accounts = await prisma.account.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });

  // Query transactions occurred since sessionStart (excluding voided)
  const txs = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      voidedAt: null,
      occurredAt: { gte: sessionStart },
    },
    orderBy: { createdAt: "asc" },
  });

  // Fingerprint is tx count + latest transaction timestamp
  const latestTx = txs[txs.length - 1];
  const fingerprint = `${txs.length}_${latestTx?.createdAt?.getTime() ?? 0}`;

  // Prior session closing map
  const priorClosingsMap = new Map<string, number>();
  if (previousSession) {
    for (const c of previousSession.closings) {
      priorClosingsMap.set(c.accountId, Number(c.countedBalance));
    }
  }

  // Pre-calculate opening balances for any accounts missing from prior close
  const accountsCalculations: AccountClosingCalculation[] = [];

  for (const acc of accounts) {
    let opening = priorClosingsMap.get(acc.id);

    if (opening === undefined) {
      // First session ever or newly created account: compute ledger prior to sessionStart
      const [openRow] = await prisma.$queryRaw<{ balance: string | null }[]>`
        SELECT COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END), 0)::text AS balance
        FROM "Transaction"
        WHERE "accountId" = ${acc.id} AND "voidedAt" IS NULL AND "occurredAt" < ${sessionStart}`;
      opening = Number(openRow?.balance ?? 0);
    }

    let salesIn = 0;
    let otherIn = 0;
    let expensesOut = 0;
    let purchasesOut = 0;
    let transfersNet = 0;

    for (const t of txs) {
      if (t.accountId !== acc.id) continue;
      const amt = Number(t.amount);

      if (t.source === "TRANSFER") {
        transfersNet += t.type === "INCOME" ? amt : -amt;
      } else if (t.source === "SALE") {
        if (t.type === "INCOME") salesIn += amt;
      } else if (t.source === "PURCHASE") {
        if (t.type === "EXPENSE") purchasesOut += amt;
      } else if (t.source === "MANUAL" || t.source === "REFUND") {
        if (t.type === "INCOME") otherIn += amt;
        else expensesOut += amt;
      }
    }

    const expectedBalance = Number(
      (opening + salesIn + otherIn - expensesOut - purchasesOut + transfersNet).toFixed(2)
    );

    accountsCalculations.push({
      accountId: acc.id,
      accountName: acc.name,
      accountType: acc.type,
      openingBalance: Number(opening.toFixed(2)),
      salesIn: Number(salesIn.toFixed(2)),
      otherIn: Number(otherIn.toFixed(2)),
      expensesOut: Number(expensesOut.toFixed(2)),
      purchasesOut: Number(purchasesOut.toFixed(2)),
      transfersNet: Number(transfersNet.toFixed(2)),
      expectedBalance,
    });
  }

  // Cashier breakdown for this session
  const sales = await prisma.sale.findMany({
    where: {
      organizationId: orgId,
      status: "COMPLETED",
      createdAt: { gte: sessionStart },
    },
    select: {
      id: true,
      paid: true,
      createdById: true,
    },
  });

  const userIds = Array.from(new Set(sales.map((s) => s.createdById).filter(Boolean))) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, role: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const cashierAgg = new Map<string, { orderCount: number; totalSales: number }>();
  for (const s of sales) {
    const uid = s.createdById ?? "unassigned";
    const cur = cashierAgg.get(uid) || { orderCount: 0, totalSales: 0 };
    cur.orderCount += 1;
    cur.totalSales += Number(s.paid);
    cashierAgg.set(uid, cur);
  }

  const cashierSummary: CashierSalesSummary[] = Array.from(cashierAgg.entries()).map(
    ([uid, stat]) => {
      const u = userMap.get(uid);
      return {
        userId: uid,
        userName: u ? u.name : "System / Unknown",
        userRole: u ? u.role : "STAFF",
        orderCount: stat.orderCount,
        totalSales: Number(stat.totalSales.toFixed(2)),
      };
    }
  );

  return {
    session: {
      id: session.id,
      openedAt: session.openedAt,
      businessDate: session.businessDate,
      openedBy: session.openedBy,
    },
    accounts: accountsCalculations,
    cashierSummary,
    fingerprint,
  };
}

/**
 * Closes the active day session atomically.
 * Verifies fingerprint, validates variance reasons and approver credentials,
 * posts CLOSING_ADJUSTMENT transactions to bring ledger in sync with counts,
 * locks booksClosedThrough cutoff, and saves immutable DayAccountClosing records.
 */
export async function closeDay(input: CloseDayInput) {
  const i = closeDaySchema.parse(input);

  return prisma.$transaction(async (tx) => {
    // 1. Guard check & fetch active session
    const session = await tx.daySession.findFirst({
      where: { organizationId: i.orgId, status: "OPEN" },
      include: {
        openedBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!session) {
      throw new BusinessError("No trading day is currently open to close.");
    }

    const now = new Date();
    await assertPostingAllowed(tx, i.orgId, now);

    // 2. Re-compute prepareClosing to check fingerprint
    const prepared = await prepareClosing(i.orgId);
    if (prepared.fingerprint !== i.fingerprint) {
      throw new BusinessError(
        "Account balances changed while closing was in progress. Please review the updated figures."
      );
    }

    // 3. Match counted with expected and compute variances
    const countedMap = new Map(i.counted.map((c) => [c.accountId, c]));
    const closingRowsData: {
      accountId: string;
      openingBalance: number;
      salesIn: number;
      otherIn: number;
      expensesOut: number;
      purchasesOut: number;
      transfersNet: number;
      expectedBalance: number;
      countedBalance: number;
      variance: number;
      varianceReason?: string;
    }[] = [];

    let hasNonZeroVariance = false;

    for (const exp of prepared.accounts) {
      const c = countedMap.get(exp.accountId);
      if (!c) {
        throw new BusinessError(`Count missing for account: ${exp.accountName}`);
      }

      const variance = Number((c.amount - exp.expectedBalance).toFixed(2));
      if (Math.abs(variance) > 0.009) {
        hasNonZeroVariance = true;
        if (!c.reason || c.reason.trim().length < 3) {
          throw new BusinessError(
            `A reason of at least 3 characters is required for variance in ${exp.accountName} (৳${variance.toFixed(2)}).`
          );
        }
      }

      closingRowsData.push({
        accountId: exp.accountId,
        openingBalance: exp.openingBalance,
        salesIn: exp.salesIn,
        otherIn: exp.otherIn,
        expensesOut: exp.expensesOut,
        purchasesOut: exp.purchasesOut,
        transfersNet: exp.transfersNet,
        expectedBalance: exp.expectedBalance,
        countedBalance: c.amount,
        variance,
        varianceReason: c.reason?.trim(),
      });
    }

    // 4. If variance exists, verify authorized approver (OWNER or ADMIN) with password
    let authorizedApproverId: string | undefined = i.approverId;
    if (hasNonZeroVariance) {
      if (!i.approverId || !i.approverPassword) {
        throw new BusinessError(
          "Variance detected. An authorized Owner or Admin must enter their password to approve."
        );
      }

      const approver = await tx.user.findFirst({
        where: { id: i.approverId, organizationId: i.orgId, active: true },
      });

      if (!approver || (approver.role !== "OWNER" && approver.role !== "ADMIN")) {
        throw new BusinessError("Approver must have an active OWNER or ADMIN role.");
      }

      if (!approver.passwordHash) {
        throw new BusinessError("Approver does not have a valid password set.");
      }

      const isValidPassword = await bcrypt.compare(i.approverPassword, approver.passwordHash);
      if (!isValidPassword) {
        throw new BusinessError("Invalid approver password.");
      }

      authorizedApproverId = approver.id;
    }

    // 5. Find or ensure "Cash difference" categories exist
    let diffExpenseCat = await tx.txCategory.findFirst({
      where: { organizationId: i.orgId, name: "Cash difference", type: "EXPENSE" },
    });
    if (!diffExpenseCat) {
      diffExpenseCat = await tx.txCategory.create({
        data: { organizationId: i.orgId, name: "Cash difference", type: "EXPENSE" },
      });
    }

    let diffIncomeCat = await tx.txCategory.findFirst({
      where: { organizationId: i.orgId, name: "Cash difference", type: "INCOME" },
    });
    if (!diffIncomeCat) {
      diffIncomeCat = await tx.txCategory.create({
        data: { organizationId: i.orgId, name: "Cash difference", type: "INCOME" },
      });
    }

    // 6. Post CLOSING_ADJUSTMENT rows and write DayAccountClosing
    const createdClosings = [];
    for (const row of closingRowsData) {
      let adjustmentTxId: string | null = null;

      if (Math.abs(row.variance) > 0.009) {
        if (row.variance < 0) {
          // Shortage: EXPENSE
          const adjTx = await tx.transaction.create({
            data: {
              organizationId: i.orgId,
              type: "EXPENSE",
              source: "CLOSING_ADJUSTMENT",
              amount: D(Math.abs(row.variance)),
              accountId: row.accountId,
              categoryId: diffExpenseCat.id,
              description: `Closing shortage adjustment: ${row.varianceReason ?? "Cash difference"}`,
              occurredAt: now,
              createdById: i.userId,
            },
          });
          adjustmentTxId = adjTx.id;
        } else {
          // Surplus: INCOME
          const adjTx = await tx.transaction.create({
            data: {
              organizationId: i.orgId,
              type: "INCOME",
              source: "CLOSING_ADJUSTMENT",
              amount: D(row.variance),
              accountId: row.accountId,
              categoryId: diffIncomeCat.id,
              description: `Closing surplus adjustment: ${row.varianceReason ?? "Cash difference"}`,
              occurredAt: now,
              createdById: i.userId,
            },
          });
          adjustmentTxId = adjTx.id;
        }
      }

      const closingRecord = await tx.dayAccountClosing.create({
        data: {
          sessionId: session.id,
          accountId: row.accountId,
          openingBalance: D(row.openingBalance),
          salesIn: D(row.salesIn),
          otherIn: D(row.otherIn),
          expensesOut: D(row.expensesOut),
          purchasesOut: D(row.purchasesOut),
          transfersNet: D(row.transfersNet),
          expectedBalance: D(row.expectedBalance),
          countedBalance: D(row.countedBalance),
          variance: D(row.variance),
          varianceReason: row.varianceReason,
          adjustmentTxId,
        },
      });

      createdClosings.push(closingRecord);
    }

    // 7. Update DaySession to CLOSED
    const closedSession = await tx.daySession.update({
      where: { id: session.id },
      data: {
        status: "CLOSED",
        closedAt: now,
        closedById: i.userId,
        approvedById: authorizedApproverId ?? i.userId,
        note: i.note,
      },
    });

    // 8. Update Organization booksClosedThrough
    await tx.organization.update({
      where: { id: i.orgId },
      data: { booksClosedThrough: now },
    });

    // 9. Write Audit Log
    await tx.auditLog.create({
      data: {
        organizationId: i.orgId,
        userId: i.userId,
        action: "CLOSE_DAY",
        entity: "DaySession",
        entityId: session.id,
        detail: {
          closedAt: now.toISOString(),
          approverId: authorizedApproverId,
          hasVariance: hasNonZeroVariance,
          accountsCounted: closingRowsData.length,
          note: i.note,
        },
      },
    });

    return {
      session: closedSession,
      closings: createdClosings,
    };
  }, TX_OPTIONS);
}
