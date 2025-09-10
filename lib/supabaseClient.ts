import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://invalid.local';
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-key';

export const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});
