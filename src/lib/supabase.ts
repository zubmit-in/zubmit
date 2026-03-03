import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Admin client — use in API routes only, never expose to browser
// Bypasses RLS for full database access
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
