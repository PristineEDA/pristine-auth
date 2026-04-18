import { NextResponse } from "next/server"

import {
  createEmptyConfigSnapshot,
  sanitizeSyncSettings,
} from "@/lib/auth/config"
import { CONFIG_SYNC_SCHEMA_VERSION } from "@/lib/auth/constants"
import { authenticateRequest } from "@/lib/auth/request"
import { configSyncSchema } from "@/lib/auth/schemas"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authContext = await authenticateRequest(request)

  if (!authContext) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_config_snapshots")
    .select("settings, sync_version, synced_at")
    .eq("user_id", authContext.user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { message: "Unable to load the cloud config snapshot." },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(createEmptyConfigSnapshot())
  }

  return NextResponse.json({
    settings: data.settings,
    syncVersion: data.sync_version,
    syncedAt: data.synced_at,
  })
}

export async function PUT(request: Request) {
  const authContext = await authenticateRequest(request)

  if (!authContext) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 })
  }

  const requestBody = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsedInput = configSyncSchema.safeParse(requestBody)

  if (!parsedInput.success) {
    return NextResponse.json(
      { message: "Invalid config payload." },
      { status: 400 },
    )
  }

  const sanitizedConfig = sanitizeSyncSettings(parsedInput.data.settings)

  if (Object.keys(sanitizedConfig.fieldErrors).length > 0) {
    return NextResponse.json(
      {
        fieldErrors: sanitizedConfig.fieldErrors,
        message: "Some config values are not allowed for cloud sync.",
      },
      { status: 400 },
    )
  }

  const admin = createAdminClient()
  const syncedAt = new Date().toISOString()
  const { data, error } = await admin
    .from("user_config_snapshots")
    .upsert(
      {
        settings: sanitizedConfig.settings,
        sync_version: CONFIG_SYNC_SCHEMA_VERSION,
        synced_at: syncedAt,
        user_id: authContext.user.id,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("settings, sync_version, synced_at")
    .single()

  if (error) {
    return NextResponse.json(
      { message: "Unable to store the cloud config snapshot." },
      { status: 500 },
    )
  }

  return NextResponse.json({
    settings: data.settings,
    syncVersion: data.sync_version,
    syncedAt: data.synced_at,
  })
}