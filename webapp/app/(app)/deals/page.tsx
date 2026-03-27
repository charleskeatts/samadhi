import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { LinkButton } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { fmtCurrency } from "@/lib/revenue";
import { Plus, LayoutGrid, Briefcase } from "lucide-react";

export const metadata = { title: "Deals — Clairio CRM" };

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const STAGE_COLORS: Record<string, "indigo"|"blue"|"yellow"|"purple"|"green"|"red"> = {
  Lead: "indigo", Qualified: "blue", Proposal: "yellow",
  Negotiation: "purple", Won: "green", Lost: "red",
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: { q?: string; stage?: string };
}) {
  const accountId = await requireAccountId();
  const q = searchParams.q?.trim() || "";
  const stage = searchParams.stage || "";

  const deals = await prisma.deal.findMany({
    where: {
      accountId,
      ...(stage && { stage }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { contact: { name: { contains: q, mode: "insensitive" } } },
          { company: { name: { contains: q, mode: "insensitive" } } },
        ],
      }),
    },
    include: {
      contact: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalValue = deals
    .filter((d) => !["Won", "Lost"].includes(d.stage))
    .reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="mt-1 text-sm text-slate-400">
            {deals.length} deal{deals.length !== 1 ? "s" : ""}
            {totalValue > 0 && ` · ${fmtCurrency(totalValue)} pipeline`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/deals/board" variant="secondary">
            <LayoutGrid className="h-4 w-4" /> Board
          </LinkButton>
          <LinkButton href="/deals/new">
            <Plus className="h-4 w-4" /> New Deal
          </LinkButton>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchInput placeholder="Search deals, contacts, companies…" />
        </div>
        {/* Stage filter */}
        <div className="flex items-center gap-1.5">
          <StageFilter current={stage} />
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <Briefcase className="h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {q || stage ? "No deals match your filters" : "No deals yet"}
          </p>
          {!q && !stage && (
            <LinkButton href="/deals/new" size="sm" className="mt-4">
              <Plus className="h-4 w-4" /> Add your first deal
            </LinkButton>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium">Stage</th>
                <th className="px-5 py-3 font-medium">Close date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {deals.map((d) => (
                <tr key={d.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3">
                    <Link href={`/deals/${d.id}`} className="font-medium text-white group-hover:text-indigo-400">
                      {d.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/contacts/${d.contact.id}`} className="text-slate-300 hover:text-indigo-400">
                      {d.contact.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    {d.company
                      ? <Link href={`/companies/${d.company.id}`} className="text-slate-300 hover:text-indigo-400">{d.company.name}</Link>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-medium">{fmtCurrency(d.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge color={STAGE_COLORS[d.stage] ?? "slate"}>{d.stage}</Badge>
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {d.closeDate
                      ? d.closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StageFilter({ current }: { current: string }) {
  return (
    <>
      {["", ...STAGES].map((s) => (
        <Link
          key={s}
          href={s ? `/deals?stage=${s}` : "/deals"}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            current === s
              ? "bg-indigo-600 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}
        >
          {s || "All"}
        </Link>
      ))}
    </>
  );
}
