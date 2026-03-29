import Link from "next/link";
import { requireAccountId } from "@/lib/session";
import {
  getAccountRevenueMetrics,
  getTopCompaniesByMrr,
  currentMonthStart,
  fmtMonth,
  fmtCurrency,
} from "@/lib/revenue";
import { prisma } from "@/lib/db";
import { RevenuePanel } from "@/components/dashboard/RevenuePanel";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock, FileText } from "lucide-react";

export const metadata = { title: "Dashboard — Clairio CRM" };

export default async function DashboardPage() {
  const accountId = await requireAccountId();
  const month = currentMonthStart();
  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [
    metrics,
    topCompanies,
    taskCount,
    overdueCount,
    openDeals,
    pipelineValue,
    renewingSoon,
    overdueInvoices,
    unpaidInvoiceTotal,
  ] = await Promise.all([
    getAccountRevenueMetrics(accountId, month),
    getTopCompaniesByMrr(accountId, month, 5),
    prisma.task.count({ where: { accountId, status: "Open" } }),
    prisma.task.count({
      where: { accountId, status: "Open", dueDate: { lt: now } },
    }),
    prisma.deal.count({
      where: { accountId, stage: { notIn: ["Won", "Lost"] } },
    }),
    prisma.deal.aggregate({
      where: { accountId, stage: { notIn: ["Won", "Lost"] } },
      _sum: { amount: true },
    }),
    // Contracts with renewalDate in the next 60 days, status=active
    prisma.contract.findMany({
      where: {
        accountId,
        status: "active",
        renewalDate: { gte: now, lte: in60 },
      },
      include: { company: { select: { id: true, name: true } } },
      orderBy: { renewalDate: "asc" },
    }),
    // Sent invoices whose dueDate has passed
    prisma.invoice.count({
      where: { accountId, status: "sent", dueDate: { lt: now } },
    }),
    // Sum of sent + overdue invoices (unpaid)
    prisma.invoice.aggregate({
      where: { accountId, status: { in: ["sent", "overdue"] } },
      _sum: { amount: true },
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

      {/* Contract renewal alerts */}
      {renewingSoon.length > 0 && (
        <div className="rounded-xl border border-yellow-800/40 bg-yellow-900/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-yellow-300">
            <Clock className="h-4 w-4" />
            Contract renewals coming up
          </div>
          <ul className="space-y-2">
            {renewingSoon.map((contract) => {
              const daysLeft = Math.ceil(
                (contract.renewalDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
              const urgent = daysLeft <= 30;
              return (
                <li key={contract.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={urgent ? "text-red-400 font-medium" : "text-yellow-300"}>
                      {urgent ? "⚠ " : ""}
                      <Link
                        href={`/companies/${contract.company.id}`}
                        className="hover:underline"
                      >
                        {contract.company.name}
                      </Link>
                      {" — "}
                      {contract.title}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      urgent
                        ? "bg-red-900/40 text-red-300 border border-red-700/40"
                        : "bg-yellow-900/40 text-yellow-300 border border-yellow-700/40"
                    }`}
                  >
                    {daysLeft}d — {contract.renewalDate!.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Overdue invoices alert */}
      {overdueInvoices > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-orange-800/40 bg-orange-900/10 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-orange-300">
            <FileText className="h-4 w-4" />
            <span>
              <strong>{overdueInvoices}</strong> overdue invoice{overdueInvoices !== 1 ? "s" : ""} —{" "}
              {fmtCurrency(unpaidInvoiceTotal._sum.amount ?? 0)} outstanding
            </span>
          </div>
          <Link
            href="/companies"
            className="text-xs text-orange-400 hover:text-orange-200 underline"
          >
            View companies
          </Link>
        </div>
      )}

      {/* CRM quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/tasks?status=open">
          <Card className="hover:border-white/20 transition-colors cursor-pointer">
            <p className="text-xs text-slate-400">Open tasks</p>
            <p className="mt-1 text-3xl font-bold">{taskCount}</p>
            {overdueCount > 0 && (
              <p className="mt-1 text-xs text-red-400 font-medium">{overdueCount} overdue</p>
            )}
          </Card>
        </Link>
        <Link href="/deals">
          <Card className="hover:border-white/20 transition-colors cursor-pointer">
            <p className="text-xs text-slate-400">Active deals</p>
            <p className="mt-1 text-3xl font-bold">{openDeals}</p>
          </Card>
        </Link>
        <Card>
          <p className="text-xs text-slate-400">Pipeline value</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {fmtCurrency(pipelineValue._sum.amount ?? 0)}
          </p>
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
