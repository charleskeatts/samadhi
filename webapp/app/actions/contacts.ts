"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export type ContactData = {
  name: string;
  email?: string;
  phone?: string;
  companyId?: string | null;
  tags?: string;
  notes?: string;
};

export async function createContact(data: ContactData) {
  const accountId = await requireAccountId();
  const contact = await prisma.contact.create({
    data: {
      accountId,
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      companyId: data.companyId || null,
      tags: data.tags?.trim() || "",
      notes: data.notes?.trim() || "",
    },
  });
  redirect(`/contacts/${contact.id}`);
}

export async function updateContact(id: string, data: ContactData) {
  const accountId = await requireAccountId();
  const contact = await prisma.contact.findFirst({ where: { id, accountId } });
  if (!contact) throw new Error("Not found");

  await prisma.contact.update({
    where: { id },
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      companyId: data.companyId || null,
      tags: data.tags?.trim() || "",
      notes: data.notes?.trim() || "",
    },
  });
  revalidatePath(`/contacts/${id}`);
  revalidatePath("/contacts");
}

export async function deleteContact(id: string) {
  const accountId = await requireAccountId();
  const contact = await prisma.contact.findFirst({ where: { id, accountId } });
  if (!contact) throw new Error("Not found");
  await prisma.contact.delete({ where: { id } });
  redirect("/contacts");
}
