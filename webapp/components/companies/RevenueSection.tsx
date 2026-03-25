"use client";

import { useState, useTransition } from "react";
import type { RevenueSnapshot } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtCurrency, fmtMonth } from "@/lib/revenue";
import { logUsageRevenue } from "@/app/actions/revenue";
import { TrendingUp, DollarSign, Zap, BarChart3 } from "lucide-react";

interface Props {
  companyId: string;
  currentMrr: number;
  currentArr: number;
  currentUsage: number;
  currentTotal: number;
  history: RevenueSnapshot[];
}

export function RevenueSection({
  companyId,
  currentMrr,
  currentArr,
  currentUsage,
  currentTotal,
  history,
}: Props) {
  const now = new Date();
  const [year, setYear] = useState(String(now.getUTCFullYear()));
  const [month, setMonth] = useState(String(now.getUTCMonth() + 1));
  const [usage, setUsage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function submitUsage() {
    const u = parseFloat(usage);
    if (isNaN(u) || u < 0) { setError("Enter a valid amount."); return; }
    setError("");
    startTransition(async () => {
      try {
        await logUsageRevenue(companyId, parseInt(year), parseInt(month), u);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        setUsage("");
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
      }
    });
  }

  const metrics = [
    { label: "Customer MRR", value: fmtCurrency(currentMrr), icon: TrendingUp, sub: "this month" },
    { label: "Customer ARR", value: fmtCurrency(currentArr), icon: BarChart3, sub: "run rate" },
    { label: "Usage revenue", value: fmtCurrency(currentUsage), icon: Zap, sub: "this month" },
    { label: "Total revenue", value: fmtCurrency(currentTotal), icon: DollarSign, sub: "this month" },
  ];

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold">Revenue (MRR, ARR &amp; usage)</h2>

      {/* Current-month cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, sub }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                <p className="text-xs text-slate-600">{sub}</p>
              </div>
              <Icon className="h-4 w-4 text-slate-600" />
            </div>
          </Card>
        ))}
      </div>

      {/* Log usage revenue form */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-medium text-slate-300 mb-3">Log usage revenue</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Year</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {[now.getUTCFullYear() - 1, now.getUTCFullYear()].map((y) => (
                <option key={y} value={y} className="bg-slate-900">{y}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-medium">Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m} className="bg-slate-900">
                  {new Date(2000, m - 1).toLocaleString("en-US", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <Input
              label="Usage amount ($)"
              type="number"
              min="0"
              step="0.01"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <Button size="sm" onClick={submitUsage} disabled={isPending}>
            {saved ? "Saved!" : "Log"}
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {/* History table */}
      {history.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">Month</th>
                <th className="pb-2 pr-4 font-medium text-right">Beginning MRR</th>
                <th className="pb-2 pr-4 font-medium text-right">Ending MRR</th>
                <th className="pb-2 pr-4 font-medium text-right">Usage revenue</th>
                <th className="pb-2 font-medium text-right">Total revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((snap) => (
                <tr key={snap.id}>
                  <td className="py-3 pr-4 font-medium">{fmtMonth(snap.month)}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-400">
                    {fmtCurrency(snap.beginningMrr)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {fmtCurrency(snap.endingMrr)}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums text-slate-400">
                    {fmtCurrency(snap.monthlyUsageRevenue)}
                  </td>
                  <td className="py-3 text-right tabular-nums font-medium">
                    {fmtCurrency(snap.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No revenue history yet. Log a month above.</p>
      )}
    </section>
  );
}
