"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, AlertCircle, CreditCard, Clock, Zap } from "lucide-react";

interface BillingInfo {
  subscriptionStatus: string;
  trialEndsAt: string | null;
  stripeSubscriptionId: string | null;
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const success = searchParams.get("success") === "1";
  const canceled = searchParams.get("canceled") === "1";

  useEffect(() => {
    fetch("/api/billing/info")
      .then((r) => r.json())
      .then((data) => {
        setBilling(data);
        setLoading(false);
      });
  }, []);

  async function handleUpgrade() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) router.push(data.url);
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePortal() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) router.push(data.url);
    } finally {
      setActionLoading(false);
    }
  }

  const status = billing?.subscriptionStatus ?? "trialing";
  const trialEndsAt = billing?.trialEndsAt ? new Date(billing.trialEndsAt) : null;
  const now = new Date();
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-1 text-sm text-slate-400">Manage your Clairio subscription</p>
      </div>

      {/* Flash messages */}
      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-700/50 bg-green-900/20 p-4 text-sm text-green-300">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          Your subscription is now active. Welcome to Clairio!
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 text-sm text-slate-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          Checkout was canceled. Your subscription was not changed.
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
          Loading billing info…
        </div>
      ) : (
        <>
          {/* Status card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                  Subscription status
                </p>
                <StatusBadge status={status} daysLeft={daysLeft} />
              </div>

              {status === "active" && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Active</span>
                </div>
              )}
            </div>

            {/* Trial countdown */}
            {status === "trialing" && daysLeft !== null && daysLeft > 0 && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-yellow-900/20 border border-yellow-800/30 px-4 py-3">
                <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                <span className="text-sm text-yellow-300">
                  Your free trial ends in <strong>{daysLeft} day{daysLeft === 1 ? "" : "s"}</strong>.
                  {" "}Upgrade to keep full access.
                </span>
              </div>
            )}

            {/* Past due warning */}
            {status === "past_due" && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-orange-900/20 border border-orange-800/30 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                <span className="text-sm text-orange-300">
                  Your last payment failed. Update your payment method to avoid losing access.
                </span>
              </div>
            )}

            {/* Canceled */}
            {(status === "canceled" || (status === "trialing" && daysLeft !== null && daysLeft <= 0)) && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-900/20 border border-red-800/30 px-4 py-3">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">
                  Your access has ended. Upgrade to restore full access to Clairio.
                </span>
              </div>
            )}
          </div>

          {/* Plan details */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Clairio CRM — Pro Plan</h2>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                "Unlimited contacts, companies & deals",
                "Kanban pipeline board",
                "Revenue & MRR tracking",
                "Task management",
                "Full API access",
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {status === "active" || status === "past_due" ? (
              <button
                onClick={handlePortal}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4" />
                {actionLoading ? "Redirecting…" : "Manage subscription"}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
              >
                <Zap className="h-4 w-4" />
                {actionLoading ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status, daysLeft }: { status: string; daysLeft: number | null }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-900/40 px-3 py-1 text-sm font-medium text-green-300 border border-green-700/40">
        Active
      </span>
    );
  }
  if (status === "trialing") {
    const expired = daysLeft !== null && daysLeft <= 0;
    return (
      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${
        expired
          ? "bg-red-900/40 text-red-300 border-red-700/40"
          : "bg-yellow-900/40 text-yellow-300 border-yellow-700/40"
      }`}>
        {expired ? "Trial expired" : `Trial — ${daysLeft}d left`}
      </span>
    );
  }
  if (status === "past_due") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-900/40 px-3 py-1 text-sm font-medium text-orange-300 border border-orange-700/40">
        Past due
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-900/40 px-3 py-1 text-sm font-medium text-red-300 border border-red-700/40">
      Canceled
    </span>
  );
}
