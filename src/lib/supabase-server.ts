import { createServerClient as _createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// ─────────────────────────────────────────────────────────────────────────────
// Server Client
// Use inside Server Components, Route Handlers, and Server Actions.
// Reads cookies to pass auth context. Respects Row Level Security.
// ─────────────────────────────────────────────────────────────────────────────
export async function createServerClient() {
    const cookieStore = await cookies();

    return _createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // Server Component — cookie setting is a no-op (safe to ignore)
                }
            },
        },
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Client (Service Role)
// Use ONLY in trusted server-side code (Server Actions, API Routes).
// Bypasses Row Level Security — handle with care.
// NEVER expose this client to the browser.
// ─────────────────────────────────────────────────────────────────────────────
export function createAdminClient() {
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
