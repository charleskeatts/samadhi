import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const accountId = (session.user as any).accountId as string;
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { name: true },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        accountName={account?.name ?? "My Company"}
        userEmail={session.user.email ?? ""}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
