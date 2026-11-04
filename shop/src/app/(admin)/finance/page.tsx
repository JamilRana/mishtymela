import React from "react";
import { getAccounts, getTxCategories, getTransactions } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinanceManager } from "@/components/finance/FinanceManager";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams?: Promise<{
    period?: "today" | "yesterday" | "this_month" | "all" | "custom";
    startDate?: string;
    endDate?: string;
  }>;
}) {
  const params = searchParams ? await searchParams : {};
  const period = params.period || "today";
  const startDate = params.startDate || undefined;
  const endDate = params.endDate || undefined;

  const [accounts, categories, txData] = await Promise.all([
    getAccounts(),
    getTxCategories(),
    getTransactions({ period, startDate, endDate }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Cash Accounts"
        description="Monitor liquidity across Cash, bKash & Bank, record operational expenses, and audit cash flows"
      />
      <FinanceManager
        accounts={accounts}
        categories={categories}
        transactions={txData.transactions}
        closingBalanceSummary={txData.closingBalanceSummary}
        currentPeriod={txData.period}
        periodLabel={txData.label}
      />
    </div>
  );
}
