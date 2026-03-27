import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import {
  getCompanyMrr,
  getCompanyArr,
  getCompanyRevenueHistory,
  currentMonthStart,
  fmtCurrency,
} from "@/lib/revenue";
import { SubscriptionsSection } from "@/components/companies/SubscriptionsSection";
import { RevenueSection } from "@/components/companies/RevenueSection";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteCompany } from "@/app/actions/companies";
import { Building2, Globe, ArrowLeft, Users, Briefcase } from "lucide-react";

export async function generateMetadata({ params }: { params: { id: string } }) {
  return { title: "Company — Clairio CRM" };
}

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();

  const company = await prisma.company.findFirst({
    where: { id: params.id, accountId },
    include: {
      contacts: { orderBy: { name: "asc" } },
      deals: { orderBy: { createdAt: "desc" }, take: 5 },
      subscriptions: { orderBy: { contractStartDate: "asc" } },
    },
  });

  if (!company) notFound();

  const month = currentMonthStart();
  const [mrr, arr, history] = await Promise.all([
    getCompanyMrr(accountId, company.id, month),
    getCompanyArr(accountId, company.id, month),
    getCompanyRevenueHistory(accountId, company.id, 12),
  ]);

  const currentSnap = history.find(
    (s) => s.month.getUTCMonth() === month.getUTCMonth() &&
            s.month.getUTCFullYear() === month.getUTCFullYear()
  );
  const currentUsage = currentSnap?.monthlyUsageRevenue ?? 0;
  const currentTotal = mrr + currentUsage;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Link
        href="/companies"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Companies
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Building2 className="h-6 w-6 text-slate-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <div className="mt-1 flex items-center gap-3">
              {company.industry && (
                <Badge color="indigo">{company.industry}</Badge>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-400"
                >
                  <Globe className="h-3 w-3" /> {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={`/companies/${company.id}/edit`} variant="secondary" size="sm">Edit</LinkButton>
          <DeleteButton
            action={async () => { "use server"; await deleteCompany(company.id); }}
            confirm="Delete this company? All subscriptions and revenue data will be lost."
          />
        </div>
      </div>

      {/* MRR / ARR quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-slate-400">Customer MRR</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{fmtCurrency(mrr)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Customer ARR</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{fmtCurrency(arr)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Active subscriptions</p>
          <p className="mt-1 text-2xl font-bold">
            {company.subscriptions.filter((s) => s.isActive).length}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left: Contacts + Deals */}
        <div className="col-span-1 space-y-6">
          {/* Contacts */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Users className="h-4 w-4" /> Contacts
              </h2>
              <LinkButton href="/contacts/new" size="sm" variant="ghost">+ Add</LinkButton>
            </div>
            {company.contacts.length === 0 ? (
              <p className="text-xs text-slate-600">None</p>
            ) : (
              <ul className="space-y-1">
                {company.contacts.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                    >
                      <p className="font-medium">{c.name}</p>
                      {c.email && <p className="text-xs text-slate-500">{c.email}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent deals */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                <Briefcase className="h-4 w-4" /> Recent deals
              </h2>
              <LinkButton href="/deals" size="sm" variant="ghost">View all</LinkButton>
            </div>
            {company.deals.length === 0 ? (
              <p className="text-xs text-slate-600">None</p>
            ) : (
              <ul className="space-y-1">
                {company.deals.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={`/deals/${d.id}`}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{d.title}</p>
                        <Badge color="slate">{d.stage}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">{fmtCurrency(d.amount)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Notes */}
          {company.notes && (
            <section>
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Notes</h2>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                {company.notes}
              </p>
            </section>
          )}
        </div>

        {/* Right: Subscriptions + Revenue */}
        <div className="col-span-2 space-y-10">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
            <SubscriptionsSection
              companyId={company.id}
              subscriptions={company.subscriptions}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-6">
            <RevenueSection
              companyId={company.id}
              currentMrr={mrr}
              currentArr={arr}
              currentUsage={currentUsage}
              currentTotal={currentTotal}
              history={history}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
