import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { TaskForm } from "@/components/tasks/TaskForm";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Edit Task — Clairio CRM" };

export default async function EditTaskPage({ params }: { params: { id: string } }) {
  const accountId = await requireAccountId();
  const [task, contacts, deals] = await Promise.all([
    prisma.task.findFirst({ where: { id: params.id, accountId } }),
    prisma.contact.findMany({ where: { accountId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.deal.findMany({
      where: { accountId },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!task) notFound();

  return (
    <div className="space-y-6">
      <Link href="/tasks" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Tasks
      </Link>
      <h1 className="text-2xl font-bold">Edit Task</h1>
      <TaskForm
        contacts={contacts}
        deals={deals}
        initial={{
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : "",
          status: task.status,
          contactId: task.contactId ?? "",
          dealId: task.dealId ?? "",
        }}
      />
    </div>
  );
}
