import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Load env vars - assuming they are available in the test environment
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe('RLS: Opportunities Table', () => {
  it('should allow anonymous read access to opportunities', async () => {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);

    // We expect public read access to be allowed for opportunities
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should DENY anonymous insert access to opportunities', async () => {
    const { error } = await supabase
      .from('opportunities')
      .insert({
        institution_id: '00000000-0000-0000-0000-000000000000', // Fake ID
        course_name: 'Hacker Course',
        shift: 'Integral',
        scholarship_type: 'Integral',
        city: 'Nowhere',
        state: 'XX',
        cutoff_score: 0
      });

    // We expect this to fail due to RLS
    expect(error).not.toBeNull();
    // Supabase RLS error code for permission denied is usually 42501
    expect(error?.code).toBe('42501'); 
  });


});
