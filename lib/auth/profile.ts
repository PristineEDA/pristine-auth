import type { User } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"

import { buildAvatarUrl, uploadAvatarFile } from "./avatar"
import { AVATAR_BUCKET } from "./constants"
import { createFallbackUsername, sanitizeUsernameCandidate } from "./utils"

import type { Database } from "@/lib/supabase/database.types"
import type { PublicProfile } from "./types"

type ProfileRow = Database["public"]["Tables"]["user_profiles"]["Row"]

const avatarFileExtensions = ["jpg", "png", "webp"] as const

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
    username: usernameFromMetadata,
  }
}

async function findStoredAvatarPath(userId: string) {
  const admin = createAdminClient()

  try {
    const candidatePaths = avatarFileExtensions.map(
      (extension) => `${userId}/profile.${extension}`,
    )
    const candidateResults = await Promise.all(
      candidatePaths.map(async (candidatePath) => {
        const { data, error } = await admin.storage
          .from(AVATAR_BUCKET)
          .exists(candidatePath)

        if (error) {
          throw error
        }

        return data ? candidatePath : null
      }),
    )

    return candidateResults.find(
      (candidatePath): candidatePath is string => candidatePath !== null,
    ) ?? null
  } catch {
    return null
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
  const existingProfile = await findProfileByUserId(user.id)
  const identity = resolveProfileIdentity(user)
  let avatarPath = identity.avatarPath ?? existingProfile?.avatarPath ?? null

  if (!avatarPath) {
    avatarPath = await findStoredAvatarPath(user.id)
  }

  const username = identity.username
    ?? existingProfile?.username
    ?? createFallbackUsername(user.id)
  const email = user.email ?? existingProfile?.email ?? ""

  try {
    return await upsertUserProfile({
      avatarPath,
      email,
      userId: user.id,
      username,
    })
  } catch {
    return {
      avatarPath,
      avatarUrl: buildAvatarUrl(avatarPath),
      email,
      userId: user.id,
      username,
    }
  }
}