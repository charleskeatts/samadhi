"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { fmtCurrency } from "@/lib/revenue";
import {
  createInvoice,
  updateInvoice,
  deleteInvoice,
  markInvoicePaid,
} from "@/app/actions/invoices";
import { Plus, Pencil, Trash2, X, Check, CreditCard } from "lucide-react";

interface Invoice {
  id: string;
  companyId: string;
  accountId: string;
  contractId: string | null;
  number: string;
  status: string;
  amount: number;
  invoiceDate: Date;
  dueDate: Date;
  paidDate: Date | null;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const INVOICE_STATUSES = [
  { value: "draft",   label: "Draft" },
  { value: "sent",    label: "Sent" },
  { value: "paid",    label: "Paid" },
  { value: "overdue", label: "Overdue" },
  { value: "void",    label: "Void" },
];

const statusColor = (s: string): "slate" | "blue" | "green" | "red" => {
  if (s === "sent")    return "blue";
  if (s === "paid")    return "green";
  if (s === "overdue") return "red";
  return "slate";
};

function isOverdue(invoice: Invoice): boolean {
  if (invoice.status !== "sent") return false;
  return new Date(invoice.dueDate) < new Date();
}

type FormState = {
  number: string;
  status: string;
  amount: string;
  invoiceDate: string;
  dueDate: string;
  paidDate: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  number: "",
  status: "draft",
  amount: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  paidDate: "",
  notes: "",
});

function invoiceToForm(inv: Invoice): FormState {
  return {
    number: inv.number,
    status: inv.status,
    amount: String(inv.amount),
    invoiceDate: new Date(inv.invoiceDate).toISOString().slice(0, 10),
    dueDate: new Date(inv.dueDate).toISOString().slice(0, 10),
    paidDate: inv.paidDate ? new Date(inv.paidDate).toISOString().slice(0, 10) : "",
    notes: inv.notes,
  };
}

interface Props {
  companyId: string;
  invoices: Invoice[];
}

export function InvoicesSection({ companyId, invoices }: Props) {
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

  function openEdit(invoice: Invoice) {
    setEditingId(invoice.id);
    setForm(invoiceToForm(invoice));
    setError("");
    setShowForm(true);
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setError("");
  }

  function submit() {
    const amount = parseFloat(form.amount);
    if (!form.number.trim()) { setError("Invoice number is required."); return; }
    if (!form.invoiceDate)   { setError("Invoice date is required."); return; }
    if (!form.dueDate)       { setError("Due date is required."); return; }
    if (isNaN(amount))       { setError("Amount must be a number."); return; }

    const data = {
      number: form.number.trim(),
      status: form.status,
      amount,
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      paidDate: form.paidDate || null,
      notes: form.notes,
    };

    startTransition(async () => {
      try {
        if (editingId) {
          await updateInvoice(editingId, data);
        } else {
          await createInvoice(companyId, data);
        }
        cancel();
      } catch (e: any) {
        setError(e.message ?? "Something went wrong.");
      }
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this invoice?")) return;
    startTransition(async () => {
      try { await deleteInvoice(id); }
      catch (e: any) { setError(e.message); }
    });
  }

  function markPaid(id: string) {
    startTransition(async () => {
      try { await markInvoicePaid(id); }
      catch (e: any) { setError(e.message); }
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invoices</h2>
        <Button size="sm" onClick={openAdd} disabled={isPending}>
          <Plus className="h-3.5 w-3.5" /> Add invoice
        </Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="rounded-xl border border-indigo-500/30 bg-indigo-900/10 p-5 space-y-4">
          <p className="text-sm font-medium text-indigo-300">
            {editingId ? "Edit invoice" : "New invoice"}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Invoice number"
                value={form.number}
                onChange={field("number")}
                placeholder="INV-0001"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-400 font-medium">Status</label>
              <select
                value={form.status}
                onChange={field("status")}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {INVOICE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Amount ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={field("amount")}
              placeholder="5000.00"
            />

            <Input
              label="Invoice date"
              type="date"
              value={form.invoiceDate}
              onChange={field("invoiceDate")}
            />

            <Input
              label="Due date"
              type="date"
              value={form.dueDate}
              onChange={field("dueDate")}
            />

            <Input
              label="Paid date (optional)"
              type="date"
              value={form.paidDate}
              onChange={field("paidDate")}
            />

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
      {invoices.length === 0 && !showForm ? (
        <p className="text-sm text-slate-500 py-4">No invoices yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">Invoice #</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 pr-4 font-medium text-right">Amount</th>
                <th className="pb-2 pr-4 font-medium">Issued</th>
                <th className="pb-2 pr-4 font-medium">Due</th>
                <th className="pb-2 pr-4 font-medium">Paid</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {invoices.map((invoice) => {
                const overdue = isOverdue(invoice);
                const canMarkPaid = invoice.status === "sent" || invoice.status === "overdue";

                return (
                  <tr key={invoice.id} className="group">
                    <td className="py-3 pr-4 font-medium text-white">{invoice.number}</td>
                    <td className="py-3 pr-4">
                      <Badge color={overdue ? "red" : statusColor(invoice.status)}>
                        {overdue
                          ? "Overdue"
                          : (INVOICE_STATUSES.find((s) => s.value === invoice.status)?.label ?? invoice.status)}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {fmtCurrency(invoice.amount)}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {new Date(invoice.invoiceDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={overdue ? "text-red-400" : "text-slate-400"}>
                        {new Date(invoice.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {invoice.paidDate
                        ? new Date(invoice.paidDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {canMarkPaid && (
                          <button
                            onClick={() => markPaid(invoice.id)}
                            disabled={isPending}
                            title="Mark paid"
                            className="rounded p-1 text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(invoice)}
                            className="rounded p-1 text-slate-500 hover:text-white hover:bg-white/10"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => remove(invoice.id)}
                            className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
