import { NextResponse } from "next/server"

import { createDesktopExchangeCode } from "@/lib/auth/desktop"
import { ensureUserProfile } from "@/lib/auth/profile"
import { desktopLinkSchema } from "@/lib/auth/schemas"
import { getAuthenticatedSession } from "@/lib/auth/session"
import { sanitizeReturnTo } from "@/lib/auth/utils"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const authSession = await getAuthenticatedSession()

  if (!authSession?.session || !authSession.user) {
    return NextResponse.json(
      { message: "Sign in before requesting a desktop handoff." },
      { status: 401 },
    )
  }

  const requestBody = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const parsedInput = desktopLinkSchema.safeParse(requestBody)

  if (!parsedInput.success) {
    return NextResponse.json(
      { message: "Invalid desktop handoff request." },
      { status: 400 },
    )
  }

  const session = authSession.session

  if (!session.access_token || !session.refresh_token) {
    return NextResponse.json(
      { message: "A browser session is required before launching the desktop app." },
      { status: 401 },
    )
  }

  const profile = await ensureUserProfile(authSession.user)
  const desktopLink = await createDesktopExchangeCode({
    accessToken: session.access_token,
    email: authSession.user.email ?? null,
    refreshToken: session.refresh_token,
    returnTo: sanitizeReturnTo(parsedInput.data.returnTo),
    sessionExpiresAt: session.expires_at ?? null,
    userId: authSession.user.id,
  })

  return NextResponse.json({
    ...desktopLink,
    profile,
  })
}