import React from "react";
import { getDueOverview, getCustomerDues, getSupplierDues } from "@/actions/dues";
import { getAccounts } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { DueLedgerManager } from "@/components/dues/DueLedgerManager";
import { withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface DuesPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function DuesPage({ searchParams }: DuesPageProps) {
  const params = await searchParams;

  const [overview, customers, suppliers, accounts] = await Promise.all([
    withDbRetry(() => getDueOverview()),
    withDbRetry(() => getCustomerDues({ search: params.search })),
    withDbRetry(() => getSupplierDues({ search: params.search })),
    withDbRetry(() => getAccounts()),
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
        title="Due Ledgers & Credit Management"
        titleBn="বাকি খাতা ও ঋণ ব্যবস্থাপনা"
        description="Customer receivables, supplier payables, credit limits, and settlement receipts"
        descriptionBn="গ্রাহকদের বাকি আদায়, সরবরাহকারীদের বকেয়া পরিশোধ এবং খতিয়ান হিসাব"
      />

      <DueLedgerManager
        overview={overview}
        customers={customers}
        suppliers={suppliers}
        accounts={activeAccounts}
      />
    </div>
  );
}
