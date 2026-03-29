import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { KanbanBoard } from "@/components/deals/KanbanBoard";
import { LinkButton } from "@/components/ui/button";
import { List, Plus } from "lucide-react";

export const metadata = { title: "Pipeline Board — Clairio CRM" };

export default async function DealsBoardPage() {
  const accountId = await requireAccountId();

  const deals = await prisma.deal.findMany({
    where: { accountId },
    include: {
      contact: { select: { name: true } },
      company: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const kanbanDeals = deals.map((d) => ({
    id: d.id,
    title: d.title,
    amount: d.amount,
    stage: d.stage,
    closeDate: d.closeDate,
    contactName: d.contact.name,
    companyName: d.company?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Board</h1>
          <p className="mt-1 text-sm text-slate-400">
            {deals.length} deal{deals.length !== 1 ? "s" : ""} across all stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/deals" variant="secondary">
            <List className="h-4 w-4" /> List view
          </LinkButton>
          <LinkButton href="/deals/new">
            <Plus className="h-4 w-4" /> New Deal
          </LinkButton>
        </div>
      </div>

      <KanbanBoard deals={kanbanDeals} />
    </div>
  );
}
