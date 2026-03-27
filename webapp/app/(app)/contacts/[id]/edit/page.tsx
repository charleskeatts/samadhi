import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { ContactForm } from "@/components/contacts/ContactForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit Contact — Clairio CRM" };

export default async function EditContactPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();
  const [contact, companies] = await Promise.all([
    prisma.contact.findFirst({ where: { id: params.id, accountId } }),
    prisma.company.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!contact) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/contacts/${contact.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> {contact.name}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Edit Contact</h1>
      </div>
      <ContactForm
        companies={companies}
        initial={{
          id: contact.id,
          name: contact.name,
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          companyId: contact.companyId ?? "",
          tags: contact.tags,
          notes: contact.notes,
        }}
      />
    </div>
  );
}
