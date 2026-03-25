"use server";

import { revalidatePath } from "next/cache";
import { requireAccountId } from "@/lib/session";
import { upsertRevenueSnapshot, monthStart } from "@/lib/revenue";

/**
 * Log (or update) usage revenue for a given company and month.
 * Called from the Company detail page "Log usage revenue" form.
 */
export async function logUsageRevenue(
  companyId: string,
  year: number,
  month: number,
  monthlyUsageRevenue: number
) {
  const accountId = await requireAccountId();
  const monthDate = monthStart(year, month);
  await upsertRevenueSnapshot(accountId, companyId, monthDate, monthlyUsageRevenue);
  revalidatePath(`/companies/${companyId}`);
}
