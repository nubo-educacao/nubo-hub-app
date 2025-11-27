import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

describe('RLS: Institutions Table', () => {
  it('should allow anonymous read access to institutions', async () => {
    const { data, error } = await supabase
      .from('institutions')
      .select('*')
      .limit(1);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should DENY anonymous insert access to institutions', async () => {
    const { error } = await supabase
      .from('institutions')
      .insert({
        name: 'Hacker University',
        external_code: 'HACK123'
      });

    expect(error).not.toBeNull();
    expect(error?.code).toBe('42501');
  });
});
