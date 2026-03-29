"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, type KanbanDeal } from "./KanbanCard";
import { STAGES, type Stage, updateDealStage } from "@/app/actions/deals";

type Columns = Record<Stage, KanbanDeal[]>;

function buildColumns(deals: KanbanDeal[]): Columns {
  const cols = Object.fromEntries(STAGES.map((s) => [s, []])) as unknown as Columns;
  for (const deal of deals) {
    const stage = deal.stage as Stage;
    if (cols[stage]) cols[stage].push(deal);
  }
  return cols;
}

export function KanbanBoard({ deals }: { deals: KanbanDeal[] }) {
  const [columns, setColumns] = useState<Columns>(() => buildColumns(deals));
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findStage = useCallback(
    (id: string): Stage | null => {
      for (const stage of STAGES) {
        if (columns[stage].some((d) => d.id === id)) return stage;
      }
      return null;
    },
    [columns]
  );

  const activeDeal = activeId
    ? Object.values(columns).flat().find((d) => d.id === activeId)
    : null;

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const fromStage = findStage(active.id as string);
    if (!fromStage) return;

    // over could be a column id or a card id
    const toStage = (STAGES as readonly string[]).includes(over.id as string)
      ? (over.id as Stage)
      : findStage(over.id as string);

    if (!toStage || toStage === fromStage) return;

    setColumns((prev) => {
      const deal = prev[fromStage].find((d) => d.id === active.id)!;
      return {
        ...prev,
        [fromStage]: prev[fromStage].filter((d) => d.id !== active.id),
        [toStage]: [...prev[toStage], { ...deal, stage: toStage }],
      };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const fromStage = findStage(active.id as string);
    if (!fromStage) return;

    // Reorder within same column
    const toStage = (STAGES as readonly string[]).includes(over.id as string)
      ? (over.id as Stage)
      : findStage(over.id as string);

    if (toStage && toStage === fromStage) {
      const items = columns[fromStage];
      const oldIndex = items.findIndex((d) => d.id === active.id);
      const newIndex = items.findIndex((d) => d.id === over.id);
      if (oldIndex !== newIndex) {
        setColumns((prev) => ({
          ...prev,
          [fromStage]: arrayMove(prev[fromStage], oldIndex, newIndex),
        }));
      }
    }

    // Persist to DB (optimistic state already applied in onDragOver)
    const currentStage = findStage(active.id as string);
    if (currentStage) {
      updateDealStage(active.id as string, currentStage).catch(() => {
        // On error, reset to server state
        setColumns(buildColumns(deals));
      });
    }
  }

  const totalPipeline = STAGES
    .filter((s) => s !== "Won" && s !== "Lost")
    .flatMap((s) => columns[s])
    .reduce((sum, d) => sum + d.amount, 0);

  const wonValue = columns["Won"].reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-4">
      {/* Board summary */}
      <div className="flex items-center gap-6 text-sm text-slate-400">
        <span>
          Pipeline:{" "}
          <span className="font-semibold text-white">
            ${Math.round(totalPipeline).toLocaleString()}
          </span>
        </span>
        {wonValue > 0 && (
          <span>
            Won:{" "}
            <span className="font-semibold text-green-400">
              ${Math.round(wonValue).toLocaleString()}
            </span>
          </span>
        )}
        <span className="ml-auto text-xs text-slate-600">
          Drag cards between columns to update stage
        </span>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn key={stage} stage={stage} deals={columns[stage]} />
          ))}
        </div>

        {/* Ghost card shown while dragging */}
        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeDeal ? <KanbanCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
