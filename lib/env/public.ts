import { z } from "zod"

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://127.0.0.1:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("http://127.0.0.1:54321"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).default("sb_publishable_local_dev_placeholder"),
  NEXT_PUBLIC_PRISTINE_DEEP_LINK_BASE: z.string().min(1).default("pristine://auth/callback"),
})

export interface PublicEnv {
  siteUrl: string
  supabaseUrl: string
  supabasePublishableKey: string
  pristineDeepLinkBase: string
}

let cachedEnv: PublicEnv | null = null

export function getPublicEnv(): PublicEnv {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsedEnv = publicEnvSchema.parse(process.env)

  cachedEnv = {
    siteUrl: parsedEnv.NEXT_PUBLIC_SITE_URL,
    supabaseUrl: parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: parsedEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    pristineDeepLinkBase: parsedEnv.NEXT_PUBLIC_PRISTINE_DEEP_LINK_BASE,
  }

  return cachedEnv
}