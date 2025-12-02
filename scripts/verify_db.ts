import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // 1. Check if we can select opportunity_type
  const { data, error } = await supabase
    .from('opportunities')
    .select('id, opportunity_type')
    .limit(5);

  if (error) {
    console.error('Error fetching opportunities:', error);
  } else {
    console.log('Successfully fetched opportunities. Sample data:');
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
