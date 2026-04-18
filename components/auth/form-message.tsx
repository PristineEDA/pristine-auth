import { AlertCircle, CheckCircle2 } from "lucide-react"

import type { ActionState } from "@/lib/auth/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle" || !state.message) {
    return null
  }

  const success = state.status === "success"
  const Icon = success ? CheckCircle2 : AlertCircle

  return (
    <Alert variant={success ? "default" : "destructive"}>
      <Icon className="size-4" />
      <AlertDescription>{state.message}</AlertDescription>
    </Alert>
  )
}

export function FieldMessage({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs text-destructive">{message}</p>
}