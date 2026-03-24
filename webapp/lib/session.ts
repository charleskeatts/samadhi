import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

/** Returns the accountId from the current session, redirects to login if missing. */
export async function requireAccountId(): Promise<string> {
  const session = await requireSession();
  const accountId = (session.user as any).accountId as string | undefined;
  if (!accountId) redirect("/login");
  return accountId;
}
