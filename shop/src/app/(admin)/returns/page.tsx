import React from "react";
import { getReturnsOverview } from "@/actions/returns";
import { getAccounts } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { ReturnsManager } from "@/components/returns/ReturnsManager";
import { prisma, withDbRetry } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ReturnsPageProps {
  searchParams: Promise<{
    tab?: "SALES" | "PURCHASE";
    search?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function ReturnsPage({ searchParams }: ReturnsPageProps) {
  const params = await searchParams;

  const [returnsData, accounts, recentPurchases] = await Promise.all([
    withDbRetry(() =>
      getReturnsOverview({
        type: params.tab,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
      })
    ),
    withDbRetry(() => getAccounts()),
    withDbRetry(async () => {
      const session = await requireAuth();
      const purchases = await prisma.purchase.findMany({
        where: { organizationId: session.organizationId },
        include: { supplier: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return purchases.map((p) => ({
        id: p.id,
        billNo: p.billNo,
        supplierName: p.supplier.name,
        total: Number(p.total),
        due: Number(p.due),
      }));
    }),
  ]);

  const activeAccounts = accounts
    .filter((a) => a.type !== "OWNER" && a.type !== "SAFE")
    .map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
    }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns & Debit Notes Management"
        titleBn="পণ্য ফেরত ও ডেবিট নোট (Returns)"
        description="Customer sales returns, restocking, cash refunds, and supplier purchase debit notes"
        descriptionBn="গ্রাহকদের বিক্রয় ফেরত গ্রহণ, ইনভেন্টরি স্টক পুনরুদ্ধার এবং সাপ্লাইয়ার ক্রয় ডেবিট নোট"
      />

      <ReturnsManager
        salesReturns={returnsData.salesReturns}
        purchaseReturns={returnsData.purchaseReturns}
        metrics={returnsData.metrics}
        accounts={activeAccounts}
        recentPurchases={recentPurchases}
      />
    </div>
  );
}
