import { createBrowserClient } from "@supabase/ssr";

// Used ONLY for Supabase Auth (sign up/in/out, session). All data access goes through
// Edge Functions — see src/lib/api — never supabase.from(...) directly, per the
// project's Supabase architecture rule.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
