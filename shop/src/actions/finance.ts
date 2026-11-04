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

export async function getTransactions() {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  const txs = await prisma.transaction.findMany({
    where: { organizationId: orgId },
    include: {
      account: true,
      category: true,
      sale: true,
    },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return txs.map((t) => ({
    id: t.id,
    type: t.type,
    source: t.source,
    amount: Number(t.amount),
    accountName: t.account.name,
    categoryName: t.category?.name ?? (t.source === "SALE" ? "Sales Income" : t.source === "PURCHASE" ? "Inventory Purchase" : "General"),
    description: t.description || (t.sale ? `Invoice ${t.sale.invoiceNo}` : "-"),
    occurredAt: t.occurredAt.toISOString(),
    voidedAt: t.voidedAt ? t.voidedAt.toISOString() : null,
  }));
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
