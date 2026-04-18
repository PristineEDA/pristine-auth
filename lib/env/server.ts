import { z } from "zod"

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DESKTOP_EXCHANGE_SECRET: z.string().min(32).default("development-only-desktop-exchange-secret-change-me"),
})

export interface ServerEnv {
  supabaseSecretKey: string | null
  desktopExchangeSecret: string
}

let cachedEnv: ServerEnv | null = null

export function getServerEnv(): ServerEnv {
  if (cachedEnv) {
    return cachedEnv
  }

  const parsedEnv = serverEnvSchema.parse(process.env)

  cachedEnv = {
    supabaseSecretKey: parsedEnv.SUPABASE_SECRET_KEY ?? parsedEnv.SUPABASE_SERVICE_ROLE_KEY ?? null,
    desktopExchangeSecret: parsedEnv.DESKTOP_EXCHANGE_SECRET,
  }

  return cachedEnv
}

export function requireSupabaseSecretKey(): string {
  const secretKey = getServerEnv().supabaseSecretKey

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for desktop exchange and profile provisioning.")
  }

  return secretKey
}