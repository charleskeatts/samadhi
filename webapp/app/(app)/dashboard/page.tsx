import { requireAccountId } from "@/lib/session";
import {
  getAccountRevenueMetrics,
  getTopCompaniesByMrr,
  currentMonthStart,
  fmtMonth,
} from "@/lib/revenue";
import { prisma } from "@/lib/db";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Dashboard — Clairio CRM" };

export default async function DashboardPage() {
  const accountId = await requireAccountId();
  const month = currentMonthStart();

  const [metrics, topCompanies, taskCount, openDeals] = await Promise.all([
    getAccountRevenueMetrics(accountId, month),
    getTopCompaniesByMrr(accountId, month, 5),
    prisma.task.count({ where: { accountId, status: "Open" } }),
    prisma.deal.count({
      where: { accountId, stage: { notIn: ["Won", "Lost"] } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">
          {fmtMonth(month)} · Welcome back
        </p>
      </div>

      {/* CRM quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-400">Open tasks</p>
          <p className="mt-1 text-3xl font-bold">{taskCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Active deals</p>
          <p className="mt-1 text-3xl font-bold">{openDeals}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Top customer MRR</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {topCompanies[0]
              ? `$${Math.round(topCompanies[0].mrr).toLocaleString()}`
              : "—"}
          </p>
          {topCompanies[0] && (
            <p className="text-xs text-slate-500 mt-0.5">{topCompanies[0].companyName}</p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Pipeline value</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            —
          </p>
          <p className="text-xs text-slate-600">coming Step 4</p>
        </Card>
      </div>

      {/* Revenue overview */}
      <RevenuePanel
        totalMrr={metrics.totalMrr}
        totalArr={metrics.totalArr}
        totalUsageRevenue={metrics.totalUsageRevenue}
        totalRevenue={metrics.totalRevenue}
        month={month}
        topCompanies={topCompanies}
      />
    </div>
  );
}
