"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

interface DeleteButtonProps {
  action: () => Promise<void>;
  label?: string;
  confirm?: string;
}

export function DeleteButton({
  action,
  label = "Delete",
  confirm = "Are you sure? This cannot be undone.",
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(confirm)) return;
    startTransition(() => action());
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {isPending ? "Deleting…" : label}
    </button>
  );
}
