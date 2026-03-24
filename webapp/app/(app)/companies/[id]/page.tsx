export const metadata = { title: "Company — Clairio CRM" };

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Company</h1>
      <p className="text-sm text-slate-400">ID: {params.id}</p>
      <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-500">
        Company detail — coming in Step 4
      </div>
    </div>
  );
}
