import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '';
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// ── Browser client (used in client components) ─────────────────
export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnon)
  : null;

// ── Server-only admin client (used in API routes only) ─────────
// Never import this in client components!
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const SUPABASE_CONFIGURED = !!supabaseUrl && !!supabaseAnon;
