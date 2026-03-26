import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth", "/api/stripe/webhook"];

// Subscription statuses that grant access
const ACTIVE_STATUSES = new Set(["trialing", "active"]);

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Require auth
  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Subscription gate — stored in JWT token by the auth callback.
  // Billing page and all API routes are exempt.
  if (!pathname.startsWith("/billing") && !pathname.startsWith("/api")) {
    const status = (req.auth as any).subscriptionStatus as string | undefined;
    const trialEnd = (req.auth as any).trialEndsAt as string | undefined;

    const isTrialing =
      status === "trialing" && trialEnd && new Date(trialEnd) > new Date();
    const isActive = status === "active";

    if (!isTrialing && !isActive) {
      return NextResponse.redirect(new URL("/billing", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
