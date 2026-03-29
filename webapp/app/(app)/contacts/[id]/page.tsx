import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteContact } from "@/app/actions/contacts";
import { fmtCurrency } from "@/lib/revenue";
import { ArrowLeft, Mail, Phone, Building2, Briefcase } from "lucide-react";

export const metadata = { title: "Contact — Clairio CRM" };

const STAGE_COLORS: Record<string, "indigo"|"blue"|"yellow"|"purple"|"green"|"red"> = {
  Lead: "indigo", Qualified: "blue", Proposal: "yellow",
  Negotiation: "purple", Won: "green", Lost: "red",
};

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();

  const contact = await prisma.contact.findFirst({
    where: { id: params.id, accountId },
    include: {
      company: { select: { id: true, name: true } },
      deals: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { dueDate: "asc" }, where: { status: "Open" } },
    },
  });

  if (!contact) notFound();

  return (
    <div className="space-y-8">
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-white">
                <Mail className="h-3.5 w-3.5" /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3.5 w-3.5" /> {contact.phone}
              </a>
            )}
            {contact.company && (
              <Link href={`/companies/${contact.company.id}`} className="flex items-center gap-1.5 hover:text-indigo-400">
                <Building2 className="h-3.5 w-3.5" /> {contact.company.name}
              </Link>
            )}
          </div>
          {contact.tags && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {contact.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                <Badge key={tag} color="indigo">{tag}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/contacts/${contact.id}/edit`} variant="secondary" size="sm">Edit</LinkButton>
          <DeleteButton
            action={async () => { "use server"; await deleteContact(contact.id); }}
            confirm="Delete this contact? This cannot be undone."
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Notes */}
        <div className="col-span-1 space-y-6">
          {contact.notes && (
            <section>
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Notes</h2>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{contact.notes}</p>
            </section>
          )}
          {/* Open tasks */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-300">Open tasks</h2>
              <LinkButton href={`/tasks/new?contactId=${contact.id}`} size="sm" variant="ghost">+ Add</LinkButton>
            </div>
          {contact.tasks.length > 0 && (
            <>
              <ul className="space-y-1">
                {contact.tasks.map((t) => (
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
            </>
          )}
          </section>
        </div>

        {/* Deals */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
              <Briefcase className="h-4 w-4" /> Deals ({contact.deals.length})
            </h2>
            <LinkButton href="/deals/new" size="sm" variant="ghost">+ New deal</LinkButton>
          </div>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-slate-500">No deals yet.</p>
          ) : (
            <div className="rounded-xl border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 bg-white/[0.02]">
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Title</th>
                    <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                    <th className="px-4 py-2.5 font-medium">Stage</th>
                    <th className="px-4 py-2.5 font-medium">Close date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {contact.deals.map((d) => (
                    <tr key={d.id} className="hover:bg-white/5">
                      <td className="px-4 py-3">
                        <Link href={`/deals/${d.id}`} className="font-medium hover:text-indigo-400">{d.title}</Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{fmtCurrency(d.amount)}</td>
                      <td className="px-4 py-3">
                        <Badge color={STAGE_COLORS[d.stage] ?? "slate"}>{d.stage}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
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
      </div>
    </div>
  );
}
