import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL não está definida');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida');
}

// Custom storage adapter to allow switching between local and session storage
const CustomStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    // Try local storage first (persistent)
    const localValue = window.localStorage.getItem(key);
    if (localValue) return localValue;
    // Fallback to session storage (transient)
    return window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    
    // Check if we should use persistent storage (default) or session storage
    // We'll use a specific key in localStorage to track preference
    // Default to persistent unless explicitly set to 'session'
    const isPersistent = window.localStorage.getItem('supabase-auth-preference') !== 'session';
    
    if (isPersistent) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key); // Clean up other storage
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key); // Clean up other storage
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const setAuthPersistence = (isPersistent: boolean) => {
  if (typeof window === 'undefined') return;
  if (isPersistent) {
    window.localStorage.removeItem('supabase-auth-preference'); // Default is persistent
  } else {
    window.localStorage.setItem('supabase-auth-preference', 'session');
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CustomStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
