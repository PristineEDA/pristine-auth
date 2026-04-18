import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function authenticateRequest(request: Request) {
  const authorization = request.headers.get("authorization")

  if (authorization?.startsWith("Bearer ")) {
    const accessToken = authorization.slice("Bearer ".length).trim()

    if (!accessToken) {
      return null
    }

    const admin = createAdminClient()
    const { data, error } = await admin.auth.getUser(accessToken)

    if (error || !data.user) {
      return null
    }

    return {
      authType: "bearer" as const,
      user: data.user,
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return {
    authType: "cookie" as const,
    user: data.user,
  }
}