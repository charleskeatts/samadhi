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

/** Format a Date as "Jan 2026" */
export function fmtMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** Format a number as USD currency string, e.g. "$1,234.00" */
export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ── Per-company calculations ──────────────────────────────────────────────────

/**
 * Customer MRR for a given company in a given month.
 * Sum of monthlyRecurringAmount across active subscriptions covering that month.
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
      contractStartDate: { lte: endOfMonth },
      OR: [{ contractEndDate: null }, { contractEndDate: { gt: month } }],
    },
    select: { monthlyRecurringAmount: true },
  });

  return subs.reduce((sum, s) => sum + s.monthlyRecurringAmount, 0);
}

/** Customer ARR = 12 × MRR. */
export async function getCompanyArr(
  accountId: string,
  companyId: string,
  month?: Date
): Promise<number> {
  return (await getCompanyMrr(accountId, companyId, month)) * 12;
}

// ── Account-wide aggregates ───────────────────────────────────────────────────

export interface AccountRevenueMetrics {
  totalMrr: number;
  totalArr: number;
  totalUsageRevenue: number;
  totalRevenue: number;
}

/**
 * Aggregate MRR/ARR/usage across all companies for the month.
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

  const subs = await prisma.subscription.findMany({
    where: {
      accountId,
      isActive: true,
      contractStartDate: { lte: endOfMonth },
      OR: [{ contractEndDate: null }, { contractEndDate: { gt: month } }],
    },
    select: { monthlyRecurringAmount: true },
  });
  const totalMrr = subs.reduce((sum, s) => sum + s.monthlyRecurringAmount, 0);

  const snapshots = await prisma.revenueSnapshot.findMany({
    where: { accountId, month },
    select: { monthlyUsageRevenue: true },
  });
  const totalUsageRevenue = snapshots.reduce((sum, s) => sum + s.monthlyUsageRevenue, 0);

  return {
    totalMrr,
    totalArr: totalMrr * 12,
    totalUsageRevenue,
    totalRevenue: totalMrr + totalUsageRevenue,
  };
}

/** Top N companies by current MRR for the Dashboard table. */
export async function getTopCompaniesByMrr(
  accountId: string,
  month: Date = currentMonthStart(),
  limit = 5
) {
  const endOfMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  // Group active subscriptions by company
  const rows = await prisma.subscription.groupBy({
    by: ["companyId"],
    where: {
      accountId,
      isActive: true,
      contractStartDate: { lte: endOfMonth },
      OR: [{ contractEndDate: null }, { contractEndDate: { gt: month } }],
    },
    _sum: { monthlyRecurringAmount: true },
    orderBy: { _sum: { monthlyRecurringAmount: "desc" } },
    take: limit,
  });

  // Fetch company names + usage snapshots
  const companyIds = rows.map((r) => r.companyId);
  const [companies, snapshots] = await Promise.all([
    prisma.company.findMany({ where: { id: { in: companyIds } }, select: { id: true, name: true } }),
    prisma.revenueSnapshot.findMany({
      where: { accountId, companyId: { in: companyIds }, month },
      select: { companyId: true, monthlyUsageRevenue: true, totalRevenue: true },
    }),
  ]);

  const companyMap = Object.fromEntries(companies.map((c) => [c.id, c.name]));
  const snapshotMap = Object.fromEntries(
    snapshots.map((s) => [s.companyId, s])
  );

  return rows.map((r) => {
    const mrr = r._sum.monthlyRecurringAmount ?? 0;
    const snap = snapshotMap[r.companyId];
    return {
      companyId: r.companyId,
      companyName: companyMap[r.companyId] ?? "Unknown",
      mrr,
      arr: mrr * 12,
      usageRevenue: snap?.monthlyUsageRevenue ?? 0,
      totalRevenue: snap?.totalRevenue ?? mrr,
    };
  });
}

// ── Snapshot generation ───────────────────────────────────────────────────────

/**
 * Upsert a RevenueSnapshot for a given company + month.
 * Calculates endingMrr live from active subscriptions.
 * beginningMrr is taken from the previous month's snapshot (0 if none).
 */
export async function upsertRevenueSnapshot(
  accountId: string,
  companyId: string,
  month: Date,
  monthlyUsageRevenue: number
): Promise<void> {
  const endingMrr = await getCompanyMrr(accountId, companyId, month);

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
      monthlyUsageRevenue,
      totalRecurringRevenue: endingMrr,
      totalRevenue: endingMrr + monthlyUsageRevenue,
    },
    update: {
      beginningMrr,
      endingMrr,
      monthlyUsageRevenue,
      totalRecurringRevenue: endingMrr,
      totalRevenue: endingMrr + monthlyUsageRevenue,
    },
  });
}

// ── Per-company history ───────────────────────────────────────────────────────

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
