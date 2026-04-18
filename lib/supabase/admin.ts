import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import { getPublicEnv } from "@/lib/env/public"
import { requireSupabaseSecretKey } from "@/lib/env/server"

import type { Database } from "./database.types"

export function createAdminClient() {
  const env = getPublicEnv()

  return createSupabaseClient<Database>(
    env.supabaseUrl,
    requireSupabaseSecretKey(),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}