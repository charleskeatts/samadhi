export const metadata = { title: "Dashboard — Clairio CRM" };

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Welcome back. Here&apos;s what needs your attention today.</p>
      </div>

      {/* Placeholders — wired in Step 5 */}
      <div className="grid grid-cols-3 gap-4">
        {["Today's Tasks", "Pipeline Summary", "Recent Activity"].map((label) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-medium text-slate-400">{label}</p>
            <p className="mt-6 text-xs text-slate-600">Coming in Step 5</p>
          </div>
        ))}
      </div>
    </div>
  );
}
