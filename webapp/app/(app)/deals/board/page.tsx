import { LinkButton } from "@/components/ui/button";
import { List } from "lucide-react";

export const metadata = { title: "Pipeline Board — Clairio CRM" };

export default function DealsBoardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline Board</h1>
          <p className="mt-1 text-sm text-slate-400">Drag deals between stages</p>
        </div>
        <LinkButton href="/deals" variant="secondary"><List className="h-4 w-4" /> List View</LinkButton>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
        Kanban board — coming in Step 5
      </div>
    </div>
  );
}
