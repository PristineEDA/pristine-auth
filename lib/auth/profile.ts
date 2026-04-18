import type { User } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"

import { buildAvatarUrl, uploadAvatarFile } from "./avatar"
import { createFallbackUsername, sanitizeUsernameCandidate } from "./utils"

import type { Database } from "@/lib/supabase/database.types"
import type { PublicProfile } from "./types"

type ProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"]

function mapProfileRow(profileRow: ProfileRow): PublicProfile {
  return {
    avatarPath: profileRow.avatar_path,
    avatarUrl: buildAvatarUrl(profileRow.avatar_path),
    email: profileRow.email,
    userId: profileRow.user_id,
    username: profileRow.username,
  }
}

function resolveProfileIdentity(user: User) {
  const metadata = user.user_metadata as Record<string, unknown> | undefined
  const usernameFromMetadata = sanitizeUsernameCandidate(
    typeof metadata?.username === "string" ? metadata.username : null,
  )
  const avatarPathFromMetadata =
    typeof metadata?.avatarPath === "string" ? metadata.avatarPath : null

  return {
    avatarPath: avatarPathFromMetadata,
    username: usernameFromMetadata ?? createFallbackUsername(user.id),
  }
}

export async function isUsernameAvailable(username: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_profiles")
    .select("user_id")
    .eq("username_normalized", username.toLowerCase())
    .maybeSingle()

  if (error) {
    throw error
  }

  return !data
}

export async function findProfileByUserId(userId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapProfileRow(data)
}

export async function upsertUserProfile(input: {
  avatarPath?: string | null
  email: string
  userId: string
  username: string
}) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("user_profiles")
    .upsert(
      {
        avatar_path: input.avatarPath ?? null,
        email: input.email,
        user_id: input.userId,
        username: input.username,
      },
      {
        onConflict: "user_id",
      },
    )
    .select("*")
    .single()

  if (error) {
    throw error
  }

  return mapProfileRow(data)
}

export async function createOrUpdateProfile(input: {
  avatarFile?: File | null
  email: string
  userId: string
  username: string
}) {
  let avatarPath: string | null = null

  if (input.avatarFile && input.avatarFile.size > 0) {
    avatarPath = await uploadAvatarFile(input.userId, input.avatarFile)
  }

  return upsertUserProfile({
    avatarPath,
    email: input.email,
    userId: input.userId,
    username: input.username,
  })
}

export async function ensureUserProfile(user: User) {
  const identity = resolveProfileIdentity(user)

  try {
    return await upsertUserProfile({
      avatarPath: identity.avatarPath,
      email: user.email ?? "",
      userId: user.id,
      username: identity.username,
    })
  } catch {
    return {
      avatarPath: identity.avatarPath,
      avatarUrl: buildAvatarUrl(identity.avatarPath),
      email: user.email ?? "",
      userId: user.id,
      username: identity.username,
    }
  }
}