"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
export type Stage = (typeof STAGES)[number];

export type DealData = {
  title: string;
  contactId: string;
  companyId?: string | null;
  amount: number;
  stage: string;
  closeDate?: string | null;
  notes?: string;
};

export async function createDeal(data: DealData) {
  const accountId = await requireAccountId();
  const deal = await prisma.deal.create({
    data: {
      accountId,
      title: data.title.trim(),
      contactId: data.contactId,
      companyId: data.companyId || null,
      amount: data.amount,
      stage: data.stage,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      notes: data.notes?.trim() || "",
    },
  });
  redirect(`/deals/${deal.id}`);
}

export async function updateDeal(id: string, data: DealData) {
  const accountId = await requireAccountId();
  const deal = await prisma.deal.findFirst({ where: { id, accountId } });
  if (!deal) throw new Error("Not found");

  await prisma.deal.update({
    where: { id },
    data: {
      title: data.title.trim(),
      contactId: data.contactId,
      companyId: data.companyId || null,
      amount: data.amount,
      stage: data.stage,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      notes: data.notes?.trim() || "",
    },
  });
  revalidatePath(`/deals/${id}`);
  revalidatePath("/deals");
}

/** Called by the Kanban board on drag-end. */
export async function updateDealStage(id: string, stage: Stage) {
  const accountId = await requireAccountId();
  const deal = await prisma.deal.findFirst({ where: { id, accountId } });
  if (!deal) throw new Error("Not found");
  await prisma.deal.update({ where: { id }, data: { stage } });
  revalidatePath("/deals/board");
  revalidatePath("/deals");
}

export async function deleteDeal(id: string) {
  const accountId = await requireAccountId();
  const deal = await prisma.deal.findFirst({ where: { id, accountId } });
  if (!deal) throw new Error("Not found");
  await prisma.deal.delete({ where: { id } });
  redirect("/deals");
}
