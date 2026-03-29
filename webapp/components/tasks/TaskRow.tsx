"use client";

import { useTransition } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import { toggleTaskStatus, deleteTask } from "@/app/actions/tasks";
import { Trash2, Pencil } from "lucide-react";

interface TaskRowProps {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: Date | null;
  contactName?: string | null;
  contactId?: string | null;
  dealTitle?: string | null;
  dealId?: string | null;
}

export function TaskRow({
  id, title, description, status, dueDate,
  contactName, contactId, dealTitle, dealId,
}: TaskRowProps) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = status === "Completed";
  const now = new Date();
  const isOverdue = !isCompleted && dueDate !== null && dueDate < now;

  function toggle() {
    startTransition(() => toggleTaskStatus(id));
  }

  function remove() {
    if (!confirm("Delete this task?")) return;
    startTransition(() => deleteTask(id));
  }

  return (
    <tr className={clsx("group transition-colors", isCompleted ? "opacity-50" : "hover:bg-white/5")}>
      {/* Checkbox */}
      <td className="pl-5 pr-3 py-3.5 w-8">
        <button
          onClick={toggle}
          disabled={isPending}
          aria-label={isCompleted ? "Mark open" : "Mark complete"}
          className={clsx(
            "h-4.5 w-4.5 flex items-center justify-center rounded border transition-colors",
            isCompleted
              ? "bg-indigo-600 border-indigo-600 text-white"
              : "border-white/30 hover:border-indigo-500"
          )}
        >
          {isCompleted && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </td>

      {/* Title + description */}
      <td className="px-3 py-3.5">
        <Link href={`/tasks/${id}/edit`}
          className={clsx("text-sm font-medium hover:text-indigo-400 transition-colors",
            isCompleted ? "line-through text-slate-500" : "text-white")}>
          {title}
        </Link>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{description}</p>
        )}
      </td>

      {/* Due date */}
      <td className="px-3 py-3.5 text-sm">
        {dueDate ? (
          <span className={clsx("tabular-nums", isOverdue ? "text-red-400 font-medium" : "text-slate-400")}>
            {isOverdue && "⚠ "}
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Linked contact */}
      <td className="px-3 py-3.5 text-sm">
        {contactId && contactName ? (
          <Link href={`/contacts/${contactId}`} className="text-slate-400 hover:text-indigo-400">
            {contactName}
          </Link>
        ) : <span className="text-slate-600">—</span>}
      </td>

      {/* Linked deal */}
      <td className="px-3 py-3.5 text-sm">
        {dealId && dealTitle ? (
          <Link href={`/deals/${dealId}`} className="text-slate-400 hover:text-indigo-400 truncate max-w-[12rem] block">
            {dealTitle}
          </Link>
        ) : <span className="text-slate-600">—</span>}
      </td>

      {/* Actions */}
      <td className="pl-3 pr-5 py-3.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/tasks/${id}/edit`}
            className="rounded p-1 text-slate-500 hover:text-white hover:bg-white/10">
            <Pencil className="h-3.5 w-3.5" />
          </Link>
          <button onClick={remove} disabled={isPending}
            className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
