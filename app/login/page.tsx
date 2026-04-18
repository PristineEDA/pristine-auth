import { redirect } from "next/navigation"

import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { createClient } from "@/lib/supabase/server"
import {
  buildSuccessPath,
  parseDesktopLaunchContext,
  readSearchParam,
} from "@/lib/auth/utils"

export const dynamic = "force-dynamic"

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
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
    <AuthShell title="Sign in">
      <LoginForm
        defaultEmail={readSearchParam(resolvedSearchParams, "email") ?? ""}
        desktopContext={desktopContext}
      />
    </AuthShell>
  )
}