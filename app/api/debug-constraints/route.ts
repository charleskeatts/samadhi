import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Query pg_constraint for feature_requests check constraints
  const { data, error } = await admin.rpc('exec_sql', {
    query: `
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conrelid = 'public.feature_requests'::regclass
      AND contype = 'c'
    `
  });

  // Also try direct column info
  const { data: cols, error: colErr } = await admin.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'feature_requests'
      ORDER BY ordinal_position
    `
  });

  // Try inserting a test row and catching the error to see what's allowed
  const testValues = ['backlog', 'planned', 'in_progress', 'shipped', 'discovery', 'evaluation', 'negotiation', 'closed_won', 'closed_lost', 'active', 'new_business', 'at_risk', 'renewal', 'expansion'];
  const results: Record<string, string> = {};

  // First get a valid org and account to reference
  const { data: orgs } = await admin.from('organizations').select('id').limit(1);
  const { data: accts } = await admin.from('accounts').select('id').limit(1);

  if (orgs?.[0] && accts?.[0]) {
    for (const val of testValues) {
      const { error: testErr } = await admin
        .from('feature_requests')
        .insert({
          organization_id: orgs[0].id,
          account_id: accts[0].id,
          feature_name: `test-${val}`,
          category: 'test',
          deal_stage: val,
          blocker_score: 1,
        });
      
      if (testErr) {
        results[val] = `REJECTED: ${testErr.message}`;
        // Clean up if it somehow succeeded
      } else {
        results[val] = 'ACCEPTED';
        // Clean up the test row
        await admin
          .from('feature_requests')
          .delete()
          .eq('feature_name', `test-${val}`)
          .eq('organization_id', orgs[0].id);
      }
    }
  }

  return NextResponse.json({ constraints: data, constraintError: error?.message, columns: cols, colError: colErr?.message, dealStageTest: results });
}
