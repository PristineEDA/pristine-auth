import { createAdminClient } from "@/lib/supabase/admin"
import { getServerEnv } from "@/lib/env/server"

import { DESKTOP_EXCHANGE_CODE_LENGTH, DESKTOP_EXCHANGE_TTL_MS } from "./constants"
import { sanitizeReturnTo } from "./utils"

import type { DesktopExchangePayload } from "./types"

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const exchangeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function toBase64Url(value: Uint8Array) {
  return Buffer.from(value).toString("base64url")
}

function fromBase64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"))
}

async function createAesKey(secret: string) {
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(secret))

  return crypto.subtle.importKey(
    "raw",
    keyMaterial,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  )
}

async function hashExchangeCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(code))
  return toBase64Url(new Uint8Array(digest))
}

async function encryptDesktopPayload(payload: DesktopExchangePayload) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await createAesKey(getServerEnv().desktopExchangeSecret)
  const encryptedPayload = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(payload)),
  )

  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(encryptedPayload))}`
}

async function decryptDesktopPayload(payload: string) {
  const [iv, encryptedValue] = payload.split(".")

  if (!iv || !encryptedValue) {
    throw new Error("Invalid desktop exchange payload.")
  }

  const key = await createAesKey(getServerEnv().desktopExchangeSecret)
  const decryptedPayload = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64Url(iv) },
    key,
    fromBase64Url(encryptedValue),
  )

  return JSON.parse(decoder.decode(decryptedPayload)) as DesktopExchangePayload
}

export function generateExchangeCode(length = DESKTOP_EXCHANGE_CODE_LENGTH) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))

  return Array.from(bytes, (byte) => exchangeAlphabet[byte % exchangeAlphabet.length]).join("")
}

export function buildDesktopDeepLink(returnTo: string, code: string) {
  const deepLink = new URL(sanitizeReturnTo(returnTo))

  deepLink.searchParams.set("code", code)
  deepLink.searchParams.set("source", "pristine-auth")

  return deepLink.toString()
}

export async function createDesktopExchangeCode(input: {
  accessToken: string
  email: string | null
  refreshToken: string
  returnTo: string
  sessionExpiresAt: number | null
  userId: string
}) {
  const admin = createAdminClient()
  const code = generateExchangeCode()
  const expiresAt = new Date(Date.now() + DESKTOP_EXCHANGE_TTL_MS).toISOString()
  const codeHash = await hashExchangeCode(code)
  const encryptedPayload = await encryptDesktopPayload({
    accessToken: input.accessToken,
    email: input.email,
    refreshToken: input.refreshToken,
    sessionExpiresAt: input.sessionExpiresAt,
    userId: input.userId,
  })

  const { error } = await admin.from("desktop_exchange_codes").insert({
    code_hash: codeHash,
    encrypted_payload: encryptedPayload,
    expires_at: expiresAt,
    redirect_uri: sanitizeReturnTo(input.returnTo),
    user_id: input.userId,
  })

  if (error) {
    throw error
  }

  return {
    code,
    deepLink: buildDesktopDeepLink(input.returnTo, code),
    expiresAt,
  }
}

export async function redeemDesktopExchangeCode(code: string) {
  const admin = createAdminClient()
  const codeHash = await hashExchangeCode(code)
  const consumedAt = new Date().toISOString()

  const { data, error } = await admin
    .from("desktop_exchange_codes")
    .update({ consumed_at: consumedAt })
    .eq("code_hash", codeHash)
    .is("consumed_at", null)
    .gt("expires_at", consumedAt)
    .select("*")
    .single()

  if (error || !data) {
    return null
  }

  const payload = await decryptDesktopPayload(data.encrypted_payload)

  return {
    expiresAt: data.expires_at,
    payload,
    redirectUri: data.redirect_uri,
  }
}