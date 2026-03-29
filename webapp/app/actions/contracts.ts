"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export type ContractData = {
  title: string;
  status: string;
  value: number;
  startDate: string;
  renewalDate?: string | null;
  autoRenews: boolean;
  notes?: string;
};

export async function createContract(companyId: string, data: ContractData) {
  const accountId = await requireAccountId();
  const company = await prisma.company.findFirst({ where: { id: companyId, accountId } });
  if (!company) throw new Error("Company not found");

  await prisma.contract.create({
    data: {
      accountId,
      companyId,
      title: data.title.trim(),
      status: data.status,
      value: data.value,
      startDate: new Date(data.startDate),
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      autoRenews: data.autoRenews,
      notes: data.notes?.trim() ?? "",
    },
  });
  revalidatePath(`/companies/${companyId}`);
}

export async function updateContract(id: string, data: ContractData) {
  const accountId = await requireAccountId();
  const contract = await prisma.contract.findFirst({ where: { id, accountId } });
  if (!contract) throw new Error("Not found");

  await prisma.contract.update({
    where: { id },
    data: {
      title: data.title.trim(),
      status: data.status,
      value: data.value,
      startDate: new Date(data.startDate),
      renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
      autoRenews: data.autoRenews,
      notes: data.notes?.trim() ?? "",
    },
  });
  revalidatePath(`/companies/${contract.companyId}`);
}

export async function deleteContract(id: string) {
  const accountId = await requireAccountId();
  const contract = await prisma.contract.findFirst({ where: { id, accountId } });
  if (!contract) throw new Error("Not found");

  await prisma.contract.delete({ where: { id } });
  revalidatePath(`/companies/${contract.companyId}`);
}
