import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);


async function check() {
  console.log('1. Checking connection and basic select...');
  const { data: opps, error: oppsError } = await supabase
    .from('opportunities')
    .select('id, opportunity_type')
    .limit(2);

  if (oppsError) {
    console.error('Error fetching opportunities:', oppsError);
  } else {
    console.log('Successfully fetched opportunities.');
  }

  console.log('\n2. Testing RPC function get_courses_with_opportunities...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_courses_with_opportunities', {
    page_number: 0,
    page_size: 2
  });

  if (rpcError) {
    console.error('RPC Error:', rpcError);
    console.log('\nIMPORTANT: You need to run the SQL in rpc_migration.sql in your Supabase SQL Editor to create this function.');
  } else {
    console.log('RPC Call Successful!');
    console.log(`Returned ${rpcData.length} rows.`);
    if (rpcData.length > 0) {
      console.log('Sample data:', JSON.stringify(rpcData[0], null, 2));
    }
  }
}

check();
