"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCompany, updateCompany, type CompanyData } from "@/app/actions/companies";

const INDUSTRIES = [
  "SaaS", "Fintech", "Healthcare", "E-commerce", "Logistics",
  "Retail", "Manufacturing", "Education", "Real Estate", "Other",
];

interface Props {
  initial?: CompanyData & { id?: string };
}

export function CompanyForm({ initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<CompanyData>({
    name: initial?.name ?? "",
    website: initial?.website ?? "",
    industry: initial?.industry ?? "",
    notes: initial?.notes ?? "",
  });

  const field = (key: keyof CompanyData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError("");
    startTransition(async () => {
      try {
        if (initial?.id) {
          await updateCompany(initial.id, form);
          router.push(`/companies/${initial.id}`);
        } else {
          await createCompany(form);
        }
      } catch (err: any) {
        if (!err?.message?.includes("NEXT_REDIRECT")) setError(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-lg">
      <Input label="Company name *" value={form.name} onChange={field("name")} placeholder="Acme Inc." required />
      <Input label="Website" value={form.website ?? ""} onChange={field("website")} placeholder="https://acme.com" />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Industry</label>
        <select
          value={form.industry ?? ""}
          onChange={field("industry")}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" className="bg-slate-900">— Select industry —</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i} className="bg-slate-900">{i}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Notes</label>
        <textarea
          value={form.notes ?? ""}
          onChange={field("notes")}
          rows={4}
          placeholder="Any additional notes…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial?.id ? "Save changes" : "Create company"}
        </Button>
        <button type="button" onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}
