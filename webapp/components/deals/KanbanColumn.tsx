import { useDroppable, type DraggableAttributes } from "@dnd-kit/core";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SyntheticListenerMap = Record<string, (...args: any[]) => void>;
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { KanbanCard, type KanbanDeal } from "./KanbanCard";
import { fmtCurrency } from "@/lib/revenue";

const STAGE_STYLES: Record<string, { dot: string; header: string }> = {
  Lead:        { dot: "bg-indigo-500", header: "text-indigo-400" },
  Qualified:   { dot: "bg-blue-500",   header: "text-blue-400" },
  Proposal:    { dot: "bg-yellow-500", header: "text-yellow-400" },
  Negotiation: { dot: "bg-purple-500", header: "text-purple-400" },
  Won:         { dot: "bg-green-500",  header: "text-green-400" },
  Lost:        { dot: "bg-red-500",    header: "text-red-400" },
};

function SortableCard({ deal }: { deal: KanbanDeal }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: deal.id });

  return (
    <KanbanCard
      deal={deal}
      isDragging={isDragging}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      listeners={listeners as any}
      attributes={attributes}
      setNodeRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
      }}
    />
  );
}

interface Props {
  stage: string;
  deals: KanbanDeal[];
}

export function KanbanColumn({ stage, deals }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const style = STAGE_STYLES[stage] ?? { dot: "bg-slate-500", header: "text-slate-400" };
  const totalValue = deals.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex w-64 flex-shrink-0 flex-col">
      {/* Column header */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={clsx("h-2 w-2 rounded-full", style.dot)} />
          <span className={clsx("text-sm font-semibold", style.header)}>{stage}</span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-xs text-slate-400">
            {deals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs text-slate-500 tabular-nums">{fmtCurrency(totalValue)}</span>
        )}
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={clsx(
          "flex flex-1 flex-col gap-2 rounded-xl border p-2 min-h-[200px] transition-colors",
          isOver
            ? "border-indigo-500/50 bg-indigo-900/10"
            : "border-white/10 bg-white/[0.02]"
        )}
      >
        <SortableContext
          items={deals.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          {deals.map((deal) => (
            <SortableCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-xs text-slate-700">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
