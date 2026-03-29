"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createTask, updateTask, type TaskData } from "@/app/actions/tasks";

interface Contact { id: string; name: string }
interface Deal { id: string; title: string }

interface Props {
  contacts: Contact[];
  deals: Deal[];
  initial?: TaskData & { id?: string };
  defaultContactId?: string;
  defaultDealId?: string;
}

export function TaskForm({ contacts, deals, initial, defaultContactId, defaultDealId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState<TaskData>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    dueDate: initial?.dueDate ?? "",
    status: initial?.status ?? "Open",
    contactId: initial?.contactId ?? defaultContactId ?? "",
    dealId: initial?.dealId ?? defaultDealId ?? "",
  });

  const field = (key: keyof TaskData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required."); return; }
    setError("");
    startTransition(async () => {
      try {
        if (initial?.id) {
          await updateTask(initial.id, form);
          router.push("/tasks");
        } else {
          await createTask(form);
        }
      } catch (err: any) {
        if (!err?.message?.includes("NEXT_REDIRECT")) setError(err.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 max-w-lg">
      <Input
        label="Task title *"
        value={form.title}
        onChange={field("title")}
        placeholder="Follow up on proposal"
        required
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Description</label>
        <textarea
          value={form.description ?? ""}
          onChange={field("description")}
          rows={3}
          placeholder="Any additional context…"
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      <Input
        label="Due date"
        type="date"
        value={form.dueDate ?? ""}
        onChange={field("dueDate")}
      />

      {initial?.id && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400 font-medium">Status</label>
          <select
            value={form.status}
            onChange={field("status")}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Open" className="bg-slate-900">Open</option>
            <option value="Completed" className="bg-slate-900">Completed</option>
          </select>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Linked contact</label>
        <select
          value={form.contactId ?? ""}
          onChange={field("contactId")}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" className="bg-slate-900">— None —</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs text-slate-400 font-medium">Linked deal</label>
        <select
          value={form.dealId ?? ""}
          onChange={field("dealId")}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" className="bg-slate-900">— None —</option>
          {deals.map((d) => (
            <option key={d.id} value={d.id} className="bg-slate-900">{d.title}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-900/30 border border-red-700/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : initial?.id ? "Save changes" : "Create task"}
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
