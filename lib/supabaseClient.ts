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

export const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});
