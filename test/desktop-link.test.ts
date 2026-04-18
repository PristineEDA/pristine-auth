import { describe, expect, it } from "vitest"

import { buildDesktopDeepLink, generateExchangeCode } from "@/lib/auth/desktop"

describe("desktop exchange helpers", () => {
  it("creates an uppercase exchange code with the expected length", () => {
    const code = generateExchangeCode()

    expect(code).toHaveLength(24)
    expect(code).toMatch(/^[A-Z2-9]+$/)
  })

  it("adds the exchange code to the pristine callback", () => {
    const deepLink = buildDesktopDeepLink("pristine://auth/callback", "ABC123")

    expect(deepLink).toContain("code=ABC123")
    expect(deepLink).toContain("source=pristine-auth")
  })
})