import '@testing-library/jest-dom';
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
// Load environment variables from .env.test or .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.test') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { vi } from 'vitest';

// Fallback for required variables to prevent immediate crashes
// Fallback for required variables to prevent immediate crashes
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';

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
        limit: () => Promise.resolve({ data: [], error: null }),
        range: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      insert: () => Promise.resolve({ error: { code: '42501', message: 'RLS error' } }),
    }),
    auth: {
        signInWithOtp: () => Promise.resolve({ error: null }),
        verifyOtp: () => Promise.resolve({ data: { session: {} }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        getSession: () => Promise.resolve({ data: { session: null } }),
        signOut: () => Promise.resolve(),
        signInWithPassword: () => Promise.resolve({ data: {}, error: null }),
        signUp: () => Promise.resolve({ data: { session: {} }, error: null }),
    }
  }),
}));

// Mock the actual client file to prevent top-level errors even if imports pass through
// We use a relative path that matches how other files import it (or alias)
// Since we used absolute paths in some generic imports, vitest might map them.
// Best to mock the module path resolved by alias.
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
         range: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
         }),
         limit: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    auth: {
        signInWithOtp: () => Promise.resolve({ error: null }),
    }
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

