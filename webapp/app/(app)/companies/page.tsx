import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { LinkButton } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency } from "@/lib/revenue";
import { Plus, Building2 } from "lucide-react";

export const metadata = { title: "Companies — Clairio CRM" };

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const accountId = await requireAccountId();
  const q = searchParams.q?.trim() || "";

  const [companies, mrrRows] = await Promise.all([
    prisma.company.findMany({
      where: {
        accountId,
        ...(q && { name: { contains: q, mode: "insensitive" } }),
      },
      include: {
        _count: { select: { contacts: true, deals: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.subscription.groupBy({
      by: ["companyId"],
      where: { accountId, isActive: true },
      _sum: { monthlyRecurringAmount: true },
    }),
  ]);

  const mrrMap = Object.fromEntries(
    mrrRows.map((r) => [r.companyId, r._sum.monthlyRecurringAmount ?? 0])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="mt-1 text-sm text-slate-400">
            {companies.length} compan{companies.length !== 1 ? "ies" : "y"}
            {q && ` matching "${q}"`}
          </p>
        </div>
        <LinkButton href="/companies/new">
          <Plus className="h-4 w-4" /> New Company
        </LinkButton>
      </div>

      <SearchInput placeholder="Search by name…" />

      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <Building2 className="h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {q ? "No companies match your search" : "No companies yet"}
          </p>
          {!q && (
            <LinkButton href="/companies/new" size="sm" className="mt-4">
              <Plus className="h-4 w-4" /> Add your first company
            </LinkButton>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Industry</th>
                <th className="px-5 py-3 font-medium text-right">MRR</th>
                <th className="px-5 py-3 font-medium text-right">ARR</th>
                <th className="px-5 py-3 font-medium text-right">Contacts</th>
                <th className="px-5 py-3 font-medium text-right">Deals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {companies.map((c) => {
                const mrr = mrrMap[c.id] ?? 0;
                return (
                  <tr key={c.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/companies/${c.id}`} className="font-medium text-white group-hover:text-indigo-400">
                        {c.name}
                      </Link>
                      {c.website && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {c.website.replace(/^https?:\/\//, "")}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {c.industry
                        ? <Badge color="indigo">{c.industry}</Badge>
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {mrr > 0 ? fmtCurrency(mrr) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-400">
                      {mrr > 0 ? fmtCurrency(mrr * 12) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400">{c._count.contacts}</td>
                    <td className="px-5 py-3 text-right text-slate-400">{c._count.deals}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
