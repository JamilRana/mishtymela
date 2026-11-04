"use server";

import { prisma } from "@/lib/prisma";
import { addManualTransaction, voidTransaction, accountBalances } from "@/modules/finance/service";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getAccounts() {
  const session = await requireAuth();
  const orgId = session.organizationId;

  const accounts = await prisma.account.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });

  // Only Admin and Owner get to see the actual ledger balance figures
  const isPrivileged = session.role === "ADMIN" || session.role === "OWNER";
  let balanceMap = new Map<string, number>();

  if (isPrivileged) {
    const balances = await accountBalances(orgId);
    balanceMap = new Map(balances.map((b) => [b.id, Number(b.balance)]));
  }

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    balance: balanceMap.get(a.id) ?? 0,
  }));
}

export async function getTxCategories() {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  return prisma.txCategory.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export interface GetTransactionsOptions {
  period?: "today" | "yesterday" | "this_month" | "all" | "custom";
  startDate?: string;
  endDate?: string;
}

export async function getTransactions(options?: GetTransactionsOptions) {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  const now = new Date();
  const dhakaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = dhakaFormatter.format(now);
  const [currentYear, currentMonth] = todayStr.split("-").map(Number);

  // Default period is "today"
  const period = options?.period || "today";
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  let label = "আজ";

  if (period === "today") {
    fromDate = new Date(`${todayStr}T00:00:00+06:00`);
    toDate = new Date(`${todayStr}T23:59:59.999+06:00`);
    label = `আজ (${todayStr})`;
  } else if (period === "yesterday") {
    const yDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yStr = dhakaFormatter.format(yDate);
    fromDate = new Date(`${yStr}T00:00:00+06:00`);
    toDate = new Date(`${yStr}T23:59:59.999+06:00`);
    label = `গতকাল (${yStr})`;
  } else if (period === "this_month") {
    const mStr = String(currentMonth).padStart(2, "0");
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    fromDate = new Date(`${currentYear}-${mStr}-01T00:00:00+06:00`);
    toDate = new Date(`${currentYear}-${mStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999+06:00`);
    label = `এই মাস`;
  } else if (period === "custom" && options?.startDate && options?.endDate) {
    fromDate = new Date(`${options.startDate}T00:00:00+06:00`);
    toDate = new Date(`${options.endDate}T23:59:59.999+06:00`);
    label = `${options.startDate} হতে ${options.endDate}`;
  } else if (period === "all") {
    label = "সব লেনদেন";
  }

  const where: any = { organizationId: orgId };
  if (fromDate && toDate) {
    where.occurredAt = { gte: fromDate, lte: toDate };
  }

  const [txs, accounts, allTxs] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
        sale: true,
      },
      orderBy: { occurredAt: "desc" },
      take: 200,
    }),
    prisma.account.findMany({
      where: { organizationId: orgId, active: true },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        voidedAt: null,
        ...(toDate ? { occurredAt: { lte: toDate } } : {}),
      },
      select: {
        accountId: true,
        type: true,
        amount: true,
        occurredAt: true,
      },
    }),
  ]);

  // Closing Balance Calculation
  const accountsClosing = accounts.map((acc) => {
    let opening = 0;
    let inflows = 0;
    let outflows = 0;

    for (const t of allTxs) {
      if (t.accountId !== acc.id) continue;
      const amt = Number(t.amount);
      const isBefore = fromDate ? t.occurredAt < fromDate : false;
      if (isBefore) {
        if (t.type === "INCOME") opening += amt;
        else opening -= amt;
      } else {
        if (t.type === "INCOME") inflows += amt;
        else outflows += amt;
      }
    }

    const closing = opening + inflows - outflows;
    return {
      id: acc.id,
      name: acc.name,
      type: acc.type,
      openingBalance: opening,
      inflows,
      outflows,
      closingBalance: closing,
    };
  });

  const closingBalanceSummary = {
    openingTotal: accountsClosing.reduce((s, a) => s + a.openingBalance, 0),
    inflowsTotal: accountsClosing.reduce((s, a) => s + a.inflows, 0),
    outflowsTotal: accountsClosing.reduce((s, a) => s + a.outflows, 0),
    closingTotal: accountsClosing.reduce((s, a) => s + a.closingBalance, 0),
    accounts: accountsClosing,
  };

  return {
    transactions: txs.map((t) => ({
      id: t.id,
      type: t.type,
      source: t.source,
      amount: Number(t.amount),
      accountName: t.account.name,
      categoryName: t.category?.name ?? (t.source === "SALE" ? "Sales Income" : t.source === "PURCHASE" ? "Inventory Purchase" : "General"),
      description: t.description || (t.sale ? `Invoice ${t.sale.invoiceNo}` : "-"),
      occurredAt: t.occurredAt.toISOString(),
      voidedAt: t.voidedAt ? t.voidedAt.toISOString() : null,
    })),
    closingBalanceSummary,
    period,
    label,
  };
}

export async function addManualTransactionAction(data: {
  type: "INCOME" | "EXPENSE";
  amount: number;
  accountId: string;
  categoryId?: string;
  description?: string;
  occurredAt?: Date;
}) {
  return handleAction("addManualTransactionAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    await addManualTransaction({
      orgId,
      type: data.type,
      amount: data.amount,
      accountId: data.accountId,
      categoryId: data.categoryId,
      description: data.description,
      occurredAt: data.occurredAt,
    });

    try {
      revalidatePath("/finance");
      revalidatePath("/dashboard");
    } catch {}

    return {};
  }, "Failed to record transaction.");
}

export async function voidTransactionAction(id: string) {
  return handleAction("voidTransactionAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    await voidTransaction(orgId, id);

    try {
      revalidatePath("/finance");
      revalidatePath("/dashboard");
    } catch {}

    return {};
  }, "Failed to void transaction.");
}
