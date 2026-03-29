"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  subscriptionStatus: string;
  trialEndsAt: Date | null;
}

export function TrialBanner({ subscriptionStatus, trialEndsAt }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (dismissed) return null;

  const now = new Date();
  const daysLeft = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const showBanner =
    subscriptionStatus === "trialing" && daysLeft !== null && daysLeft <= 5;
  const isPastDue = subscriptionStatus === "past_due";
  const isCanceled = subscriptionStatus === "canceled";
  const isExpiredTrial =
    subscriptionStatus === "trialing" && daysLeft !== null && daysLeft <= 0;

  if (!showBanner && !isPastDue && !isCanceled && !isExpiredTrial) return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) router.push(data.url);
    } finally {
      setLoading(false);
    }
  }

  let message: string;
  let bgClass: string;

  if (isExpiredTrial || isCanceled) {
    message = "Your subscription has ended. Upgrade to continue using Clairio.";
    bgClass = "bg-red-950/80 border-red-800/50 text-red-200";
  } else if (isPastDue) {
    message = "Your payment failed. Please update your payment method to avoid losing access.";
    bgClass = "bg-orange-950/80 border-orange-800/50 text-orange-200";
  } else {
    message = `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;
    bgClass = "bg-yellow-950/80 border-yellow-800/50 text-yellow-200";
  }

  return (
    <div className={`flex items-center justify-between gap-4 border-b px-6 py-2 text-sm ${bgClass}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
        >
          {loading ? "Redirecting…" : isPastDue ? "Update payment" : "Upgrade now"}
        </button>
        {!isExpiredTrial && !isCanceled && (
          <button
            onClick={() => setDismissed(true)}
            className="text-current/60 hover:text-current transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
