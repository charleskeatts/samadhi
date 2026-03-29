"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export type InvoiceData = {
  number: string;
  status: string;
  amount: number;
  invoiceDate: string;
  dueDate: string;
  paidDate?: string | null;
  notes?: string;
};

export async function createInvoice(companyId: string, data: InvoiceData) {
  const accountId = await requireAccountId();
  const company = await prisma.company.findFirst({ where: { id: companyId, accountId } });
  if (!company) throw new Error("Company not found");

  await prisma.invoice.create({
    data: {
      accountId,
      companyId,
      number: data.number.trim(),
      status: data.status,
      amount: data.amount,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
      notes: data.notes?.trim() ?? "",
    },
  });
  revalidatePath(`/companies/${companyId}`);
}

export async function updateInvoice(id: string, data: InvoiceData) {
  const accountId = await requireAccountId();
  const invoice = await prisma.invoice.findFirst({ where: { id, accountId } });
  if (!invoice) throw new Error("Not found");

  await prisma.invoice.update({
    where: { id },
    data: {
      number: data.number.trim(),
      status: data.status,
      amount: data.amount,
      invoiceDate: new Date(data.invoiceDate),
      dueDate: new Date(data.dueDate),
      paidDate: data.paidDate ? new Date(data.paidDate) : null,
      notes: data.notes?.trim() ?? "",
    },
  });
  revalidatePath(`/companies/${invoice.companyId}`);
}

export async function markInvoicePaid(id: string) {
  const accountId = await requireAccountId();
  const invoice = await prisma.invoice.findFirst({ where: { id, accountId } });
  if (!invoice) throw new Error("Not found");

  await prisma.invoice.update({
    where: { id },
    data: { status: "paid", paidDate: new Date() },
  });
  revalidatePath(`/companies/${invoice.companyId}`);
  revalidatePath("/dashboard");
}

export async function deleteInvoice(id: string) {
  const accountId = await requireAccountId();
  const invoice = await prisma.invoice.findFirst({ where: { id, accountId } });
  if (!invoice) throw new Error("Not found");

  await prisma.invoice.delete({ where: { id } });
  revalidatePath(`/companies/${invoice.companyId}`);
}
