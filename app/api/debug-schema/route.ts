/**
 * Temporary debug endpoint to inspect the profiles table schema.
 * DELETE THIS after fixing the schema cache issue.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Query information_schema to see actual columns on the profiles table
  const { data: columns, error: colError } = await admin
    .from('information_schema.columns' as any)
    .select('column_name, data_type, is_nullable')
    .eq('table_schema', 'public')
    .eq('table_name', 'profiles');

  // If the above doesn't work due to RLS, try a raw RPC approach
  // by just selecting an empty row from profiles to see what comes back
  const { data: sampleRow, error: sampleError } = await admin
    .from('profiles')
    .select('*')
    .limit(1);

  // Read the PostgREST OpenAPI spec for ALL tables
  let allTables: Record<string, string[]> = {};
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });
    const spec = await res.json();
    if (spec?.definitions) {
      for (const [table, def] of Object.entries(spec.definitions as Record<string, any>)) {
        if (def?.properties) {
          allTables[table] = Object.keys(def.properties);
        }
      }
    }
  } catch (e) {
    allTables = { error: [`fetch failed: ${e}`] };
  }

  return NextResponse.json({
    info_schema: { columns, error: colError?.message },
    sample_select: {
      data: sampleRow,
      error: sampleError?.message,
      keys: sampleRow?.[0] ? Object.keys(sampleRow[0]) : [],
    },
    all_tables: allTables,
  });
}
