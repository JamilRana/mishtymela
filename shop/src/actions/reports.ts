"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export interface DateRangeReportFilter {
  period?: "today" | "yesterday" | "this_month" | "last_month" | "custom" | "month_picker";
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  month?: number;     // 1-12
  year?: number;      // e.g. 2026
}

export async function getDateRangeReportAction(filter: DateRangeReportFilter = {}) {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  // Compute start and end timestamps in UTC corresponding to Dhaka local days
  const now = new Date();
  
  // Format current Dhaka time
  const dhakaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = dhakaFormatter.format(now); // YYYY-MM-DD
  const [currentYear, currentMonth, currentDay] = todayStr.split("-").map(Number);

  let fromDate: Date;
  let toDate: Date;
  let label = "This Month";

  const period = filter.period || "this_month";

  if (period === "today") {
    // Dhaka start of day: today 00:00:00 -> 23:59:59.999 (+06:00)
    fromDate = new Date(`${todayStr}T00:00:00+06:00`);
    toDate = new Date(`${todayStr}T23:59:59.999+06:00`);
    label = `Today (${todayStr})`;
  } else if (period === "yesterday") {
    const yDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yStr = dhakaFormatter.format(yDate);
    fromDate = new Date(`${yStr}T00:00:00+06:00`);
    toDate = new Date(`${yStr}T23:59:59.999+06:00`);
    label = `Yesterday (${yStr})`;
  } else if (period === "last_month") {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const mStr = String(prevMonth).padStart(2, "0");
    fromDate = new Date(`${prevYear}-${mStr}-01T00:00:00+06:00`);
    toDate = new Date(`${prevYear}-${mStr}-${String(lastDayOfPrevMonth).padStart(2, "0")}T23:59:59.999+06:00`);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label = `Last Month (${monthNames[prevMonth - 1]} ${prevYear})`;
  } else if (period === "month_picker" && filter.month && filter.year) {
    const selMonth = filter.month;
    const selYear = filter.year;
    const lastDay = new Date(selYear, selMonth, 0).getDate();
    const mStr = String(selMonth).padStart(2, "0");
    fromDate = new Date(`${selYear}-${mStr}-01T00:00:00+06:00`);
    toDate = new Date(`${selYear}-${mStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999+06:00`);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label = `${monthNames[selMonth - 1]} ${selYear}`;
  } else if (period === "custom" && filter.startDate && filter.endDate) {
    fromDate = new Date(`${filter.startDate}T00:00:00+06:00`);
    toDate = new Date(`${filter.endDate}T23:59:59.999+06:00`);
    label = `${filter.startDate} to ${filter.endDate}`;
  } else {
    // Default: This Month
    const mStr = String(currentMonth).padStart(2, "0");
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    fromDate = new Date(`${currentYear}-${mStr}-01T00:00:00+06:00`);
    toDate = new Date(`${currentYear}-${mStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999+06:00`);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label = `This Month (${monthNames[currentMonth - 1]} ${currentYear})`;
  }

  // 1. Fetch Sales within this date range
  const sales = await prisma.sale.findMany({
    where: {
      organizationId: orgId,
      status: "COMPLETED",
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calculate Sales KPIs
  let grossRevenue = 0;
  let totalDiscounts = 0;
  let netRevenue = 0;
  let totalPaid = 0;
  let totalDue = 0;
  let cogs = 0;
  const productStats = new Map<string, { name: string; sku: string; unit: string; qty: number; revenue: number; cost: number; profit: number }>();
  const salesByDayMap = new Map<string, { date: string; revenue: number; orders: number; cogs: number }>();

  for (const s of sales) {
    const sTotal = Number(s.total);
    const sSub = Number(s.subtotal);
    const sDisc = Number(s.discount);
    const sPaid = Number(s.paid);
    const sDue = Math.max(0, sTotal - sPaid);

    grossRevenue += sSub;
    totalDiscounts += sDisc;
    netRevenue += sTotal;
    totalPaid += sPaid;
    totalDue += sDue;

    // Daily breakdown
    const dayKey = dhakaFormatter.format(s.createdAt);
    const dayStat = salesByDayMap.get(dayKey) || { date: dayKey, revenue: 0, orders: 0, cogs: 0 };
    dayStat.revenue += sTotal;
    dayStat.orders += 1;

    for (const item of s.items) {
      const q = Number(item.quantity);
      const rev = Number(item.lineTotal);
      const itemCost = Number(item.unitCost) * q;
      cogs += itemCost;
      dayStat.cogs += itemCost;

      const pKey = item.productId;
      const curP = productStats.get(pKey) || {
        name: item.productName,
        sku: item.product?.sku || "",
        unit: item.product?.unit || "pcs",
        qty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
      curP.qty += q;
      curP.revenue += rev;
      curP.cost += itemCost;
      curP.profit += (rev - itemCost);
      productStats.set(pKey, curP);
    }
    salesByDayMap.set(dayKey, dayStat);
  }

  // 2. Fetch Operating Expenses within this date range
  const expenses = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type: "EXPENSE",
      source: "MANUAL",
      voidedAt: null,
      occurredAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      category: true,
      account: true,
    },
    orderBy: { occurredAt: "desc" },
  });

  let totalExpenses = 0;
  const expenseByCategoryMap = new Map<string, number>();

  for (const e of expenses) {
    const amt = Number(e.amount);
    totalExpenses += amt;
    const catName = e.category?.name || "General Operating";
    expenseByCategoryMap.set(catName, (expenseByCategoryMap.get(catName) || 0) + amt);
  }

  // 3. Raw Material & Sweet Box purchases within this range (both stock movements and transactions)
  const stockPurchases = await prisma.stockMovement.findMany({
    where: {
      organizationId: orgId,
      type: "PURCHASE",
      NOT: { refType: "production" },
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      product: { include: { category: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const materialAndBoxPurchases = stockPurchases.map((m) => {
    const qty = Number(m.quantityDelta);
    const unitCost = Number(m.unitCost);
    const totalCost = qty * unitCost;
    return {
      id: m.id,
      productName: m.product.name,
      categoryName: m.product.category?.name || "Inventory",
      unit: m.product.unit,
      quantity: qty,
      unitCost,
      totalCost,
      note: m.note || "-",
      createdAt: m.createdAt.toISOString(),
    };
  });

  const grossProfit = netRevenue - cogs;
  const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
  const netProfit = grossProfit - totalExpenses;
  const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  const topProductsList = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue);

  const expensesByCategoryList = Array.from(expenseByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const dailyTrend = Array.from(salesByDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    label,
    period,
    startDateStr: dhakaFormatter.format(fromDate),
    endDateStr: dhakaFormatter.format(toDate),
    summary: {
      grossRevenue,
      totalDiscounts,
      netRevenue,
      cogs,
      grossProfit,
      grossMargin: Number(grossMargin.toFixed(1)),
      totalExpenses,
      netProfit,
      netMargin: Number(netMargin.toFixed(1)),
      totalPaid,
      totalDue,
      ordersCount: sales.length,
      averageOrderValue: sales.length > 0 ? Number((netRevenue / sales.length).toFixed(2)) : 0,
    },
    topProducts: topProductsList,
    expensesByCategory: expensesByCategoryList,
    materialAndBoxPurchases,
    dailyTrend,
    expensesList: expenses.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      category: e.category?.name || "General",
      account: e.account.name,
      description: e.description || "-",
      occurredAt: e.occurredAt.toISOString(),
    })),
  };
}
