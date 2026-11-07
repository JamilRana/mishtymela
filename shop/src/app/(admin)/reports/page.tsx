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
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        titleBn="রিপোর্ট"
        description="Sales, profit and expenses for a day, a month or any date range"
        descriptionBn="যেকোনো দিন, মাস বা তারিখ রেঞ্জের বিক্রি, লাভ ও খরচ"
      />
      <DateMonthReportsView initialData={initialData} shopProfile={org} />
    </div>
  );
}
