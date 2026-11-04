import React from "react";
import { getDateRangeReportAction } from "@/actions/reports";
import { getOrganizationAction } from "@/actions/organization";
import { PageHeader } from "@/components/shared/PageHeader";
import { DateMonthReportsView } from "@/components/reports/DateMonthReportsView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [initialData, org] = await Promise.all([
    getDateRangeReportAction({ period: "today" }),
    getOrganizationAction(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sweet Shop Date & Month Reports"
        description="Daily & monthly profit & loss accounting, sweet item profitability, raw material & box purchases"
      />
      <DateMonthReportsView initialData={initialData} shopProfile={org} />
    </div>
  );
}
