import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { ContactForm } from "@/components/contacts/ContactForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New Contact — Clairio CRM" };

export default async function NewContactPage() {
  const accountId = await requireAccountId();
  const companies = await prisma.company.findMany({
    where: { accountId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Contacts
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New Contact</h1>
        <p className="mt-1 text-sm text-slate-400">Add a person to your CRM</p>
      </div>
      <ContactForm companies={companies} />
    </div>
  );
}
