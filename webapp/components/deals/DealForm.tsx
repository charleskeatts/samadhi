"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createDeal, updateDeal, type DealData } from "@/app/actions/deals";

const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];

interface Contact { id: string; name: string }
interface Company { id: string; name: string }

interface Props {
  contacts: Contact[];
  companies: Company[];
  initial?: DealData & { id?: string };
}

export function DealForm({ contacts, companies, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<DealData>({
    title: initial?.title ?? "",
    contactId: initial?.contactId ?? "",
    companyId: initial?.companyId ?? "",
    amount: initial?.amount ?? 0,
    stage: initial?.stage ?? "Lead",
    closeDate: initial?.closeDate ?? "",
    notes: initial?.notes ?? "",
  });

  const field = (key: keyof DealData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.contactId) { setError("Contact is required."); return; }
    setError("");
    startTransition(async () => {
      try {
        const data = { ...form, amount: Number(form.amount) };
        if (initial?.id) {
          await updateDeal(initial.id, data);
          router.push(`/deals/${initial.id}`);
        } else {
          await createDeal(data);
        }
      } catch (err: any) {
        if (!err?.message?.includes("NEXT_REDIRECT")) setError(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-lg">
      <Input label="Deal title *" value={form.title} onChange={field("title")} placeholder="Acme — Enterprise upgrade" required />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Contact *</label>
        <select value={form.contactId} onChange={field("contactId")} required
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="" className="bg-slate-900">— Select contact —</option>
          {contacts.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Company</label>
        <select value={form.companyId ?? ""} onChange={field("companyId")}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="" className="bg-slate-900">— No company —</option>
          {companies.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Amount ($)" type="number" min="0" step="0.01"
          value={form.amount} onChange={field("amount")} placeholder="0.00" />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">Stage</label>
          <select value={form.stage} onChange={field("stage")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            {STAGES.map((s) => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
          </select>
        </div>
      </div>

      <Input label="Expected close date" type="date"
        value={form.closeDate ?? ""} onChange={field("closeDate")} />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Notes</label>
        <textarea value={form.notes ?? ""} onChange={field("notes")} rows={4}
          placeholder="Any context about this deal…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial?.id ? "Save changes" : "Create deal"}
        </Button>
        <button type="button" onClick={() => router.back()} className="text-sm text-slate-400 hover:text-white">
          Cancel
        </button>
      </div>
    </form>
  );
}
