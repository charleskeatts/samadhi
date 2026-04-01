/**
 * Demo seed (legacy — the demo API route handles seeding directly now)
 * Kept for reference.
 *
 * VALID ENUMS:
 *   category:   Integration | Analytics | Security | Performance
 *   deal_stage: Prospect | Qualified | Negotiation
 */

export async function seedDemoData(_orgId: string, _repId: string): Promise<void> {
  console.log('[seed-demo] This file is deprecated. Seeding is handled in /api/demo/route.ts');
}
