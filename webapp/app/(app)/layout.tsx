import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import { TrialBanner } from "@/components/layout/TrialBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accountId = (session.user as any).accountId as string;
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { name: true, subscriptionStatus: true, trialEndsAt: true },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        accountName={account?.name ?? "My Company"}
        userEmail={session.user.email ?? ""}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TrialBanner
          subscriptionStatus={account?.subscriptionStatus ?? "trialing"}
          trialEndsAt={account?.trialEndsAt ?? null}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
