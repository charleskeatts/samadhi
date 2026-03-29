import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { LinkButton } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { TaskRow } from "@/components/tasks/TaskRow";
import { CheckSquare, Plus } from "lucide-react";
import { clsx } from "clsx";

export const metadata = { title: "Tasks — Clairio CRM" };

type StatusFilter = "open" | "completed" | "all";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const accountId = await requireAccountId();
  const q = searchParams.q?.trim() || "";
  const statusFilter = (searchParams.status as StatusFilter) || "open";

  const statusWhere =
    statusFilter === "open" ? { status: "Open" } :
    statusFilter === "completed" ? { status: "Completed" } :
    {};

  const tasks = await prisma.task.findMany({
    where: {
      accountId,
      ...statusWhere,
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      contact: { select: { id: true, name: true } },
      deal: { select: { id: true, title: true } },
    },
    orderBy: [
      { status: "asc" },       // Open before Completed
      { dueDate: "asc" },      // Soonest first (nulls last handled by prisma)
      { createdAt: "desc" },
    ],
  });

  // Counts for tab badges
  const [openCount, overdueCount] = await Promise.all([
    prisma.task.count({ where: { accountId, status: "Open" } }),
    prisma.task.count({
      where: { accountId, status: "Open", dueDate: { lt: new Date() } },
    }),
  ]);

  const tabs: { label: string; value: StatusFilter; count?: number }[] = [
    { label: "Open", value: "open", count: openCount },
    { label: "Completed", value: "completed" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">
            {openCount} open{overdueCount > 0 && (
              <span className="ml-2 text-red-400 font-medium">· {overdueCount} overdue</span>
            )}
          </p>
        </div>
        <LinkButton href="/tasks/new">
          <Plus className="h-4 w-4" /> New Task
        </LinkButton>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/tasks?status=${tab.value}${q ? `&q=${q}` : ""}`}
              className={clsx(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={clsx(
                  "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                  statusFilter === tab.value ? "bg-white/20" : "bg-white/10"
                )}>
                  {tab.count}
                </span>
              )}
            </Link>
          ))}
        </div>
        <div className="flex-1 max-w-sm">
          <SearchInput placeholder="Search tasks…" />
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <CheckSquare className="h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {q ? "No tasks match your search" :
             statusFilter === "completed" ? "No completed tasks yet" :
             "No open tasks — you're all caught up!"}
          </p>
          {!q && statusFilter !== "completed" && (
            <LinkButton href="/tasks/new" size="sm" className="mt-4">
              <Plus className="h-4 w-4" /> Add a task
            </LinkButton>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs text-slate-500">
                <th className="pl-5 pr-3 py-3 w-8"></th>
                <th className="px-3 py-3 font-medium">Task</th>
                <th className="px-3 py-3 font-medium">Due date</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Deal</th>
                <th className="pl-3 pr-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  description={t.description}
                  status={t.status}
                  dueDate={t.dueDate}
                  contactName={t.contact?.name}
                  contactId={t.contact?.id}
                  dealTitle={t.deal?.title}
                  dealId={t.deal?.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
