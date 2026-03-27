import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { DealForm } from "@/components/deals/DealForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit Deal — Clairio CRM" };

export default async function EditDealPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();
  const [deal, contacts, companies] = await Promise.all([
    prisma.deal.findFirst({ where: { id: params.id, accountId } }),
    prisma.contact.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.company.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/deals/${deal.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> {deal.title}
      </Link>
      <h1 className="text-2xl font-bold">Edit Deal</h1>
      <DealForm
        contacts={contacts}
        companies={companies}
        initial={{
          id: deal.id,
          title: deal.title,
          contactId: deal.contactId,
          companyId: deal.companyId ?? "",
          amount: deal.amount,
          stage: deal.stage,
          closeDate: deal.closeDate ? deal.closeDate.toISOString().slice(0, 10) : "",
          notes: deal.notes,
        }}
      />
    </div>
  );
}
