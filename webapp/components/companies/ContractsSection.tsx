"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fmtCurrency } from "@/lib/revenue";
import {
  createContract,
  updateContract,
  deleteContract,
} from "@/app/actions/contracts";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Contract {
  id: string;
  companyId: string;
  accountId: string;
  title: string;
  status: string;
  value: number;
  startDate: Date;
  renewalDate: Date | null;
  autoRenews: boolean;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const CONTRACT_STATUSES = [
  { value: "draft",      label: "Draft" },
  { value: "active",     label: "Active" },
  { value: "expired",    label: "Expired" },
  { value: "terminated", label: "Terminated" },
];

const statusColor = (s: string): "slate" | "green" | "red" => {
  if (s === "active")   return "green";
  if (s === "expired" || s === "terminated") return "red";
  return "slate";
};

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

type FormState = {
  title: string;
  status: string;
  value: string;
  startDate: string;
  renewalDate: string;
  autoRenews: boolean;
  notes: string;
};

const emptyForm = (): FormState => ({
  title: "",
  status: "draft",
  value: "",
  startDate: new Date().toISOString().slice(0, 10),
  renewalDate: "",
  autoRenews: false,
  notes: "",
});

function contractToForm(c: Contract): FormState {
  return {
    title: c.title,
    status: c.status,
    value: String(c.value),
    startDate: new Date(c.startDate).toISOString().slice(0, 10),
    renewalDate: c.renewalDate ? new Date(c.renewalDate).toISOString().slice(0, 10) : "",
    autoRenews: c.autoRenews,
    notes: c.notes,
  };
}

interface Props {
  companyId: string;
  contracts: Contract[];
}

export function ContractsSection({ companyId, contracts }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const field =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  function openEdit(contract: Contract) {
    setEditingId(contract.id);
    setForm(contractToForm(contract));
    setError("");
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function submit() {
    const value = parseFloat(form.value);
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.startDate)    { setError("Start date is required."); return; }
    if (isNaN(value))       { setError("Value must be a number."); return; }

    const data = {
      title: form.title.trim(),
      status: form.status,
      value,
      startDate: form.startDate,
      renewalDate: form.renewalDate || null,
      autoRenews: form.autoRenews,
      notes: form.notes,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateContract(editingId, data);
        } else {
          await createContract(companyId, data);
        }
        cancel();
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this contract?")) return;
    startTransition(async () => {
      try { await deleteContract(id); }
      catch (e: any) { setError(e.message); }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contracts</h2>
        <Button size="sm" onClick={openAdd} disabled={isPending}>
          <Plus className="h-3.5 w-3.5" /> Add contract
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-5 space-y-4">
          <p className="text-sm font-medium text-indigo-300">
            {editingId ? "Edit contract" : "New contract"}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Title"
                value={form.title}
                onChange={field("title")}
                placeholder="Master Service Agreement"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Status</label>
              <select
                value={form.status}
                onChange={field("status")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Value ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={field("value")}
              placeholder="10000.00"
            />

            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={field("startDate")}
            />

            <Input
              label="Renewal date (optional)"
              type="date"
              value={form.renewalDate}
              onChange={field("renewalDate")}
            />

            <div className="col-span-2 flex items-center gap-2">
              <input
                id="contract-auto-renews"
                type="checkbox"
                checked={form.autoRenews}
                onChange={(e) => setForm((f) => ({ ...f, autoRenews: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
              />
              <label htmlFor="contract-auto-renews" className="text-sm text-slate-300">
                Auto-renews
              </label>
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={field("notes")}
                rows={3}
                placeholder="Additional notes…"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={submit} disabled={isPending}>
              <Check className="h-3.5 w-3.5" /> {editingId ? "Save" : "Create"}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={isPending}>
              <X className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      {contracts.length === 0 && !showForm ? (
        <p className="text-sm text-slate-500 py-4">No contracts yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">Title</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium text-right">Value</th>
                <th className="pb-2 pr-4 font-medium">Start Date</th>
                <th className="pb-2 pr-4 font-medium">Renewal Date</th>
                <th className="pb-2 pr-4 font-medium">Auto-renews</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contracts.map((contract) => {
                const days =
                  contract.renewalDate && contract.status === "active"
                    ? daysUntil(new Date(contract.renewalDate))
                    : null;

                return (
                  <tr key={contract.id} className="group">
                    <td className="py-3 pr-4 font-medium text-white">{contract.title}</td>
                    <td className="py-3 pr-4">
                      <Badge color={statusColor(contract.status)}>
                        {CONTRACT_STATUSES.find((s) => s.value === contract.status)?.label ?? contract.status}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {fmtCurrency(contract.value)}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {new Date(contract.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      {contract.renewalDate ? (
                        <span className="flex items-center gap-2">
                          <span className="text-slate-400">
                            {new Date(contract.renewalDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {days !== null && days <= 30 ? (
                            <Badge color="red">{days}d</Badge>
                          ) : days !== null && days <= 60 ? (
                            <Badge color="yellow">{days}d</Badge>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {contract.autoRenews ? (
                        <span className="text-sm text-green-400">✓ Yes</span>
                      ) : (
                        <span className="text-sm text-slate-500">— No</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(contract)}
                          className="rounded p-1 text-slate-500 hover:text-white hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(contract.id)}
                          className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
