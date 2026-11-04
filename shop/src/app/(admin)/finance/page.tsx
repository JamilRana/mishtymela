import React from "react";
import { getAccounts, getTxCategories, getTransactions } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { FinanceManager } from "@/components/finance/FinanceManager";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const [accounts, categories, transactions] = await Promise.all([
    getAccounts(),
    getTxCategories(),
    getTransactions(),
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
        transactions={transactions}
      />
    </div>
  );
}
