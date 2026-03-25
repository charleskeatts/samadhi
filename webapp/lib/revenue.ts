import { prisma } from "@/lib/db";

/** Returns the first day of a month as a UTC Date. */
export function monthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

/** Returns the current month's start date. */
export function currentMonthStart(): Date {
  const now = new Date();
  return monthStart(now.getUTCFullYear(), now.getUTCMonth() + 1);
}

// ── Per-company calculations ────────────────────────────────────────────────

/**
 * Customer MRR for a given company in a given month.
 * Sum of all active subscriptions' monthlyAmount where:
 *   - startDate <= end of month
 *   - endDate is null OR endDate > start of month
 */
export async function getCompanyMrr(
  accountId: string,
  companyId: string,
  month: Date = currentMonthStart()
): Promise<number> {
  const endOfMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  const subs = await prisma.subscription.findMany({
    where: {
      accountId,
      companyId,
      isActive: true,
      startDate: { lte: endOfMonth },
      OR: [{ endDate: null }, { endDate: { gt: month } }],
    },
    select: { monthlyAmount: true },
  });

  return subs.reduce((sum, s) => sum + s.monthlyAmount, 0);
}

/** Customer ARR = 12 × MRR. */
export async function getCompanyArr(
  accountId: string,
  companyId: string,
  month?: Date
): Promise<number> {
  return (await getCompanyMrr(accountId, companyId, month)) * 12;
}

// ── Account-wide aggregates ────────────────────────────────────────────────

export interface AccountRevenueMetrics {
  totalMrr: number;
  totalArr: number;
  totalUsageRevenue: number;
  totalRevenue: number;
}

/**
 * Aggregate MRR/ARR/usage across all companies for an Account in a given month.
 * MRR is computed live from active subscriptions.
 * Usage revenue is summed from RevenueSnapshot rows for that month.
 */
export async function getAccountRevenueMetrics(
  accountId: string,
  month: Date = currentMonthStart()
): Promise<AccountRevenueMetrics> {
  const endOfMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  // Live MRR from subscriptions
  const subs = await prisma.subscription.findMany({
    where: {
      accountId,
      isActive: true,
      startDate: { lte: endOfMonth },
      OR: [{ endDate: null }, { endDate: { gt: month } }],
    },
    select: { monthlyAmount: true },
  });
  const totalMrr = subs.reduce((sum, s) => sum + s.monthlyAmount, 0);

  // Usage revenue from snapshots
  const snapshots = await prisma.revenueSnapshot.findMany({
    where: { accountId, month },
    select: { usageRevenue: true },
  });
  const totalUsageRevenue = snapshots.reduce((sum, s) => sum + s.usageRevenue, 0);

  return {
    totalMrr,
    totalArr: totalMrr * 12,
    totalUsageRevenue,
    totalRevenue: totalMrr + totalUsageRevenue,
  };
}

// ── Snapshot generation ────────────────────────────────────────────────────

/**
 * Upsert a RevenueSnapshot for a given company + month.
 * Calculates endingMrr live; beginningMrr comes from the previous month's snapshot.
 * Pass usageRevenue explicitly (entered by the user).
 */
export async function upsertRevenueSnapshot(
  accountId: string,
  companyId: string,
  month: Date,
  usageRevenue: number
): Promise<void> {
  const endingMrr = await getCompanyMrr(accountId, companyId, month);

  // Previous month
  const prevMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() - 1, 1)
  );
  const prev = await prisma.revenueSnapshot.findUnique({
    where: { accountId_companyId_month: { accountId, companyId, month: prevMonth } },
    select: { endingMrr: true },
  });
  const beginningMrr = prev?.endingMrr ?? 0;

  await prisma.revenueSnapshot.upsert({
    where: { accountId_companyId_month: { accountId, companyId, month } },
    create: {
      accountId,
      companyId,
      month,
      beginningMrr,
      endingMrr,
      usageRevenue,
      totalRevenue: endingMrr + usageRevenue,
    },
    update: {
      beginningMrr,
      endingMrr,
      usageRevenue,
      totalRevenue: endingMrr + usageRevenue,
    },
  });
}

// ── Per-company history ────────────────────────────────────────────────────

export async function getCompanyRevenueHistory(
  accountId: string,
  companyId: string,
  limitMonths = 12
) {
  return prisma.revenueSnapshot.findMany({
    where: { accountId, companyId },
    orderBy: { month: "desc" },
    take: limitMonths,
  });
}
