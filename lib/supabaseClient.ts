import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || URL === 'https://invalid.local') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('Missing Supabase URL configuration');
}

if (!KEY || KEY === 'dev-key') {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing Supabase Key configuration');
}

console.log('Supabase URL configured:', URL);

// Get the current origin for redirect URLs
const getRedirectURL = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  // Fallback for server-side
  return process.env.NODE_ENV === 'production' 
    ? 'https://cookmate-flame.vercel.app/auth/callback'
    : 'http://localhost:3000/auth/callback';
};

export const supabase = createClient(URL, KEY, {
  auth: { 
    autoRefreshToken: true, 
    persistSession: true, 
    detectSessionInUrl: true,
    flowType: 'pkce' // More secure auth flow
  },
});

export { getRedirectURL };
