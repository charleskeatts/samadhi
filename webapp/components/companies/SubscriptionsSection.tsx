"use client";

import { useState, useTransition } from "react";
import type { Subscription } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fmtCurrency } from "@/lib/revenue";
import {
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from "@/app/actions/subscriptions";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

const PRICING_MODELS = [
  { value: "flat_monthly",  label: "Flat monthly" },
  { value: "flat_annual",   label: "Flat annual" },
  { value: "seat_based",    label: "Seat-based" },
  { value: "usage_based",   label: "Usage-based" },
];

const modelLabel = (v: string) => PRICING_MODELS.find((m) => m.value === v)?.label ?? v;

type FormState = {
  name: string;
  pricingModel: string;
  monthlyRecurringAmount: string;
  annualRecurringAmount: string;
  contractStartDate: string;
  contractEndDate: string;
  isActive: boolean;
  notes: string;
};

const emptyForm = (): FormState => ({
  name: "",
  pricingModel: "flat_monthly",
  monthlyRecurringAmount: "",
  annualRecurringAmount: "",
  contractStartDate: new Date().toISOString().slice(0, 10),
  contractEndDate: "",
  isActive: true,
  notes: "",
});

function subToForm(s: Subscription): FormState {
  return {
    name: s.name,
    pricingModel: s.pricingModel,
    monthlyRecurringAmount: String(s.monthlyRecurringAmount),
    annualRecurringAmount: s.annualRecurringAmount != null ? String(s.annualRecurringAmount) : "",
    contractStartDate: s.contractStartDate.toISOString().slice(0, 10),
    contractEndDate: s.contractEndDate ? s.contractEndDate.toISOString().slice(0, 10) : "",
    isActive: s.isActive,
    notes: s.notes,
  };
}

interface Props {
  companyId: string;
  subscriptions: Subscription[];
}

export function SubscriptionsSection({ companyId, subscriptions }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const field = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  }

  function openEdit(sub: Subscription) {
    setEditingId(sub.id);
    setForm(subToForm(sub));
    setError("");
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function submit() {
    const monthly = parseFloat(form.monthlyRecurringAmount);
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (isNaN(monthly)) { setError("Monthly amount must be a number."); return; }

    const data = {
      name: form.name.trim(),
      pricingModel: form.pricingModel,
      monthlyRecurringAmount: monthly,
      annualRecurringAmount: form.annualRecurringAmount ? parseFloat(form.annualRecurringAmount) : null,
      contractStartDate: form.contractStartDate,
      contractEndDate: form.contractEndDate || null,
      isActive: form.isActive,
      notes: form.notes,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateSubscription(editingId, data);
        } else {
          await createSubscription(companyId, data);
        }
        cancel();
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this subscription?")) return;
    startTransition(async () => {
      try { await deleteSubscription(id); }
      catch (e: any) { setError(e.message); }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subscriptions</h2>
        <Button size="sm" onClick={openAdd} disabled={isPending}>
          <Plus className="h-3.5 w-3.5" /> Add subscription
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-5 space-y-4">
          <p className="text-sm font-medium text-indigo-300">
            {editingId ? "Edit subscription" : "New subscription"}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input label="Name" value={form.name} onChange={field("name")} placeholder="Pro Plan – 10 seats" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Pricing model</label>
              <select
                value={form.pricingModel}
                onChange={field("pricingModel")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {PRICING_MODELS.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900">{m.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Monthly recurring amount ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.monthlyRecurringAmount}
              onChange={field("monthlyRecurringAmount")}
              placeholder="199.00"
            />

            <Input
              label="Annual recurring amount ($, optional)"
              type="number"
              min="0"
              step="0.01"
              value={form.annualRecurringAmount}
              onChange={field("annualRecurringAmount")}
              placeholder="auto (monthly × 12)"
            />

            <Input
              label="Contract start date"
              type="date"
              value={form.contractStartDate}
              onChange={field("contractStartDate")}
            />

            <Input
              label="Contract end date (optional)"
              type="date"
              value={form.contractEndDate}
              onChange={field("contractEndDate")}
            />

            <div className="col-span-2 flex items-center gap-2">
              <input
                id="sub-active"
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
              />
              <label htmlFor="sub-active" className="text-sm text-slate-300">Active</label>
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
      {subscriptions.length === 0 && !showForm ? (
        <p className="text-sm text-slate-500 py-4">No subscriptions yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Model</th>
                <th className="pb-2 pr-4 font-medium text-right">MRR</th>
                <th className="pb-2 pr-4 font-medium text-right">ARR</th>
                <th className="pb-2 pr-4 font-medium">Start</th>
                <th className="pb-2 pr-4 font-medium">End</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscriptions.map((sub) => {
                const arr = sub.annualRecurringAmount ?? sub.monthlyRecurringAmount * 12;
                return (
                  <tr key={sub.id} className="group">
                    <td className="py-3 pr-4 font-medium text-white">{sub.name}</td>
                    <td className="py-3 pr-4 text-slate-400">{modelLabel(sub.pricingModel)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {fmtCurrency(sub.monthlyRecurringAmount)}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-400">
                      {fmtCurrency(arr)}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {sub.contractStartDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {sub.contractEndDate
                        ? sub.contractEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge color={sub.isActive ? "green" : "slate"}>
                        {sub.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(sub)}
                          className="rounded p-1 text-slate-500 hover:text-white hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(sub.id)}
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
