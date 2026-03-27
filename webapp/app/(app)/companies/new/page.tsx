import Link from "next/link";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New Company — Clairio CRM" };

export default function NewCompanyPage() {
  return (
    <div className="space-y-6">
      <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Companies
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New Company</h1>
        <p className="mt-1 text-sm text-slate-400">Add an organization to your CRM</p>
      </div>
      <CompanyForm />
    </div>
  );
}
