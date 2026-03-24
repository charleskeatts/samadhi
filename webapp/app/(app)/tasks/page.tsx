import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = { title: "Tasks — Clairio CRM" };

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="mt-1 text-sm text-slate-400">Stay on top of follow-ups</p>
        </div>
        <Button><Plus className="h-4 w-4" /> New Task</Button>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
        Tasks list — coming in Step 4
      </div>
    </div>
  );
}
