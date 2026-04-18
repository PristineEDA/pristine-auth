export interface ActionState {
  status: "idle" | "error" | "success"
  message?: string
  fieldErrors?: Record<string, string[]>
}

export interface DesktopLaunchContext {
  desktop: boolean
  returnTo: string
}

export interface PublicProfile {
  avatarPath: string | null
  avatarUrl: string | null
  email: string
  userId: string
  username: string
}

export interface DesktopExchangePayload {
  accessToken: string
  email: string | null
  refreshToken: string
  sessionExpiresAt: number | null
  userId: string
}

export const initialActionState: ActionState = {
  status: "idle",
}