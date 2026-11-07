import React from "react";
import { getTodayOverviewAction } from "@/actions/dashboard";
import { TodayView } from "@/components/dashboard/TodayView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getTodayOverviewAction();
  return <TodayView data={data} />;
}
