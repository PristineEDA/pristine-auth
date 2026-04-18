import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedSession() {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return null
  }

  const { data: sessionData } = await supabase.auth.getSession()

  return {
    session: sessionData.session,
    supabase,
    user: userData.user,
  }
}

export async function requireAuthenticatedSession(loginPath = "/login") {
  const authSession = await getAuthenticatedSession()

  if (!authSession) {
    redirect(loginPath)
  }

  return authSession
}