import { NextResponse } from "next/server"

import { createEmptyConfigSnapshot } from "@/lib/auth/config"
import { redeemDesktopExchangeCode } from "@/lib/auth/desktop"
import { findProfileByUserId } from "@/lib/auth/profile"
import { desktopExchangeSchema } from "@/lib/auth/schemas"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const requestBody = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsedInput = desktopExchangeSchema.safeParse(requestBody)

  if (!parsedInput.success) {
    return NextResponse.json(
      { message: "Invalid exchange code." },
      { status: 400 },
    )
  }

  const exchange = await redeemDesktopExchangeCode(parsedInput.data.code)

  if (!exchange) {
    return NextResponse.json(
      { message: "The exchange code is invalid or has expired." },
      { status: 410 },
    )
  }

  const profile = await findProfileByUserId(exchange.payload.userId)
  const admin = createAdminClient()
  const { data: snapshotRow } = await admin
    .from("user_config_snapshots")
    .select("settings, sync_version, synced_at")
    .eq("user_id", exchange.payload.userId)
    .maybeSingle()

  return NextResponse.json({
    accessToken: exchange.payload.accessToken,
    configSnapshot: snapshotRow
      ? {
          settings: snapshotRow.settings,
          syncVersion: snapshotRow.sync_version,
          syncedAt: snapshotRow.synced_at,
        }
      : createEmptyConfigSnapshot(),
    expiresAt: exchange.expiresAt,
    profile: profile ?? {
      avatarPath: null,
      avatarUrl: null,
      email: exchange.payload.email ?? "",
      userId: exchange.payload.userId,
      username: `user-${exchange.payload.userId.slice(0, 8)}`,
    },
    redirectUri: exchange.redirectUri,
    refreshToken: exchange.payload.refreshToken,
    sessionExpiresAt: exchange.payload.sessionExpiresAt,
  })
}