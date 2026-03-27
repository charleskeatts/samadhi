"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export type CompanyData = {
  name: string;
  website?: string;
  industry?: string;
  notes?: string;
};

export async function createCompany(data: CompanyData) {
  const accountId = await requireAccountId();
  const company = await prisma.company.create({
    data: {
      accountId,
      name: data.name.trim(),
      website: data.website?.trim() || null,
      industry: data.industry?.trim() || null,
      notes: data.notes?.trim() || "",
    },
  });
  redirect(`/companies/${company.id}`);
}

export async function updateCompany(id: string, data: CompanyData) {
  const accountId = await requireAccountId();
  const company = await prisma.company.findFirst({ where: { id, accountId } });
  if (!company) throw new Error("Not found");

  await prisma.company.update({
    where: { id },
    data: {
      name: data.name.trim(),
      website: data.website?.trim() || null,
      industry: data.industry?.trim() || null,
      notes: data.notes?.trim() || "",
    },
  });
  revalidatePath(`/companies/${id}`);
  revalidatePath("/companies");
}

export async function deleteCompany(id: string) {
  const accountId = await requireAccountId();
  const company = await prisma.company.findFirst({ where: { id, accountId } });
  if (!company) throw new Error("Not found");
  await prisma.company.delete({ where: { id } });
  redirect("/companies");
}
