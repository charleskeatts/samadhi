import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit Company — Clairio CRM" };

export default async function EditCompanyPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();
  const company = await prisma.company.findFirst({ where: { id: params.id, accountId } });
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <Link href={`/companies/${company.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> {company.name}
      </Link>
      <h1 className="text-2xl font-bold">Edit Company</h1>
      <CompanyForm
        initial={{
          id: company.id,
          name: company.name,
          website: company.website ?? "",
          industry: company.industry ?? "",
          notes: company.notes,
        }}
      />
    </div>
  );
}
