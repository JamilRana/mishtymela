"use server";

import { prisma, withDbRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export interface SmartAlert {
  id: string;
  category: "STOCK" | "EXPIRY" | "DUE";
  urgency: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  titleBn: string;
  message: string;
  messageBn: string;
  actionUrl: string;
  actionLabel: string;
  actionLabelBn: string;
  createdAt: string;
}

export async function getSmartAlerts() {
  return withDbRetry(async () => {
    const session = await requireAuth();
    const orgId = session.organizationId;

    const [products, customersWithDue] = await Promise.all([
      // 1. Fetch active products with low or zero stock
      prisma.product.findMany({
        where: {
          organizationId: orgId,
          active: true,
          stockQty: { lte: 10 },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQty: true,
          unit: true,
          expiryDays: true,
          createdAt: true,
        },
        orderBy: { stockQty: "asc" },
        take: 20,
      }),

      // 2. Fetch customers with high dues or over credit limit
      prisma.contact.findMany({
        where: {
          organizationId: orgId,
          type: "CUSTOMER",
          active: true,
          currentDue: { gt: 0 },
        },
        select: {
          id: true,
          name: true,
          phone: true,
          currentDue: true,
          creditLimit: true,
        },
        orderBy: { currentDue: "desc" },
        take: 20,
      }),
    ]);

    const alerts: SmartAlert[] = [];

    // Evaluate Stock Alerts
    for (const p of products) {
      const stock = Number(p.stockQty);
      if (stock <= 0) {
        alerts.push({
          id: `stock-out-${p.id}`,
          category: "STOCK",
          urgency: "CRITICAL",
          title: "Out of Stock",
          titleBn: "স্টক শেষ!",
          message: `${p.name} (${p.sku}) is completely out of stock. Customers cannot purchase this item.`,
          messageBn: `${p.name} এর মজুদ শূন্য হয়ে গেছে। দ্রুত নতুন ক্রয় বা উৎপাদন প্রয়োজন।`,
          actionUrl: "/inventory",
          actionLabel: "Restock Now",
          actionLabelBn: "স্টক সমন্বয় করুন",
          createdAt: new Date().toISOString(),
        });
      } else {
        alerts.push({
          id: `stock-low-${p.id}`,
          category: "STOCK",
          urgency: "WARNING",
          title: "Low Stock Warning",
          titleBn: "মজুদ সতর্কতা",
          message: `${p.name} has only ${stock} ${p.unit} remaining in retail stock.`,
          messageBn: `${p.name} এর মজুদ মাত্র ${stock} ${p.unit} অবশিষ্ট রয়েছে।`,
          actionUrl: "/purchases",
          actionLabel: "New Purchase",
          actionLabelBn: "ক্রয় বিল তৈরি",
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Evaluate Customer Due Alerts
    for (const c of customersWithDue) {
      const due = Number(c.currentDue);
      const limit = c.creditLimit ? Number(c.creditLimit) : 0;

      if (limit > 0 && due >= limit) {
        alerts.push({
          id: `due-limit-${c.id}`,
          category: "DUE",
          urgency: "CRITICAL",
          title: "Credit Limit Exceeded",
          titleBn: "বাকি সীমা অতিক্রম!",
          message: `${c.name} has exceeded credit limit of ৳${limit.toLocaleString()} (Total due: ৳${due.toLocaleString()}).`,
          messageBn: `${c.name} এর বাকি সীমা (৳${limit.toLocaleString()}) অতিক্রম করেছে। বর্তমান বকেয়া: ৳${due.toLocaleString()}।`,
          actionUrl: "/dues",
          actionLabel: "Collect Due",
          actionLabelBn: "বাকি আদায় করুন",
          createdAt: new Date().toISOString(),
        });
      } else if (due >= 5000) {
        alerts.push({
          id: `due-high-${c.id}`,
          category: "DUE",
          urgency: "WARNING",
          title: "High Outstanding Due",
          titleBn: "বড় অঙ্কের বকেয়া বাকি",
          message: `${c.name} has ৳${due.toLocaleString()} outstanding due balance.`,
          messageBn: `${c.name} এর নিকট ৳${due.toLocaleString()} বকেয়া পাওনা রয়েছে।`,
          actionUrl: "/dues",
          actionLabel: "Collect Due",
          actionLabelBn: "বাকি আদায় করুন",
          createdAt: new Date().toISOString(),
        });
      }
    }

    const criticalCount = alerts.filter((a) => a.urgency === "CRITICAL").length;
    const warningCount = alerts.filter((a) => a.urgency === "WARNING").length;

    return {
      alerts,
      totalCount: alerts.length,
      criticalCount,
      warningCount,
    };
  });
}
