import { createBrowserClient } from "@supabase/ssr"

import { getPublicEnv } from "@/lib/env/public"

import type { Database } from "./database.types"

export function createClient() {
  const env = getPublicEnv()

  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
  )
}