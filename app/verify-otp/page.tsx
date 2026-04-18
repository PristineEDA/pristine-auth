import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { OtpForm } from "@/components/auth/otp-form"
import { createClient } from "@/lib/supabase/server"
import {
  buildSuccessPath,
  parseDesktopLaunchContext,
  readSearchParam,
} from "@/lib/auth/utils"

export const dynamic = "force-dynamic"

interface VerifyOtpPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function VerifyOtpPage({ searchParams }: VerifyOtpPageProps) {
  const resolvedSearchParams = await searchParams
  const desktopContext = parseDesktopLaunchContext({
    desktop: readSearchParam(resolvedSearchParams, "desktop"),
    returnTo: readSearchParam(resolvedSearchParams, "returnTo"),
  })
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (data.user) {
    redirect(buildSuccessPath(desktopContext))
  }

  return (
    <AuthShell title="Verify code">
      <OtpForm
        defaultEmail={readSearchParam(resolvedSearchParams, "email") ?? ""}
        desktopContext={desktopContext}
      />
    </AuthShell>
  )
}