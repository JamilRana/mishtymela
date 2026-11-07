"use server";

import { prisma } from "@/lib/prisma";
import { createSale, recordSalePayment, voidSale } from "@/modules/sales/service";
import { revalidatePath } from "next/cache";
import { requireAuth, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";
import { SaleStatus } from "@prisma/client";

export interface GetSalesOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "all" | "paid" | "due" | "void";
  period?: "today" | "yesterday" | "this_month" | "all" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface PaginatedSalesResult {
  sales: Array<{
    id: string;
    invoiceNo: string;
    customerName: string;
    subtotal: number;
    discount: number;
    total: number;
    paid: number;
    due: number;
    status: SaleStatus;
    createdAt: string;
    voidedAt: string | null;
    items: Array<{
      id: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      lineTotal: number;
    }>;
    transactions: Array<{
      id: string;
      amount: number;
      accountName: string;
      occurredAt: string;
      voidedAt: string | null;
    }>;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  periodSummary: {
    totalRevenue: number;
    totalPaid: number;
    totalDue: number;
    period: string;
    label: string;
  };
}

export async function getSales(options?: GetSalesOptions): Promise<PaginatedSalesResult> {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, options?.pageSize ?? 25));
  const skip = (page - 1) * pageSize;

  const now = new Date();
  const dhakaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = dhakaFormatter.format(now);
  const [currentYear, currentMonth] = todayStr.split("-").map(Number);

  const where: any = { organizationId: orgId };

  // Default period is "today"
  const period = options?.period || "today";
  let label = "আজ";

  if (period === "today") {
    where.createdAt = {
      gte: new Date(`${todayStr}T00:00:00+06:00`),
      lte: new Date(`${todayStr}T23:59:59.999+06:00`),
    };
    label = `আজ (${todayStr})`;
  } else if (period === "yesterday") {
    const yDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yStr = dhakaFormatter.format(yDate);
    where.createdAt = {
      gte: new Date(`${yStr}T00:00:00+06:00`),
      lte: new Date(`${yStr}T23:59:59.999+06:00`),
    };
    label = `গতকাল (${yStr})`;
  } else if (period === "this_month") {
    const mStr = String(currentMonth).padStart(2, "0");
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    where.createdAt = {
      gte: new Date(`${currentYear}-${mStr}-01T00:00:00+06:00`),
      lte: new Date(`${currentYear}-${mStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999+06:00`),
    };
    label = `এই মাস`;
  } else if (period === "custom" && options?.startDate && options?.endDate) {
    where.createdAt = {
      gte: new Date(`${options.startDate}T00:00:00+06:00`),
      lte: new Date(`${options.endDate}T23:59:59.999+06:00`),
    };
    label = `${options.startDate} হতে ${options.endDate}`;
  } else if (period === "all") {
    label = "সব বিক্রয়";
  }

  if (options?.status && options.status !== "all") {
    if (options.status === "void") {
      where.status = "VOID";
    } else {
      where.status = "COMPLETED";
    }
  }

  if (options?.search?.trim()) {
    const q = options.search.trim();
    where.OR = [
      { invoiceNo: { contains: q, mode: "insensitive" } },
      { customerName: { contains: q, mode: "insensitive" } },
    ];
  }

  const [totalCount, sales, periodAgg] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: {
        items: true,
        transactions: {
          include: { account: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.sale.aggregate({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
        ...(where.createdAt ? { createdAt: where.createdAt } : {}),
      },
      _sum: {
        total: true,
        paid: true,
      },
    }),
  ]);

  const mappedSales = sales.map((s) => {
    const total = Number(s.total);
    const paid = Number(s.paid);
    const due = Math.max(0, total - paid);

    return {
      id: s.id,
      invoiceNo: s.invoiceNo,
      customerName: s.customerName || "Walk-in Customer",
      subtotal: Number(s.subtotal),
      discount: Number(s.discount),
      total,
      paid,
      due,
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      voidedAt: s.voidedAt ? s.voidedAt.toISOString() : null,
      items: s.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        unitCost: Number(i.unitCost),
        lineTotal: Number(i.lineTotal),
      })),
      transactions: s.transactions.map((t) => ({
        id: t.id,
        amount: Number(t.amount),
        accountName: t.account.name,
        occurredAt: t.occurredAt.toISOString(),
        voidedAt: t.voidedAt ? t.voidedAt.toISOString() : null,
      })),
    };
  });

  const totalRev = Number(periodAgg._sum.total || 0);
  const totalPd = Number(periodAgg._sum.paid || 0);

  return {
    sales: mappedSales,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    periodSummary: {
      totalRevenue: totalRev,
      totalPaid: totalPd,
      totalDue: Math.max(0, totalRev - totalPd),
      period,
      label,
    },
  };
}

