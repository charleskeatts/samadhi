import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteDeal } from "@/app/actions/deals";
import { fmtCurrency } from "@/lib/revenue";
import { ArrowLeft, User, Building2, DollarSign, Calendar } from "lucide-react";

export const metadata = { title: "Deal — Clairio CRM" };

const STAGE_COLORS: Record<string, "indigo"|"blue"|"yellow"|"purple"|"green"|"red"> = {
  Lead: "indigo", Qualified: "blue", Proposal: "yellow",
  Negotiation: "purple", Won: "green", Lost: "red",
};

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();

  const deal = await prisma.deal.findFirst({
    where: { id: params.id, accountId },
    include: {
      contact: { select: { id: true, name: true, email: true } },
      company: { select: { id: true, name: true } },
      tasks: { where: { status: "Open" }, orderBy: { dueDate: "asc" } },
    },
  });

  if (!deal) notFound();

  return (
    <div className="space-y-8">
      <Link href="/deals" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Deals
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{deal.title}</h1>
            <Badge color={STAGE_COLORS[deal.stage] ?? "slate"}>{deal.stage}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <DollarSign className="h-4 w-4" />
              <span className="text-2xl font-bold text-white">{fmtCurrency(deal.amount)}</span>
            </span>
            <Link href={`/contacts/${deal.contact.id}`} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400">
              <User className="h-4 w-4" /> {deal.contact.name}
            </Link>
            {deal.company && (
              <Link href={`/companies/${deal.company.id}`} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400">
                <Building2 className="h-4 w-4" /> {deal.company.name}
              </Link>
            )}
            {deal.closeDate && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Calendar className="h-4 w-4" />
                Close {deal.closeDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/deals/${deal.id}/edit`} variant="secondary" size="sm">Edit</LinkButton>
          <DeleteButton
            action={async () => { "use server"; await deleteDeal(deal.id); }}
            confirm="Delete this deal? This cannot be undone."
          />
        </div>
      </div>

      {/* Notes + Tasks */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          {deal.notes && (
            <section>
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Notes</h2>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{deal.notes}</p>
            </section>
          )}
        </div>

        <div className="col-span-1 space-y-4">
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Open tasks</h2>
              <LinkButton href={`/tasks/new?dealId=${deal.id}`} size="sm" variant="ghost">+ Add</LinkButton>
            </div>
            {deal.tasks.length === 0 ? (
              <p className="text-xs text-slate-600">No open tasks</p>
            ) : (
              <ul className="space-y-1">
                {deal.tasks.map((t) => (
                  <li key={t.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <p className="text-white">{t.title}</p>
                    {t.dueDate && (
                      <p className="text-xs text-slate-500">
                        Due {t.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
