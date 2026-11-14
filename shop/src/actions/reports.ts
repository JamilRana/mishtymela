"use server";

import { prisma, withDbRetry } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export interface DateRangeReportFilter {
  period?: "today" | "yesterday" | "this_month" | "last_month" | "custom" | "month_picker" | "date_picker";
  startDate?: string;    // YYYY-MM-DD
  endDate?: string;      // YYYY-MM-DD
  selectedDate?: string; // YYYY-MM-DD for single date selection
  month?: number;        // 1-12
  year?: number;         // e.g. 2026
}

export async function getDateRangeReportAction(filter: DateRangeReportFilter = {}) {
  const session = await requireRole(["ADMIN", "OWNER"]);
  const orgId = session.organizationId;

  const now = new Date();
  
  // Format current Dhaka time (Asia/Dhaka UTC+6)
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
  let label = "Today";

  // DEFAULT IS TODAY as requested
  const period = filter.period || "today";

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
  } else if (period === "date_picker" && filter.selectedDate) {
    const dStr = filter.selectedDate;
    fromDate = new Date(`${dStr}T00:00:00+06:00`);
    toDate = new Date(`${dStr}T23:59:59.999+06:00`);
    label = `তারিখ: ${dStr}`;
  } else if (period === "last_month") {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastDayOfPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const mStr = String(prevMonth).padStart(2, "0");
    fromDate = new Date(`${prevYear}-${mStr}-01T00:00:00+06:00`);
    toDate = new Date(`${prevYear}-${mStr}-${String(lastDayOfPrevMonth).padStart(2, "0")}T23:59:59.999+06:00`);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label = `গত মাস (${monthNames[prevMonth - 1]} ${prevYear})`;
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
    label = `${filter.startDate} হতে ${filter.endDate}`;
  } else if (period === "this_month") {
    const mStr = String(currentMonth).padStart(2, "0");
    const lastDay = new Date(currentYear, currentMonth, 0).getDate();
    fromDate = new Date(`${currentYear}-${mStr}-01T00:00:00+06:00`);
    toDate = new Date(`${currentYear}-${mStr}-${String(lastDay).padStart(2, "0")}T23:59:59.999+06:00`);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    label = `এই মাস (${monthNames[currentMonth - 1]} ${currentYear})`;
  } else {
    // Default fallback: Today
    fromDate = new Date(`${todayStr}T00:00:00+06:00`);
    toDate = new Date(`${todayStr}T23:59:59.999+06:00`);
    label = `আজ (${todayStr})`;
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
        include: { product: { include: { category: true } } },
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

  const productStats = new Map<
    string,
    {
      name: string;
      sku: string;
      category: string;
      unit: string;
      qty: number;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
      salesShare: number;
    }
  >();
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
        category: item.product?.category?.name || "General",
        unit: item.product?.unit || "pcs",
        qty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0,
        salesShare: 0,
      };
      curP.qty += q;
      curP.revenue += rev;
      curP.cost += itemCost;
      curP.profit += (rev - itemCost);
      productStats.set(pKey, curP);
    }
    salesByDayMap.set(dayKey, dayStat);
  }

  // Calculate margin and share for top products
  const topProductsList = Array.from(productStats.values()).map((p) => {
    p.margin = p.revenue > 0 ? Number(((p.profit / p.revenue) * 100).toFixed(1)) : 0;
    p.salesShare = netRevenue > 0 ? Number(((p.revenue / netRevenue) * 100).toFixed(1)) : 0;
    return p;
  }).sort((a, b) => b.revenue - a.revenue);

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
    const catName = e.category?.name || "সাধারণ খরচ";
    expenseByCategoryMap.set(catName, (expenseByCategoryMap.get(catName) || 0) + amt);
  }

  // Manual Income transactions (non-sales, e.g. scrap sales, catering advance, etc.)
  const manualIncomes = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      type: "INCOME",
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
  });
  const totalManualIncome = manualIncomes.reduce((s, t) => s + Number(t.amount), 0);

  // 3. Raw Material & Box purchases
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
  const netProfit = grossProfit - totalExpenses + totalManualIncome;
  const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  const expensesByCategoryList = Array.from(expenseByCategoryMap.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const dailyTrend = Array.from(salesByDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // 4. Closing Balance & Cash Register (Date / Month-wise)
  const accounts = await prisma.account.findMany({
    where: { organizationId: orgId, active: true },
    orderBy: { name: "asc" },
  });

  const allTxs = await prisma.transaction.findMany({
    where: {
      organizationId: orgId,
      voidedAt: null,
      occurredAt: { lte: toDate },
    },
    select: {
      accountId: true,
      type: true,
      amount: true,
      occurredAt: true,
    },
  });

  const accountsClosing = accounts.map((acc) => {
    let opening = 0;
    let inflows = 0;
    let outflows = 0;

    for (const t of allTxs) {
      if (t.accountId !== acc.id) continue;
      const amt = Number(t.amount);
      const isBefore = t.occurredAt < fromDate;
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

  // 5. Month-wise reporting for current year (All 12 Months)
  const yearStart = new Date(`${currentYear}-01-01T00:00:00+06:00`);
  const yearEnd = new Date(`${currentYear}-12-31T23:59:59.999+06:00`);

  const [yearSales, yearExpenses] = await Promise.all([
    prisma.sale.findMany({
      where: {
        organizationId: orgId,
        status: "COMPLETED",
        createdAt: { gte: yearStart, lte: yearEnd },
      },
      include: {
        items: true,
      },
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        type: "EXPENSE",
        source: "MANUAL",
        voidedAt: null,
        occurredAt: { gte: yearStart, lte: yearEnd },
      },
    }),
  ]);

  const monthNamesBn = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const monthlyReport = Array.from({ length: 12 }, (_, i) => {
    const mNum = i + 1;
    const mStr = String(mNum).padStart(2, "0");
    return {
      monthNumber: mNum,
      monthKey: `${currentYear}-${mStr}`,
      monthLabel: `${monthNamesEn[i]} ${currentYear}`,
      monthLabelBn: `${monthNamesBn[i]} ${currentYear}`,
      revenue: 0,
      cogs: 0,
      expenses: 0,
      orders: 0,
      profit: 0,
      margin: 0,
    };
  });

  for (const s of yearSales) {
    const sDate = dhakaFormatter.format(s.createdAt);
    const mIndex = Number(sDate.split("-")[1]) - 1;
    if (mIndex >= 0 && mIndex < 12) {
      const sTotal = Number(s.total);
      monthlyReport[mIndex].revenue += sTotal;
      monthlyReport[mIndex].orders += 1;
      for (const it of s.items) {
        monthlyReport[mIndex].cogs += Number(it.unitCost) * Number(it.quantity);
      }
    }
  }

  for (const e of yearExpenses) {
    const eDate = dhakaFormatter.format(e.occurredAt);
    const mIndex = Number(eDate.split("-")[1]) - 1;
    if (mIndex >= 0 && mIndex < 12) {
      monthlyReport[mIndex].expenses += Number(e.amount);
    }
  }

  for (const m of monthlyReport) {
    m.profit = m.revenue - m.cogs - m.expenses;
    m.margin = m.revenue > 0 ? Number(((m.profit / m.revenue) * 100).toFixed(1)) : 0;
  }

  // 6. Income vs Expense Comparison Summary
  const incomeVsExpense = {
    salesRevenue: netRevenue,
    manualIncome: totalManualIncome,
    totalIncome: netRevenue + totalManualIncome,
    cogs: cogs,
    operatingExpenses: totalExpenses,
    totalExpense: cogs + totalExpenses,
    netProfit: netProfit,
    expenseRatio: (netRevenue + totalManualIncome) > 0 
      ? Number((((cogs + totalExpenses) / (netRevenue + totalManualIncome)) * 100).toFixed(1))
      : 0,
    profitMargin: Number(netMargin.toFixed(1)),
  };

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
      manualIncome: totalManualIncome,
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
    closingBalanceSummary,
    monthlyReport,
    incomeVsExpense,
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

export async function getStaffPerformanceReportAction(options?: {
  startDate?: string;
  endDate?: string;
}) {
  return withDbRetry(async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const where: any = {
      organizationId: orgId,
      status: "COMPLETED",
    };

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate + "T23:59:59.999Z");
    }

    const [sales, users] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          id: true,
          total: true,
          paid: true,
          createdById: true,
          createdAt: true,
        },
      }),
      prisma.user.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, role: true, email: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));

    const staffStats = new Map<
      string,
      {
        userId: string;
        name: string;
        role: string;
        totalSales: number;
        invoiceCount: number;
        avgInvoiceValue: number;
      }
    >();

    for (const s of sales) {
      const uId = s.createdById || "unknown";
      const u = userMap.get(uId);
      const name = u?.name || "Counter / System";
      const role = u?.role || "STAFF";

      const cur = staffStats.get(uId) || {
        userId: uId,
        name,
        role,
        totalSales: 0,
        invoiceCount: 0,
        avgInvoiceValue: 0,
      };

      cur.totalSales += Number(s.total);
      cur.invoiceCount++;
      staffStats.set(uId, cur);
    }

    const staffList = Array.from(staffStats.values())
      .map((st) => ({
        ...st,
        avgInvoiceValue: st.invoiceCount > 0 ? Number((st.totalSales / st.invoiceCount).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    return {
      staffList,
      totalRevenue: staffList.reduce((acc, cur) => acc + cur.totalSales, 0),
      totalInvoices: staffList.reduce((acc, cur) => acc + cur.invoiceCount, 0),
    };
  });
}

export async function getStockMovementLedgerAction(options?: {
  page?: number;
  pageSize?: number;
  type?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return withDbRetry(async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const page = Math.max(1, options?.page ?? 1);
    const pageSize = Math.max(1, Math.min(100, options?.pageSize ?? 25));
    const skip = (page - 1) * pageSize;

    const where: any = { organizationId: orgId };

    if (options?.type && options.type !== "ALL") {
      where.type = options.type;
    }

    if (options?.productId) {
      where.productId = options.productId;
    }

    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate + "T23:59:59.999Z");
    }

    const [totalCount, movements] = await Promise.all([
      prisma.stockMovement.count({ where }),
      prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, sku: true, unit: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      movements: movements.map((m) => ({
        id: m.id,
        productId: m.productId,
        productName: m.product?.name ?? "Unknown Product",
        sku: m.product?.sku ?? "",
        unit: m.product?.unit ?? "pcs",
        type: m.type,
        quantityDelta: Number(m.quantityDelta),
        unitCost: Number(m.unitCost),
        balanceAfter: Number(m.balanceAfter),
        note: m.note,
        createdAt: m.createdAt.toISOString(),
      })),
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  });
}

export async function getSupplierPurchaseRegisterAction(options?: {
  startDate?: string;
  endDate?: string;
}) {
  return withDbRetry(async () => {
    const session = await requireRole(["ADMIN", "OWNER", "MANAGER"]);
    const orgId = session.organizationId;

    const where: any = { organizationId: orgId };
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = new Date(options.startDate);
      if (options.endDate) where.createdAt.lte = new Date(options.endDate + "T23:59:59.999Z");
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const supplierMap = new Map<
      string,
      {
        supplierId: string;
        supplierName: string;
        supplierPhone: string;
        totalPurchases: number;
        paidAmount: number;
        dueAmount: number;
        billsCount: number;
      }
    >();

    let totalVolume = 0;
    let totalPaid = 0;
    let totalDue = 0;

    for (const p of purchases) {
      const sId = p.contactId;
      const sName = p.supplier.name;
      const sPhone = p.supplier.phone;

      const total = Number(p.total);
      const paid = Number(p.paid);
      const due = Number(p.due);

      totalVolume += total;
      totalPaid += paid;
      totalDue += due;

      const cur = supplierMap.get(sId) || {
        supplierId: sId,
        supplierName: sName,
        supplierPhone: sPhone,
        totalPurchases: 0,
        paidAmount: 0,
        dueAmount: 0,
        billsCount: 0,
      };

      cur.totalPurchases += total;
      cur.paidAmount += paid;
      cur.dueAmount += due;
      cur.billsCount++;
      supplierMap.set(sId, cur);
    }

    return {
      suppliers: Array.from(supplierMap.values()).sort((a, b) => b.totalPurchases - a.totalPurchases),
      totalVolume,
      totalPaid,
      totalDue,
      billsCount: purchases.length,
    };
  });
}