export async function createSaleAction(data: {
  idempotencyKey: string;
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>;
  discount?: number;
  paid?: number;
  accountId?: string;
  customerName?: string;
}) {
  return handleAction("createSaleAction", async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const sale = await createSale({
      orgId,
      idempotencyKey: data.idempotencyKey,
      items: data.items,
      discount: data.discount,
      paid: data.paid,
      accountId: data.accountId,
      customerName: data.customerName,
      userId: session.userId,
    });

    try {
      revalidatePath("/sales");
      revalidatePath("/inventory");
      revalidatePath("/dashboard");
      revalidatePath("/pos");
    } catch {}

    return {
      sale: {
        id: sale.id,
        invoiceNo: sale.invoiceNo,
        total: Number(sale.total),
        paid: Number(sale.paid),
      },
    };
  }, "Failed to complete sale. Please check stock or inputs.");
}

export async function recordSalePaymentAction(data: {
  saleId: string;
  amount: number;
  accountId: string;
}) {
  return handleAction("recordSalePaymentAction", async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    await recordSalePayment({
      orgId,
      saleId: data.saleId,
      amount: data.amount,
      accountId: data.accountId,
    });

    try {
      revalidatePath("/sales");
      revalidatePath("/finance");
      revalidatePath("/dashboard");
    } catch {}

    return {};
  }, "Failed to record payment.");
}

export async function updateSaleAction(data: {
  saleId: string;
  customerName?: string;
  discount?: number;
  paid?: number;
}) {
  return handleAction("updateSaleAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    const existing = await prisma.sale.findUnique({
      where: { id: data.saleId, organizationId: orgId },
      include: { items: true, transactions: true },
    });

    if (!existing) {
      throw new Error("Sale invoice not found.");
    }

    if (existing.status === "VOID") {
      throw new Error("Cannot edit a voided sale.");
    }

    const subtotal = Number(existing.subtotal);
    const discount =
      data.discount !== undefined
        ? Math.max(0, Number(data.discount))
        : Number(existing.discount);
    const total = Math.max(0, subtotal - discount);
    const paid =
      data.paid !== undefined
        ? Math.max(0, Number(data.paid))
        : Number(existing.paid);
    const customerName =
      data.customerName !== undefined ? data.customerName.trim() : existing.customerName;

    const updated = await prisma.sale.update({
      where: { id: data.saleId, organizationId: orgId },
      data: {
        customerName: customerName || null,
        discount,
        total,
        paid,
      },
    });

    try {
      revalidatePath("/sales");
      revalidatePath("/dashboard");
      revalidatePath("/reports");
      revalidatePath("/pos");
    } catch {}

    return {
      sale: {
        id: updated.id,
        invoiceNo: updated.invoiceNo,
        customerName: updated.customerName || "Walk-in Customer",
        subtotal,
        discount,
        total,
        paid,
        due: Math.max(0, total - paid),
      },
    };
  }, "Failed to update sale invoice.");
}

export async function voidSaleAction(saleId: string) {
  return handleAction("voidSaleAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    await voidSale({
      orgId,
      saleId,
      userId: session.userId,
    });

    try {
      revalidatePath("/sales");
      revalidatePath("/inventory");
      revalidatePath("/finance");
      revalidatePath("/dashboard");
      revalidatePath("/pos");
    } catch {}

    return {};
  }, "Failed to void sale.");
}
