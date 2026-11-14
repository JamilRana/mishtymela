import React from "react";
import { getPayrollOverview } from "@/actions/payroll";
import { getAccounts } from "@/actions/finance";
import { PageHeader } from "@/components/shared/PageHeader";
import { PayrollManager } from "@/components/payroll/PayrollManager";
import { withDbRetry } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface PayrollPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const params = await searchParams;

  const now = new Date();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();

  const [overview, accounts] = await Promise.all([
    withDbRetry(() =>
      getPayrollOverview({
        month,
        year,
        search: params.search,
        status: params.status,
      })
    ),
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
        title="Employee Payroll & Salary Management"
        titleBn="কর্মচারী বেতন ও পেরোল ব্যবস্থাপনা"
        description="Monthly employee salary sheets, bonuses, deduction adjustments, disbursements, and payslips"
        descriptionBn="মাসিক বেতন শিট তৈরি, বোনাস ও কর্তন সমন্বয়, এক ক্লিকে বেতন পরিশোধ ও ভাউচার প্রিন্ট"
      />

      <PayrollManager
        month={overview.month}
        year={overview.year}
        records={overview.records}
        metrics={overview.metrics}
        accounts={activeAccounts}
      />
    </div>
  );
}
