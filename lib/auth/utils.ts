import type { ZodError } from "zod"

import { getPublicEnv } from "@/lib/env/public"

import type { ActionState, DesktopLaunchContext } from "./types"

type SearchValue = string | string[] | undefined

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "Email not confirmed": "Verify the six-digit email code before signing in.",
  "Invalid login credentials": "The email or password is incorrect.",
  "Password should be at least 8 characters": "Use at least 8 characters for the password.",
  "User already registered": "An account already exists for this email address.",
}

export function readSearchParam(
  searchParams: Record<string, SearchValue>,
  key: string,
): string | undefined {
  const value = searchParams[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

export function isDesktopIntent(value: unknown): boolean {
  return value === "1" || value === "true"
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  const fallback = getPublicEnv().pristineDeepLinkBase
  const fallbackUrl = new URL(fallback)

  if (!value) {
    return fallback
  }

  try {
    const candidateUrl = new URL(value)

    if (
      candidateUrl.protocol !== fallbackUrl.protocol ||
      candidateUrl.host !== fallbackUrl.host
    ) {
      return fallback
    }

    return `${candidateUrl.protocol}//${candidateUrl.host}${candidateUrl.pathname}`
  } catch {
    return fallback
  }
}

export function parseDesktopLaunchContext(input: {
  desktop?: unknown
  returnTo?: unknown
}): DesktopLaunchContext {
  return {
    desktop: isDesktopIntent(input.desktop),
    returnTo: sanitizeReturnTo(typeof input.returnTo === "string" ? input.returnTo : null),
  }
}

function buildAuthPath(
  pathname: string,
  desktopContext?: DesktopLaunchContext,
  extraParams?: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams()

  if (desktopContext?.desktop) {
    searchParams.set("desktop", "1")
    searchParams.set("returnTo", desktopContext.returnTo)
  }

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value)
    }
  })

  const query = searchParams.toString()

  return query ? `${pathname}?${query}` : pathname
}

export function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, getPublicEnv().siteUrl).toString()
}

export function buildLoginPath(desktopContext?: DesktopLaunchContext) {
  return buildAuthPath("/login", desktopContext)
}

export function buildSignupPath(desktopContext?: DesktopLaunchContext) {
  return buildAuthPath("/signup", desktopContext)
}

export function buildVerifyOtpPath(options: {
  desktopContext?: DesktopLaunchContext
  email?: string
}) {
  return buildAuthPath("/verify-otp", options.desktopContext, {
    email: options.email,
  })
}

export function buildSuccessPath(desktopContext?: DesktopLaunchContext) {
  return buildAuthPath("/success", desktopContext)
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function normalizeUsername(value: string) {
  return value.trim()
}

export function sanitizeUsernameCandidate(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  const normalizedValue = trimmedValue
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 24)

  if (!normalizedValue.match(/^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$/)) {
    return null
  }

  return normalizedValue
}

export function createFallbackUsername(userId: string) {
  return `user-${userId.slice(0, 8)}`
}

export function validationActionState(error: ZodError): ActionState {
  const flattened = error.flatten()

  return {
    status: "error",
    message:
      flattened.formErrors[0] ?? "Check the highlighted fields and try again.",
    fieldErrors: flattened.fieldErrors,
  }
}

export function errorActionState(
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionState {
  return {
    status: "error",
    message,
    fieldErrors,
  }
}

export function formatAuthError(message: string) {
  return AUTH_ERROR_MESSAGES[message] ?? message
}