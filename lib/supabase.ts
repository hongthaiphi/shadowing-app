import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createClient(url, key);
  }
  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}
