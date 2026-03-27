import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";
import { LinkButton } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Plus, User } from "lucide-react";

export const metadata = { title: "Contacts — Clairio CRM" };

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const accountId = await requireAccountId();
  const q = searchParams.q?.trim() || "";

  const contacts = await prisma.contact.findMany({
    where: {
      accountId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    include: { company: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="mt-1 text-sm text-slate-400">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
            {q && ` matching "${q}"`}
          </p>
        </div>
        <LinkButton href="/contacts/new">
          <Plus className="h-4 w-4" /> New Contact
        </LinkButton>
      </div>

      <SearchInput placeholder="Search by name, email, or tag…" />

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-16 text-center">
          <User className="h-8 w-8 text-slate-600 mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {q ? "No contacts match your search" : "No contacts yet"}
          </p>
          {!q && (
            <LinkButton href="/contacts/new" size="sm" className="mt-4">
              <Plus className="h-4 w-4" /> Add your first contact
            </LinkButton>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr className="text-left text-xs text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contacts.map((c) => (
                <tr
                  key={c.id}
                  className="group hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-medium text-white group-hover:text-indigo-400"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-400">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-slate-400">{c.phone || "—"}</td>
                  <td className="px-5 py-3">
                    {c.company ? (
                      <Link
                        href={`/companies/${c.company.id}`}
                        className="text-slate-300 hover:text-indigo-400"
                      >
                        {c.company.name}
                      </Link>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags
                        ? c.tags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                            <Badge key={tag} color="indigo">{tag}</Badge>
                          ))
                        : <span className="text-slate-600">—</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
