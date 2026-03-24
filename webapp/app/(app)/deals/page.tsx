import { LinkButton } from "@/components/ui/button";
import { Plus, LayoutGrid } from "lucide-react";

export const metadata = { title: "Deals — Clairio CRM" };

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="mt-1 text-sm text-slate-400">Your full pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/deals/board" variant="secondary"><LayoutGrid className="h-4 w-4" /> Board</LinkButton>
          <LinkButton href="/deals/new"><Plus className="h-4 w-4" /> New Deal</LinkButton>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
        Deals list — coming in Step 4
      </div>
    </div>
  );
}
