"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

import { createOrUpdateProfile, ensureUserProfile, isUsernameAvailable } from "./profile"
import { validateAvatarFile } from "./avatar"
import { loginSchema, signupSchema, verifyOtpSchema } from "./schemas"
import {
  buildAbsoluteUrl,
  buildSuccessPath,
  buildVerifyOtpPath,
  errorActionState,
  formatAuthError,
  normalizeEmail,
  normalizeUsername,
  parseDesktopLaunchContext,
  validationActionState,
} from "./utils"

import type { ActionState } from "./types"

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedInput = loginSchema.safeParse({
    desktop: formData.get("desktop"),
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo"),
  })

  if (!parsedInput.success) {
    return validationActionState(parsedInput.error)
  }

  const desktopContext = parseDesktopLaunchContext({
    desktop: parsedInput.data.desktop,
    returnTo: parsedInput.data.returnTo,
  })
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(parsedInput.data.email),
    password: parsedInput.data.password,
  })

  if (error) {
    return errorActionState(formatAuthError(error.message))
  }

  if (data.user) {
    await ensureUserProfile(data.user)
  }

  redirect(buildSuccessPath(desktopContext))
}

export async function signupAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedInput = signupSchema.safeParse({
    desktop: formData.get("desktop"),
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo"),
    username: formData.get("username"),
  })

  if (!parsedInput.success) {
    return validationActionState(parsedInput.error)
  }

  const avatarInput = formData.get("avatar")
  const avatarFile = avatarInput instanceof File && avatarInput.size > 0 ? avatarInput : null

  if (avatarFile) {
    const avatarValidationError = validateAvatarFile(avatarFile)

    if (avatarValidationError) {
      return errorActionState(avatarValidationError, {
        avatar: [avatarValidationError],
      })
    }
  }

  const desktopContext = parseDesktopLaunchContext({
    desktop: parsedInput.data.desktop,
    returnTo: parsedInput.data.returnTo,
  })
  const email = normalizeEmail(parsedInput.data.email)
  const username = normalizeUsername(parsedInput.data.username)

  try {
    const usernameAvailable = await isUsernameAvailable(username)

    if (!usernameAvailable) {
      return errorActionState("Choose a different username.", {
        username: ["That username is already in use."],
      })
    }
  } catch (error) {
    return errorActionState(
      error instanceof Error
        ? error.message
        : "The account service is not configured correctly.",
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsedInput.data.password,
    options: {
      data: {
        username,
      },
      emailRedirectTo: buildAbsoluteUrl(buildSuccessPath(desktopContext)),
    },
  })

  if (error) {
    return errorActionState(formatAuthError(error.message))
  }

  if (!data.user) {
    return errorActionState("Unable to create the account right now.")
  }

  try {
    await createOrUpdateProfile({
      avatarFile,
      email,
      userId: data.user.id,
      username,
    })
  } catch {
    await ensureUserProfile(data.user)
  }

  redirect(
    buildVerifyOtpPath({
      desktopContext,
      email,
    }),
  )
}

export async function verifyOtpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedInput = verifyOtpSchema.safeParse({
    desktop: formData.get("desktop"),
    email: formData.get("email"),
    returnTo: formData.get("returnTo"),
    token: formData.get("token"),
  })

  if (!parsedInput.success) {
    return validationActionState(parsedInput.error)
  }

  const desktopContext = parseDesktopLaunchContext({
    desktop: parsedInput.data.desktop,
    returnTo: parsedInput.data.returnTo,
  })
  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: normalizeEmail(parsedInput.data.email),
    token: parsedInput.data.token,
    type: "email",
  })

  if (error) {
    return errorActionState(formatAuthError(error.message))
  }

  if (data.user) {
    await ensureUserProfile(data.user)
  }

  redirect(buildSuccessPath(desktopContext))
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}