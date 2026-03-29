import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accountId = (session.user as any).accountId as string;
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: {
      subscriptionStatus: true,
      trialEndsAt: true,
      stripeSubscriptionId: true,
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(account);
}
