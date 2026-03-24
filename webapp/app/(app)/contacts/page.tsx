import { LinkButton } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = { title: "Contacts — Clairio CRM" };

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="mt-1 text-sm text-slate-400">All your people in one place</p>
        </div>
        <LinkButton href="/contacts/new"><Plus className="h-4 w-4" /> New Contact</LinkButton>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
        Contacts list — coming in Step 4
      </div>
    </div>
  );
}
