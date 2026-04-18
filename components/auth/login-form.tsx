"use client"

import Link from "next/link"
import { useActionState } from "react"

import { loginAction } from "@/lib/auth/actions"
import { buildSignupPath } from "@/lib/auth/utils"
import { initialActionState, type DesktopLaunchContext } from "@/lib/auth/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { FieldMessage, FormMessage } from "./form-message"
import { SubmitButton } from "./submit-button"

interface LoginFormProps {
  defaultEmail?: string
  desktopContext: DesktopLaunchContext
}

export function LoginForm({ defaultEmail = "", desktopContext }: LoginFormProps) {
  const [state, formAction] = useActionState(loginAction, initialActionState)

  return (
    <form action={formAction} className="space-y-4">
      <input name="desktop" type="hidden" value={desktopContext.desktop ? "1" : "0"} />
      <input name="returnTo" type="hidden" value={desktopContext.returnTo} />

      <FormMessage state={state} />

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
          defaultValue={defaultEmail}
          id="email"
          name="email"
          placeholder="name@company.com"
          type="email"
        />
        <FieldMessage message={state.fieldErrors?.email?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          autoComplete="current-password"
          id="password"
          name="password"
          placeholder="Enter your password"
          type="password"
        />
        <FieldMessage message={state.fieldErrors?.password?.[0]} />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <SubmitButton className="w-full" pendingLabel="Signing in...">
          Sign in
        </SubmitButton>
        <Button asChild className="w-full" variant="outline">
          <Link href={buildSignupPath(desktopContext)}>Create an account</Link>
        </Button>
      </div>
    </form>
  )
}