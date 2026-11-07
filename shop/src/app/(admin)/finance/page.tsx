import React, { Suspense } from "react";
import { getAccounts, getTxCategories, getTransactions } from "@/actions/finance";
import { getTreasuryOverviewAction } from "@/actions/treasury";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinanceManager } from "@/components/finance/FinanceManager";
import { TableSkeleton } from "@/components/shared/Skeleton";
import { withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    period?: "today" | "yesterday" | "this_month" | "all" | "custom";
    startDate?: string;
    endDate?: string;
    tab?: "daily" | "transactions" | "statement";
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const period = params.period || "today";
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;
  const initialTab = params.tab || "daily";

  const [accounts, categories, txData, treasuryOverview] = await withDbRetry(() =>
    Promise.all([
      getAccounts(),
      getTxCategories(),
      getTransactions({ period, startDate, endDate }),
      getTreasuryOverviewAction(),
    ])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance, Cash Drawers & Reconciliation"
        description="Daily cash open/close routine, multi-account liquidity, operating expenses, and verified audit statements"
      />
      <Suspense fallback={<TableSkeleton rows={8} cols={6} />}>
        <FinanceManager
          accounts={accounts}
          categories={categories}
          transactions={txData.transactions}
          closingBalanceSummary={txData.closingBalanceSummary}
          currentPeriod={txData.period}
          periodLabel={txData.label}
          treasuryOverview={treasuryOverview}
          initialTab={initialTab}
        />
      </Suspense>
    </div>
  );
}
