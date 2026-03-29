import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { TaskForm } from "@/components/tasks/TaskForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "New Task — Clairio CRM" };

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: { contactId?: string; dealId?: string };
}) {
  const accountId = await requireAccountId();
  const [contacts, deals] = await Promise.all([
    prisma.contact.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.deal.findMany({
      where: { accountId, stage: { notIn: ["Won", "Lost"] } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Tasks
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New Task</h1>
        <p className="mt-1 text-sm text-slate-400">Add a follow-up or action item</p>
      </div>
      <TaskForm
        contacts={contacts}
        deals={deals}
        defaultContactId={searchParams.contactId}
        defaultDealId={searchParams.dealId}
      />
    </div>
  );
}
