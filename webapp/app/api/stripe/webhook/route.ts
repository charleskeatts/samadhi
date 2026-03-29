import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import type Stripe from "stripe";

export const config = { api: { bodyParser: false } };

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function stripeStatusToLocal(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "unpaid":
      return "canceled";
    default:
      return "trialing";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const accountId = session.metadata?.accountId;
      if (!accountId || session.mode !== "subscription") break;

      const subscriptionId = session.subscription as string;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      await prisma.account.update({
        where: { id: accountId },
        data: {
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: subscriptionId,
          subscriptionStatus: stripeStatusToLocal(subscription.status),
          trialEndsAt: null,
        },
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const account = await prisma.account.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!account) break;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          subscriptionStatus: stripeStatusToLocal(subscription.status),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const account = await prisma.account.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });
      if (!account) break;

      await prisma.account.update({
        where: { id: account.id },
        data: {
          subscriptionStatus: "canceled",
          stripeSubscriptionId: null,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const account = await prisma.account.findFirst({
        where: { stripeCustomerId: customerId },
      });
      if (!account) break;

      await prisma.account.update({
        where: { id: account.id },
        data: { subscriptionStatus: "past_due" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
