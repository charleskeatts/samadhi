import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth", "/api/stripe/webhook"];

export default auth(async function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!req.auth?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check subscription for app pages (skip billing page itself)
  if (!pathname.startsWith("/billing") && !pathname.startsWith("/api")) {
    const accountId = (req.auth.user as any).accountId as string;
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { subscriptionStatus: true, trialEndsAt: true },
    });

    const now = new Date();
    const isTrialing =
      account?.subscriptionStatus === "trialing" &&
      account?.trialEndsAt &&
      account.trialEndsAt > now;
    const isActive = account?.subscriptionStatus === "active";

    if (!isTrialing && !isActive) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
