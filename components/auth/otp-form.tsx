"use client"

import Link from "next/link"
import { useActionState } from "react"

import { verifyOtpAction } from "@/lib/auth/actions"
import { buildLoginPath } from "@/lib/auth/utils"
import { initialActionState, type DesktopLaunchContext } from "@/lib/auth/types"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { FieldMessage, FormMessage } from "./form-message"
import { SubmitButton } from "./submit-button"

interface OtpFormProps {
  defaultEmail?: string
  desktopContext: DesktopLaunchContext
}

export function OtpForm({ defaultEmail = "", desktopContext }: OtpFormProps) {
  const [state, formAction] = useActionState(verifyOtpAction, initialActionState)

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
        <Label htmlFor="token">Verification code</Label>
        <Input
          autoComplete="one-time-code"
          className="text-center text-lg tracking-[0.35em]"
          id="token"
          inputMode="numeric"
          maxLength={6}
          name="token"
          placeholder="123456"
          type="text"
        />
        <FieldMessage message={state.fieldErrors?.token?.[0]} />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <SubmitButton className="w-full" pendingLabel="Verifying...">
          Verify code
        </SubmitButton>
        <Button asChild className="w-full" variant="outline">
          <Link href={buildLoginPath(desktopContext)}>Back to sign in</Link>
        </Button>
      </div>
    </form>
  )
}