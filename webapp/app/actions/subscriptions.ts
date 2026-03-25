"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAccountId } from "@/lib/session";

export type SubscriptionFormData = {
  name: string;
  pricingModel: string;
  monthlyRecurringAmount: number;
  annualRecurringAmount?: number | null;
  seats?: number | null;
  unitPrice?: number | null;
  contractStartDate: string; // ISO date string
  contractEndDate?: string | null;
  isActive: boolean;
  notes?: string;
};

export async function createSubscription(companyId: string, data: SubscriptionFormData) {
  const accountId = await requireAccountId();

  // Verify company belongs to this account
  const company = await prisma.company.findFirst({ where: { id: companyId, accountId } });
  if (!company) throw new Error("Company not found");

  const annual =
    data.annualRecurringAmount != null
      ? data.annualRecurringAmount
      : data.monthlyRecurringAmount * 12;

  await prisma.subscription.create({
    data: {
      accountId,
      companyId,
      name: data.name,
      pricingModel: data.pricingModel,
      monthlyRecurringAmount: data.monthlyRecurringAmount,
      annualRecurringAmount: annual,
      seats: data.seats ?? null,
      unitPrice: data.unitPrice ?? null,
      contractStartDate: new Date(data.contractStartDate),
      contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
      isActive: data.isActive,
      notes: data.notes ?? "",
    },
  });

  revalidatePath(`/companies/${companyId}`);
}

export async function updateSubscription(
  subscriptionId: string,
  data: Partial<SubscriptionFormData>
) {
  const accountId = await requireAccountId();

  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, accountId },
  });
  if (!sub) throw new Error("Subscription not found");

  const annual =
    data.annualRecurringAmount != null
      ? data.annualRecurringAmount
      : data.monthlyRecurringAmount != null
      ? data.monthlyRecurringAmount * 12
      : undefined;

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.pricingModel && { pricingModel: data.pricingModel }),
      ...(data.monthlyRecurringAmount != null && {
        monthlyRecurringAmount: data.monthlyRecurringAmount,
      }),
      ...(annual != null && { annualRecurringAmount: annual }),
      ...(data.seats !== undefined && { seats: data.seats }),
      ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
      ...(data.contractStartDate && { contractStartDate: new Date(data.contractStartDate) }),
      ...(data.contractEndDate !== undefined && {
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : null,
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });

  revalidatePath(`/companies/${sub.companyId}`);
}

export async function deleteSubscription(subscriptionId: string) {
  const accountId = await requireAccountId();

  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, accountId },
  });
  if (!sub) throw new Error("Subscription not found");

  await prisma.subscription.delete({ where: { id: subscriptionId } });

  revalidatePath(`/companies/${sub.companyId}`);
}
