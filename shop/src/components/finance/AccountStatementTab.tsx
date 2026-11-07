"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Download, Calendar, ArrowUpRight, ArrowDownLeft, User, Filter, RefreshCw } from "lucide-react";
import { getAccountStatementAction } from "@/actions/treasury";
import { toBnDigits } from "@/lib/bangla-numbers";
import { useHydratedLanguage } from "@/stores/language";
import { cn } from "@/lib/utils";

interface AccountOption {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface StatementLine {
  id: string;
  occurredAt: string;
  type: "INCOME" | "EXPENSE";
  source: string;
  amount: number;
  description: string | null;
  transferId: string | null;
  saleId: string | null;
  runningBalance: number;
  userName: string | null;
  userRole: string | null;
}

interface AccountStatementTabProps {
  accounts: AccountOption[];
}

export const AccountStatementTab: React.FC<AccountStatementTabProps> = ({ accounts }) => {
  const { language } = useHydratedLanguage();
  const isBn = language === "bn";

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "this_month" | "all">("30d");
  const [statementData, setStatementData] = useState<{
    openingBalance: number;
    closingBalance: number;
    lines: StatementLine[];
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async (accId: string, range: string) => {
    if (!accId) return;
    setLoading(true);
    setError(null);

    let from: Date | undefined;
    const to = new Date();

    if (range === "7d") {
      from = new Date(Date.now() - 7 * 86400000);
    } else if (range === "30d") {
      from = new Date(Date.now() - 30 * 86400000);
    } else if (range === "this_month") {
      const now = new Date();
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      from = new Date(2020, 0, 1); // all time
    }

    try {
      const res = await getAccountStatementAction(accId, from?.toISOString(), to.toISOString());
      setStatementData({
        openingBalance: res.openingBalance,
        closingBalance: res.closingBalance,
        lines: res.lines,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load statement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement(selectedAccountId, dateRange);
  }, [selectedAccountId, dateRange]);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  // CSV Export
  const exportCsv = () => {
    if (!statementData || !selectedAccount) return;

    const headers = ["Date & Time (Dhaka)", "Description", "Source", "Type", "Amount (BDT)", "Running Balance (BDT)", "Created By", "User Role"];
    const rows = statementData.lines.map((l) => [
      new Date(l.occurredAt).toLocaleString("en-GB", { timeZone: "Asia/Dhaka" }),
      `"${(l.description || "-").replace(/"/g, '""')}"`,
      l.source,
      l.type,
      l.type === "INCOME" ? `+${l.amount.toFixed(2)}` : `-${l.amount.toFixed(2)}`,
      l.runningBalance.toFixed(2),
      `"${l.userName || "System"}"`,
      l.userRole || "-",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `statement_${selectedAccount.name}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Account Selector and Filters */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">{isBn ? "অ্যাকাউন্ট:" : "Account:"}</span>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              {(
                [
                  { id: "7d", label: isBn ? "৭ দিন" : "7 Days" },
                  { id: "30d", label: isBn ? "৩০ দিন" : "30 Days" },
                  { id: "this_month", label: isBn ? "এই মাস" : "This Month" },
                  { id: "all", label: isBn ? "সব সময়" : "All Time" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateRange(p.id)}
                  className={cn(
                    "px-2.5 py-1 rounded transition-all cursor-pointer",
                    dateRange === p.id
                      ? "bg-white text-rose-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || !statementData?.lines.length}
              className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isBn ? "CSV রপ্তানি" : "Export CSV"}</span>
            </button>
          </div>
        </div>

        {/* Statement Summary KPI Cards */}
        {statementData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] text-slate-600 block uppercase font-medium">
                {isBn ? "প্রারম্ভিক ব্যালেন্স" : "Opening Balance"}
              </span>
              <span className="text-sm font-black text-slate-900 tabular-nums">
                ৳{isBn ? toBnDigits(statementData.openingBalance.toFixed(2)) : statementData.openingBalance.toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
              <span className="text-[11px] text-emerald-700 block uppercase font-medium">
                {isBn ? "মোট জমা (Inflows)" : "Total Inflows"}
              </span>
              <span className="text-sm font-black text-emerald-800 tabular-nums">
                +৳
                {isBn
                  ? toBnDigits(
                      statementData.lines
                        .filter((l) => l.type === "INCOME")
                        .reduce((sum, l) => sum + l.amount, 0)
                        .toFixed(2)
                    )
                  : statementData.lines
                      .filter((l) => l.type === "INCOME")
                      .reduce((sum, l) => sum + l.amount, 0)
                      .toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-100">
              <span className="text-[11px] text-rose-700 block uppercase font-medium">
                {isBn ? "মোট খরচ (Outflows)" : "Total Outflows"}
              </span>
              <span className="text-sm font-black text-rose-800 tabular-nums">
                -৳
                {isBn
                  ? toBnDigits(
                      statementData.lines
                        .filter((l) => l.type === "EXPENSE")
                        .reduce((sum, l) => sum + l.amount, 0)
                        .toFixed(2)
                    )
                  : statementData.lines
                      .filter((l) => l.type === "EXPENSE")
                      .reduce((sum, l) => sum + l.amount, 0)
                      .toFixed(2)}
              </span>
            </div>

            <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
              <span className="text-[11px] text-indigo-700 block uppercase font-medium">
                {isBn ? "সমাপনী ব্যালেন্স" : "Closing Balance"}
              </span>
              <span className="text-sm font-black text-indigo-900 tabular-nums">
                ৳{isBn ? toBnDigits(statementData.closingBalance.toFixed(2)) : statementData.closingBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Statement Table with User Column */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
            <span>{isBn ? "স্টেটমেন্ট লোড হচ্ছে..." : "Loading account statement..."}</span>
          </div>
        ) : statementData?.lines.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-600">
            {isBn ? "এই সময়ের মধ্যে কোনো লেনদেন পাওয়া যায়নি।" : "No transactions found in this period."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">{isBn ? "তারিখ ও সময়" : "Date & Time"}</th>
                  <th className="p-3">{isBn ? "বিবরণ" : "Description"}</th>
                  <th className="p-3">{isBn ? "উৎস" : "Source"}</th>
                  <th className="p-3 text-right">{isBn ? "টাকার পরিমাণ" : "Amount"}</th>
                  <th className="p-3 text-right">{isBn ? "রানিং ব্যালেন্স" : "Running Balance"}</th>
                  <th className="p-3">{isBn ? "লেনদেনকারী (User)" : "Created By"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statementData?.lines.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-medium text-slate-600 whitespace-nowrap">
                      {new Date(l.occurredAt).toLocaleString("en-GB", {
                        timeZone: "Asia/Dhaka",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">
                      {l.description || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                        {l.source}
                      </span>
                    </td>
                    <td
                      className={`p-3 text-right tabular-nums font-bold whitespace-nowrap ${
                        l.type === "INCOME" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {l.type === "INCOME" ? "+" : "-"}৳
                      {isBn ? toBnDigits(l.amount.toFixed(2)) : l.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right tabular-nums font-black text-slate-900 whitespace-nowrap">
                      ৳{isBn ? toBnDigits(l.runningBalance.toFixed(2)) : l.runningBalance.toFixed(2)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {l.userName ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                            {l.userName[0]?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">{l.userName}</span>
                            <span className="text-[11px] text-slate-600 uppercase font-semibold">{l.userRole}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
