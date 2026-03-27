"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createContact, updateContact, type ContactData } from "@/app/actions/contacts";

interface Company { id: string; name: string }

interface Props {
  companies: Company[];
  initial?: ContactData & { id?: string };
}

export function ContactForm({ companies, initial }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<ContactData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    phone: initial?.phone ?? "",
    companyId: initial?.companyId ?? "",
    tags: initial?.tags ?? "",
    notes: initial?.notes ?? "",
  });

  const field = (key: keyof ContactData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError("");
    startTransition(async () => {
      try {
        if (initial?.id) {
          await updateContact(initial.id, form);
          router.push(`/contacts/${initial.id}`);
        } else {
          await createContact(form);
        }
      } catch (err: any) {
        if (!err?.message?.includes("NEXT_REDIRECT")) setError(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-lg">
      <Input label="Full name *" value={form.name} onChange={field("name")} placeholder="Jane Smith" required />
      <Input label="Email" type="email" value={form.email ?? ""} onChange={field("email")} placeholder="jane@acme.com" />
      <Input label="Phone" value={form.phone ?? ""} onChange={field("phone")} placeholder="+1 415 555 0100" />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Company</label>
        <select
          value={form.companyId ?? ""}
          onChange={field("companyId")}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" className="bg-slate-900">— No company —</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
          ))}
        </select>
      </div>

      <Input
        label="Tags (comma-separated)"
        value={form.tags ?? ""}
        onChange={field("tags")}
        placeholder="champion, decision-maker"
      />

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
        <p className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial?.id ? "Save changes" : "Create contact"}
        </Button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
