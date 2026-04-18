import { describe, expect, it } from "vitest"

import {
  buildSuccessPath,
  parseDesktopLaunchContext,
  sanitizeReturnTo,
} from "@/lib/auth/utils"

describe("auth utils", () => {
  it("keeps the configured pristine callback when the URL is trusted", () => {
    expect(sanitizeReturnTo("pristine://auth/callback")).toBe(
      "pristine://auth/callback",
    )
  })

  it("falls back when the callback URL is untrusted", () => {
    expect(sanitizeReturnTo("https://example.com/callback")).toBe(
      "pristine://auth/callback",
    )
  })

  it("includes desktop query params when building the success path", () => {
    const desktopContext = parseDesktopLaunchContext({
      desktop: "1",
      returnTo: "pristine://auth/callback",
    })

    expect(buildSuccessPath(desktopContext)).toContain("desktop=1")
    expect(buildSuccessPath(desktopContext)).toContain("returnTo=")
  })
})