import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { DealForm } from "@/components/deals/DealForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New Deal — Clairio CRM" };

export default async function NewDealPage() {
  const accountId = await requireAccountId();
  const [contacts, companies] = await Promise.all([
    prisma.contact.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.company.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/deals" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Deals
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New Deal</h1>
        <p className="mt-1 text-sm text-slate-400">Track a new opportunity</p>
      </div>
      <DealForm contacts={contacts} companies={companies} />
    </div>
  );
}
