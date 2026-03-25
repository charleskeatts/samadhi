/**
 * Seed file — run with: npm run db:seed
 *
 * Creates one Account with demo companies, subscriptions, and revenue snapshots
 * matching the example payloads from the spec.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Account ────────────────────────────────────────────────────────────────
  const account = await prisma.account.upsert({
    where: { stripeCustomerId: "seed_account" },
    update: {},
    create: {
      name: "Acme Corp",
      stripeCustomerId: "seed_account",
      subscriptionStatus: "trialing",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  // ── Owner user ─────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      accountId: account.id,
      name: "Demo User",
      email: "demo@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      role: "owner",
    },
  });

  // ── Companies ──────────────────────────────────────────────────────────────
  const companyAlpha = await prisma.company.upsert({
    where: { id: "seed_company_alpha" },
    update: { name: "Alpha Technologies" },
    create: {
      id: "seed_company_alpha",
      accountId: account.id,
      name: "Alpha Technologies",
      website: "https://alpha.example.com",
      industry: "SaaS",
      notes: "Our flagship customer. Expanding seat count Q2.",
    },
  });

  const companyBeta = await prisma.company.upsert({
    where: { id: "seed_company_beta" },
    update: { name: "Beta Logistics" },
    create: {
      id: "seed_company_beta",
      accountId: account.id,
      name: "Beta Logistics",
      website: "https://beta.example.com",
      industry: "Logistics",
      notes: "Usage-based add-on growing month over month.",
    },
  });

  const companyGamma = await prisma.company.upsert({
    where: { id: "seed_company_gamma" },
    update: { name: "Gamma Retail" },
    create: {
      id: "seed_company_gamma",
      accountId: account.id,
      name: "Gamma Retail",
      website: "https://gamma.example.com",
      industry: "Retail",
      notes: "Annual contract signed Jan 2026.",
    },
  });

  // ── Subscriptions ──────────────────────────────────────────────────────────

  // Alpha — two active subscriptions (matches example JSON in spec)
  await prisma.subscription.upsert({
    where: { id: "seed_sub_alpha_pro" },
    update: {},
    create: {
      id: "seed_sub_alpha_pro",
      accountId: account.id,
      companyId: companyAlpha.id,
      name: "Pro Plan – 10 seats",
      pricingModel: "seat_based",
      monthlyRecurringAmount: 199.0,
      annualRecurringAmount: 2388.0,
      seats: 10,
      unitPrice: 19.9,
      contractStartDate: new Date("2026-01-15"),
      contractEndDate: null,
      isActive: true,
    },
  });

  await prisma.subscription.upsert({
    where: { id: "seed_sub_alpha_analytics" },
    update: {},
    create: {
      id: "seed_sub_alpha_analytics",
      accountId: account.id,
      companyId: companyAlpha.id,
      name: "Add-on: Analytics",
      pricingModel: "flat_monthly",
      monthlyRecurringAmount: 49.0,
      annualRecurringAmount: 588.0,
      contractStartDate: new Date("2026-02-01"),
      contractEndDate: null,
      isActive: true,
    },
  });

  // Beta — usage-based plan
  await prisma.subscription.upsert({
    where: { id: "seed_sub_beta_base" },
    update: {},
    create: {
      id: "seed_sub_beta_base",
      accountId: account.id,
      companyId: companyBeta.id,
      name: "Starter Plan",
      pricingModel: "flat_monthly",
      monthlyRecurringAmount: 89.0,
      annualRecurringAmount: 1068.0,
      contractStartDate: new Date("2025-11-01"),
      contractEndDate: null,
      isActive: true,
    },
  });

  await prisma.subscription.upsert({
    where: { id: "seed_sub_beta_usage" },
    update: {},
    create: {
      id: "seed_sub_beta_usage",
      accountId: account.id,
      companyId: companyBeta.id,
      name: "API Calls (usage-based)",
      pricingModel: "usage_based",
      monthlyRecurringAmount: 0.0, // variable — no MRR contribution
      contractStartDate: new Date("2025-11-01"),
      contractEndDate: null,
      isActive: true,
    },
  });

  // Gamma — annual contract
  await prisma.subscription.upsert({
    where: { id: "seed_sub_gamma_annual" },
    update: {},
    create: {
      id: "seed_sub_gamma_annual",
      accountId: account.id,
      companyId: companyGamma.id,
      name: "Enterprise Annual",
      pricingModel: "flat_annual",
      monthlyRecurringAmount: 416.67, // 5000 / 12
      annualRecurringAmount: 5000.0,
      contractStartDate: new Date("2026-01-01"),
      contractEndDate: new Date("2026-12-31"),
      isActive: true,
    },
  });

  // ── Revenue snapshots ──────────────────────────────────────────────────────
  // Alpha — Jan, Feb, Mar 2026
  //   Jan: MRR=199 (analytics not yet), Usage=0
  //   Feb: MRR=248, Usage=0
  //   Mar: MRR=248, Usage=120.5  (matches spec example JSON)

  const alphaSnapshots = [
    { month: "2026-01-01", beginningMrr: 0, endingMrr: 199, usage: 0 },
    { month: "2026-02-01", beginningMrr: 199, endingMrr: 248, usage: 0 },
    { month: "2026-03-01", beginningMrr: 248, endingMrr: 248, usage: 120.5 },
  ];
  for (const s of alphaSnapshots) {
    await prisma.revenueSnapshot.upsert({
      where: {
        accountId_companyId_month: {
          accountId: account.id,
          companyId: companyAlpha.id,
          month: new Date(s.month),
        },
      },
      update: {},
      create: {
        accountId: account.id,
        companyId: companyAlpha.id,
        month: new Date(s.month),
        beginningMrr: s.beginningMrr,
        endingMrr: s.endingMrr,
        monthlyUsageRevenue: s.usage,
        totalRecurringRevenue: s.endingMrr,
        totalRevenue: s.endingMrr + s.usage,
      },
    });
  }

  // Beta — Jan, Feb, Mar 2026
  const betaSnapshots = [
    { month: "2025-11-01", beginningMrr: 0, endingMrr: 89, usage: 45.0 },
    { month: "2025-12-01", beginningMrr: 89, endingMrr: 89, usage: 62.0 },
    { month: "2026-01-01", beginningMrr: 89, endingMrr: 89, usage: 78.0 },
    { month: "2026-02-01", beginningMrr: 89, endingMrr: 89, usage: 95.5 },
    { month: "2026-03-01", beginningMrr: 89, endingMrr: 89, usage: 110.0 },
  ];
  for (const s of betaSnapshots) {
    await prisma.revenueSnapshot.upsert({
      where: {
        accountId_companyId_month: {
          accountId: account.id,
          companyId: companyBeta.id,
          month: new Date(s.month),
        },
      },
      update: {},
      create: {
        accountId: account.id,
        companyId: companyBeta.id,
        month: new Date(s.month),
        beginningMrr: s.beginningMrr,
        endingMrr: s.endingMrr,
        monthlyUsageRevenue: s.usage,
        totalRecurringRevenue: s.endingMrr,
        totalRevenue: s.endingMrr + s.usage,
      },
    });
  }

  // Gamma — Jan, Feb, Mar 2026
  const gammaSnapshots = [
    { month: "2026-01-01", beginningMrr: 0, endingMrr: 416.67, usage: 0 },
    { month: "2026-02-01", beginningMrr: 416.67, endingMrr: 416.67, usage: 0 },
    { month: "2026-03-01", beginningMrr: 416.67, endingMrr: 416.67, usage: 0 },
  ];
  for (const s of gammaSnapshots) {
    await prisma.revenueSnapshot.upsert({
      where: {
        accountId_companyId_month: {
          accountId: account.id,
          companyId: companyGamma.id,
          month: new Date(s.month),
        },
      },
      update: {},
      create: {
        accountId: account.id,
        companyId: companyGamma.id,
        month: new Date(s.month),
        beginningMrr: s.beginningMrr,
        endingMrr: s.endingMrr,
        monthlyUsageRevenue: s.usage,
        totalRecurringRevenue: s.endingMrr,
        totalRevenue: s.endingMrr + s.usage,
      },
    });
  }

  // ── Contacts ───────────────────────────────────────────────────────────────
  await prisma.contact.upsert({
    where: { id: "seed_contact_1" },
    update: {},
    create: {
      id: "seed_contact_1",
      accountId: account.id,
      name: "Sarah Chen",
      email: "sarah@alpha.example.com",
      phone: "+1 415 555 0101",
      companyId: companyAlpha.id,
      tags: "champion,decision-maker",
    },
  });

  await prisma.contact.upsert({
    where: { id: "seed_contact_2" },
    update: {},
    create: {
      id: "seed_contact_2",
      accountId: account.id,
      name: "Marcus Webb",
      email: "marcus@beta.example.com",
      phone: "+1 212 555 0199",
      companyId: companyBeta.id,
      tags: "finance",
    },
  });

  console.log("✅ Seed complete.");
  console.log("   Login: demo@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
