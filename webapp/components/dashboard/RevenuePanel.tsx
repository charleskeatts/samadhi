import Link from "next/link";
import { Card } from "@/components/ui/card";
import { fmtCurrency, fmtMonth } from "@/lib/revenue";
import { TrendingUp, DollarSign, Zap, BarChart3 } from "lucide-react";

interface TopCompany {
  companyId: string;
  companyName: string;
  mrr: number;
  arr: number;
  usageRevenue: number;
  totalRevenue: number;
}

interface Props {
  totalMrr: number;
  totalArr: number;
  totalUsageRevenue: number;
  totalRevenue: number;
  month: Date;
  topCompanies: TopCompany[];
}

export function RevenuePanel({
  totalMrr,
  totalArr,
  totalUsageRevenue,
  totalRevenue,
  month,
  topCompanies,
}: Props) {
  const cards = [
    { label: "Total MRR", value: fmtCurrency(totalMrr), icon: TrendingUp, color: "text-indigo-400" },
    { label: "Total ARR", value: fmtCurrency(totalArr), icon: BarChart3, color: "text-blue-400" },
    { label: "Usage revenue", value: fmtCurrency(totalUsageRevenue), icon: Zap, color: "text-yellow-400", sub: fmtMonth(month) },
    { label: "Total revenue", value: fmtCurrency(totalRevenue), icon: DollarSign, color: "text-green-400", sub: fmtMonth(month) },
  ];

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-slate-300">Revenue overview</h2>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
                {sub && <p className="text-xs text-slate-600">{sub}</p>}
              </div>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Top companies table */}
      {topCompanies.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10">
            <p className="text-xs font-medium text-slate-400">Top customers by MRR</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-600">
                <th className="px-5 py-2 font-medium">Company</th>
                <th className="px-5 py-2 font-medium text-right">MRR</th>
                <th className="px-5 py-2 font-medium text-right">ARR</th>
                <th className="px-5 py-2 font-medium text-right">Usage</th>
                <th className="px-5 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {topCompanies.map((c) => (
                <tr key={c.companyId} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/companies/${c.companyId}`}
                      className="font-medium hover:text-indigo-400"
                    >
                      {c.companyName}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {fmtCurrency(c.mrr)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-400">
                    {fmtCurrency(c.arr)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-slate-400">
                    {fmtCurrency(c.usageRevenue)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">
                    {fmtCurrency(c.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
