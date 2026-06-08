import { createBrowserClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton — prevents concurrent token refresh races when multiple components
// call getSupabase() simultaneously with an expiring JWT.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabase() {
  if (typeof window === 'undefined') {
    // Server-side: never cache — each request needs its own client
    return createBrowserClient(url, key);
  }
  if (!browserClient) {
    browserClient = createBrowserClient(url, key);
  }
  return browserClient;
}
