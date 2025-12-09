import '@testing-library/jest-dom';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
// Load environment variables from .env.test or .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { vi } from 'vitest';

// Fallback for required variables to prevent immediate crashes
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// Mock next/font/google
vi.mock('next/font/google', () => ({
  Montserrat: () => ({
    style: { fontFamily: 'Montserrat' },
    className: 'className',
  }),
  Inter: () => ({
    style: { fontFamily: 'Inter' },
    className: 'className',
  }),
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: [], error: null }), // Success for select
      }),
      insert: () => Promise.resolve({ error: { code: '42501', message: 'RLS error' } }), // Failure for insert (mocking RLS denial)
    }),
  }),
}));

