"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Copy, LoaderCircle } from "lucide-react"

import { signOutAction } from "@/lib/auth/actions"
import type { DesktopLaunchContext, PublicProfile } from "@/lib/auth/types"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SuccessPanelProps {
  desktopContext: DesktopLaunchContext
  profile: PublicProfile
}

type DesktopLinkState =
  | { status: "idle" }
  | { status: "loading" }
  | { message: string; status: "error" }
  | { code: string; deepLink: string; expiresAt: string; status: "ready" }

function getProfileInitials(username: string) {
  return username
    .split(/[-_\s]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function SuccessPanel({ desktopContext, profile }: SuccessPanelProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle")
  const [linkState, setLinkState] = useState<DesktopLinkState>(
    desktopContext.desktop ? { status: "loading" } : { status: "idle" },
  )

  useEffect(() => {
    if (!desktopContext.desktop) {
      return
    }

    let active = true

    async function createDesktopLink() {
      setLinkState({ status: "loading" })

      try {
        const response = await fetch("/api/desktop/link", {
          body: JSON.stringify({
            returnTo: desktopContext.returnTo,
          }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        })
        const payload = (await response.json().catch(() => ({}))) as {
          code?: string
          deepLink?: string
          expiresAt?: string
          message?: string
        }

        if (!response.ok || !payload.code || !payload.deepLink || !payload.expiresAt) {
          throw new Error(payload.message ?? "Unable to prepare the desktop handoff.")
        }

        if (!active) {
          return
        }

        setLinkState({
          code: payload.code,
          deepLink: payload.deepLink,
          expiresAt: payload.expiresAt,
          status: "ready",
        })

        window.location.assign(payload.deepLink)
      } catch (error) {
        if (!active) {
          return
        }

        setLinkState({
          message:
            error instanceof Error
              ? error.message
              : "Unable to prepare the desktop handoff.",
          status: "error",
        })
      }
    }

    void createDesktopLink()

    return () => {
      active = false
    }
  }, [desktopContext.desktop, desktopContext.returnTo])

  async function handleCopyCode() {
    if (linkState.status !== "ready") {
      return
    }

    await navigator.clipboard.writeText(linkState.code)
    setCopyState("copied")
    window.setTimeout(() => setCopyState("idle"), 1800)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar className="size-16 text-lg" size="lg">
          {profile.avatarUrl ? <AvatarImage alt={profile.username} src={profile.avatarUrl} /> : null}
          <AvatarFallback>{getProfileInitials(profile.username)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <h3 className="text-xl font-medium">{profile.username}</h3>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {desktopContext.desktop ? (
        <div className="space-y-3">
          {linkState.status === "loading" ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preparing desktop link...</p>
            </div>
          ) : null}
          {linkState.status === "error" ? (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertDescription>{linkState.message}</AlertDescription>
              </Alert>
              <Button asChild className="w-full" variant="outline">
                <a href={desktopContext.returnTo}>Try the desktop callback again</a>
              </Button>
            </div>
          ) : null}
          {linkState.status === "ready" ? (
            <div className="space-y-3">
              <Input className="font-mono text-center text-sm" readOnly value={linkState.code} />
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <a href={linkState.deepLink}>
                    Open Pristine
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
                <Button className="w-full" onClick={handleCopyCode} type="button" variant="outline">
                  <Copy className="size-4" />
                  {copyState === "copied" ? "Copied" : "Copy code"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <form action={signOutAction} className="pt-2">
        <Button className="w-full" variant="outline">
          Sign out
        </Button>
      </form>
    </div>
  )
}