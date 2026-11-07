"use server";

import { prisma, withDbRetry } from "@/lib/prisma";
import { addManualTransaction, voidTransaction, accountBalances } from "@/modules/finance/service";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getAccounts() {
  return withDbRetry(async () => {
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
  });
}

export async function getTxCategories(type?: "INCOME" | "EXPENSE") {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const where: any = { organizationId: orgId };
    if (type) where.type = type;

    const categories = await prisma.txCategory.findMany({
      where,
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      txCount: c._count.transactions,
    }));
  });
}

export async function createTxCategoryAction(data: {
  name: string;
  type: "INCOME" | "EXPENSE";
}) {
  return handleAction(
    "createTxCategoryAction",
    async () => {
      const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
      const orgId = session.organizationId;

      const name = data.name.trim();
      if (!name || name.length < 2) {
        throw new Error("Category name must be at least 2 characters.");
      }

      const type = data.type === "INCOME" ? "INCOME" : "EXPENSE";

      const existing = await prisma.txCategory.findUnique({
        where: {
          organizationId_name_type: {
            organizationId: orgId,
            name,
            type,
          },
        },
      });

      if (existing) {
        throw new Error(
          `A ${type.toLowerCase()} category named "${name}" already exists.`
        );
      }

      const created = await prisma.txCategory.create({
        data: {
          organizationId: orgId,
          name,
          type,
        },
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/settings");
        revalidatePath("/dashboard");
        revalidatePath("/reports");
      } catch {}

      return { id: created.id, name: created.name, type: created.type };
    },
    "Failed to create transaction category."
  );
}

export async function updateTxCategoryAction(
  id: string,
  data: { name: string; type?: "INCOME" | "EXPENSE" }
) {
  return handleAction(
    "updateTxCategoryAction",
    async () => {
      const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
      const orgId = session.organizationId;

      const name = data.name.trim();
      if (!name || name.length < 2) {
        throw new Error("Category name must be at least 2 characters.");
      }

      const category = await prisma.txCategory.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!category) {
        throw new Error("Category not found.");
      }

      const type = data.type || category.type;

      if (name !== category.name || type !== category.type) {
        const existing = await prisma.txCategory.findUnique({
          where: {
            organizationId_name_type: {
              organizationId: orgId,
              name,
              type,
            },
          },
        });
        if (existing && existing.id !== id) {
          throw new Error(
            `A ${type.toLowerCase()} category named "${name}" already exists.`
          );
        }
      }

      const updated = await prisma.txCategory.update({
        where: { id },
        data: { name, type },
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/settings");
        revalidatePath("/dashboard");
        revalidatePath("/reports");
      } catch {}

      return { id: updated.id, name: updated.name, type: updated.type };
    },
    "Failed to update transaction category."
  );
}

export async function deleteTxCategoryAction(id: string) {
  return handleAction(
    "deleteTxCategoryAction",
    async () => {
      const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
      const orgId = session.organizationId;

      const category = await prisma.txCategory.findFirst({
        where: { id, organizationId: orgId },
      });
      if (!category) {
        throw new Error("Category not found.");
      }

      // Safely unlink any existing transactions to preserve financial audit trail
      await prisma.transaction.updateMany({
        where: { categoryId: id, organizationId: orgId },
        data: { categoryId: null },
      });

      await prisma.txCategory.delete({
        where: { id },
      });

      try {
        revalidatePath("/finance");
        revalidatePath("/settings");
        revalidatePath("/dashboard");
        revalidatePath("/reports");
      } catch {}

      return {};
    },
    "Failed to delete transaction category."
  );
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

  const [txs, accounts, allTxs] = await withDbRetry(() =>
    Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: true,
          category: true,
          sale: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
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
    ])
  );

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
      categoryName:
        t.category?.name ??
        (t.source === "SALE"
          ? "Sales Income"
          : t.source === "PURCHASE"
          ? "Inventory Purchase"
          : t.source === "TRANSFER"
          ? "Account Transfer"
          : t.source === "CLOSING_ADJUSTMENT"
          ? "Reconciliation Adjustment"
          : t.source === "REFUND"
          ? "Customer Refund"
          : "General"),
      description: t.description || (t.sale ? `Invoice ${t.sale.invoiceNo}` : "-"),
      occurredAt: t.occurredAt.toISOString(),
      voidedAt: t.voidedAt ? t.voidedAt.toISOString() : null,
      createdByName: t.createdBy?.name ?? null,
      createdByRole: t.createdBy?.role ?? null,
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
      userId: session.userId,
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
