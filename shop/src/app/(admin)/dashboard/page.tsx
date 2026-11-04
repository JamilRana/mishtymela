import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Receipt,
  Boxes,
  AlertTriangle,
  Store,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { MoneyText } from "@/components/shared/MoneyText";
import { DateTimeText } from "@/components/shared/DateTimeText";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { SalesTrendChart } from "@/components/dashboard/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { kpis, lowStock, salesByDay, topProducts, expensesByCategory, recentTransactions } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Store Dashboard"
        description="Real-time retail metrics, profit analytics, and stock health"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs transition-colors"
            >
              <Store className="w-4 h-4" />
              Open POS Terminal
            </Link>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          label="Total Revenue"
          value={<MoneyText amount={kpis.revenue} />}
          subtitle={`${kpis.orders} orders completed`}
          icon={<DollarSign className="w-4 h-4" />}
        />
        <KpiCard
          label="Gross Profit"
          value={<MoneyText amount={kpis.grossProfit} />}
          subtitle={`COGS: ৳${kpis.cogs.toLocaleString()}`}
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KpiCard
          label="Operating Expenses"
          value={<MoneyText amount={kpis.operatingExpenses} />}
          subtitle="Manual expenses"
          icon={<Receipt className="w-4 h-4" />}
        />
        <KpiCard
          label="Operating Profit"
          value={<MoneyText amount={kpis.operatingProfit} />}
          subtitle="Net after overhead"
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <KpiCard
          label="Stock Valuation"
          value={<MoneyText amount={kpis.stockValue} />}
          subtitle="Current inventory value"
          icon={<Boxes className="w-4 h-4" />}
        />
        <KpiCard
          label="Receivables (Due)"
          value={<MoneyText amount={kpis.receivables} negative={kpis.receivables > 0} />}
          subtitle="Outstanding credit"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
      </div>

      {/* Sales Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Sales Trend (Last 30 Days)</h2>
            <p className="text-xs text-slate-500">Dhaka timezone daily revenue</p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
            ৳ BDT
          </span>
        </div>
        <SalesTrendChart data={salesByDay} />
      </div>

      {/* Two-Column Analytics: Top Products & Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-1">Top Selling Products</h2>
            <p className="text-xs text-slate-500 mb-4">Ranked by revenue contribution</p>
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No sales recorded yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-semibold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <span className="text-slate-500">{p.qty} sold</span>
                      <MoneyText amount={p.revenue} className="text-xs font-semibold" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 text-right">
            <Link href="/products" className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              View all products <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Operating Expenses Breakdown */}
        <div className="bg-white border border-slate-200 rounded-md p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-slate-900">Expenses by Category</h2>
              <Link href="/finance" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                Add Expense
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">Manual overhead and operational costs</p>
            {expensesByCategory.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No manual expenses logged</p>
            ) : (
              <div className="space-y-3">
                {expensesByCategory.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                    <span className="font-medium text-slate-800">{e.category}</span>
                    <MoneyText amount={e.amount} className="text-xs font-semibold" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-slate-100 text-right">
            <Link href="/finance" className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              View finance ledger <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions & Low-Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Last 10 financial movements</p>
            </div>
            <Link href="/finance" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Account</th>
                  <th className="pb-2 font-medium">Category / Source</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No transactions recorded
                    </td>
                  </tr>
                ) : (
                  recentTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5">
                        <DateTimeText date={t.occurredAt} />
                      </td>
                      <td className="py-2.5 font-medium text-slate-800">{t.accountName}</td>
                      <td className="py-2.5">
                        <span className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {t.categoryName}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 truncate max-w-xs">{t.description}</td>
                      <td className="py-2.5 text-right font-medium">
                        <span className={t.type === "INCOME" ? "text-emerald-600" : "text-slate-800"}>
                          {t.type === "INCOME" ? "+" : "-"}
                          <MoneyText amount={t.amount} className="text-inherit" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (1 col) */}
        <div className="bg-white border border-slate-200 rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Low Stock Alerts
              </h2>
              <p className="text-xs text-slate-500">Products at or below reorder level</p>
            </div>
            <Link href="/inventory" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              Manage
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              All product stock levels healthy
            </div>
          ) : (
            <div className="space-y-3">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-medium text-slate-900 block">{p.name}</span>
                    <span className="text-[11px] text-slate-400">SKU: {p.sku}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-amber-600 font-semibold block">{p.stockQty} left</span>
                      <span className="text-[10px] text-slate-400">Reorder at {p.reorderLevel}</span>
                    </div>
                    <Link
                      href={`/inventory?restock=${p.id}`}
                      className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="Restock this product"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
