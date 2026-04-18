"use client"

import Link from "next/link"
import { useActionState } from "react"

import { signupAction } from "@/lib/auth/actions"
import { buildLoginPath } from "@/lib/auth/utils"
import { initialActionState, type DesktopLaunchContext } from "@/lib/auth/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { FieldMessage, FormMessage } from "./form-message"
import { SubmitButton } from "./submit-button"

interface SignupFormProps {
  desktopContext: DesktopLaunchContext
}

export function SignupForm({ desktopContext }: SignupFormProps) {
  const [state, formAction] = useActionState(signupAction, initialActionState)

  return (
    <form action={formAction} className="space-y-4">
      <input name="desktop" type="hidden" value={desktopContext.desktop ? "1" : "0"} />
      <input name="returnTo" type="hidden" value={desktopContext.returnTo} />

      <FormMessage state={state} />

      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input
          autoComplete="nickname"
          id="username"
          name="username"
          placeholder="logic-hacker"
          type="text"
        />
        <FieldMessage message={state.fieldErrors?.username?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          autoComplete="email"
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
          autoComplete="new-password"
          id="password"
          name="password"
          placeholder="Use at least 8 characters"
          type="password"
        />
        <FieldMessage message={state.fieldErrors?.password?.[0]} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="avatar">Avatar</Label>
        <Input
          accept="image/png,image/jpeg,image/webp"
          className="h-auto py-2"
          id="avatar"
          name="avatar"
          type="file"
        />
        <FieldMessage message={state.fieldErrors?.avatar?.[0]} />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <SubmitButton className="w-full" pendingLabel="Creating account...">
          Create account
        </SubmitButton>
        <Button asChild className="w-full" variant="outline">
          <Link href={buildLoginPath(desktopContext)}>Use an existing account</Link>
        </Button>
      </div>
    </form>
  )
}