import { createAdminClient } from "@/lib/supabase/admin"
import { getPublicEnv } from "@/lib/env/public"

import { ALLOWED_AVATAR_MIME_TYPES, AVATAR_BUCKET, MAX_AVATAR_BYTES } from "./constants"

const fileExtensionByMimeType: Record<(typeof ALLOWED_AVATAR_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function validateAvatarFile(file: File) {
  if (file.size === 0) {
    return null
  }

  if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return "Use a PNG, JPG, or WEBP image."
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return "Use an image smaller than 5 MB."
  }

  return null
}

export function buildAvatarUrl(avatarPath: string | null | undefined) {
  if (!avatarPath) {
    return null
  }

  const encodedPath = avatarPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `${getPublicEnv().supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${encodedPath}`
}

export async function uploadAvatarFile(userId: string, file: File) {
  const validationMessage = validateAvatarFile(file)

  if (validationMessage) {
    throw new Error(validationMessage)
  }

  const extension = fileExtensionByMimeType[file.type as (typeof ALLOWED_AVATAR_MIME_TYPES)[number]]
  const avatarPath = `${userId}/profile.${extension}`
  const admin = createAdminClient()

  const { error } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(avatarPath, await file.arrayBuffer(), {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    })

  if (error) {
    throw error
  }

  return avatarPath
}