import { clsx } from "clsx";
import type { DraggableAttributes } from "@dnd-kit/core";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyntheticListenerMap = Record<string, (...args: any[]) => void>;
import { fmtCurrency } from "@/lib/revenue";
import { GripVertical, Calendar } from "lucide-react";

export interface KanbanDeal {
  id: string;
  title: string;
  amount: number;
  stage: string;
  closeDate: Date | null;
  contactName: string;
  companyName: string | null;
}

interface Props {
  deal: KanbanDeal;
  isDragging?: boolean;
  listeners?: SyntheticListenerMap | undefined;
  attributes?: DraggableAttributes;
  setNodeRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
}

const now = new Date();
const soon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

export function KanbanCard({
  deal,
  isDragging,
  listeners,
  attributes,
  setNodeRef,
  style,
}: Props) {
  const isOverdue = deal.closeDate && deal.closeDate < now;
  const isDueSoon = !isOverdue && deal.closeDate && deal.closeDate < soon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={clsx(
        "group rounded-lg border bg-slate-900 p-3 shadow-sm transition-shadow select-none",
        isDragging
          ? "border-indigo-500 shadow-xl shadow-indigo-900/30 opacity-90 rotate-1"
          : "border-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          {...listeners}
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-medium text-white leading-snug">{deal.title}</p>

          <p className="text-xs text-slate-400 truncate">{deal.contactName}</p>

          {deal.companyName && (
            <p className="text-xs text-slate-500 truncate">{deal.companyName}</p>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold tabular-nums text-indigo-300">
              {fmtCurrency(deal.amount)}
            </span>

            {deal.closeDate && (
              <span
                className={clsx(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-400" : isDueSoon ? "text-yellow-400" : "text-slate-500"
                )}
              >
                <Calendar className="h-3 w-3" />
                {deal.closeDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
