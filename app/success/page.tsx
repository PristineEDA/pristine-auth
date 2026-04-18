import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { SuccessPanel } from "@/components/auth/success-panel"
import { ensureUserProfile } from "@/lib/auth/profile"
import { buildLoginPath, parseDesktopLaunchContext, readSearchParam } from "@/lib/auth/utils"
import { requireAuthenticatedSession } from "@/lib/auth/session"
import { buildAvatarUrl } from "@/lib/auth/avatar"

export const dynamic = "force-dynamic"

interface SuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const resolvedSearchParams = await searchParams
  const desktopContext = parseDesktopLaunchContext({
    desktop: readSearchParam(resolvedSearchParams, "desktop"),
    returnTo: readSearchParam(resolvedSearchParams, "returnTo"),
  })
  const { supabase, user } = await requireAuthenticatedSession(
    buildLoginPath(desktopContext),
  )
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  const profile = profileRow
    ? {
        avatarPath: profileRow.avatar_path,
        avatarUrl: buildAvatarUrl(profileRow.avatar_path),
        email: profileRow.email,
        userId: profileRow.user_id,
        username: profileRow.username,
      }
    : await ensureUserProfile(user)

  if (!user) {
    redirect(buildLoginPath(desktopContext))
  }

  return (
    <AuthShell title={desktopContext.desktop ? "Open Pristine" : "Signed in"}>
      <SuccessPanel desktopContext={desktopContext} profile={profile} />
    </AuthShell>
  )
}