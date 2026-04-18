import { describe, expect, it } from "vitest"

import { sanitizeSyncSettings } from "@/lib/auth/config"

describe("config sync sanitization", () => {
  it("keeps allowed values and drops unknown keys", () => {
    const result = sanitizeSyncSettings({
      "editor.fontSize": 14,
      "ui.theme": "dark",
      "workspace.activeFile": "should-not-sync",
    })

    expect(result.settings).toEqual({
      "editor.fontSize": 14,
      "ui.theme": "dark",
    })
    expect(result.fieldErrors).toEqual({})
  })

  it("returns field errors for invalid values", () => {
    const result = sanitizeSyncSettings({
      "editor.fontSize": 200,
    })

    expect(result.settings).toEqual({})
    expect(result.fieldErrors["editor.fontSize"]).toEqual(["Invalid value."])
  })
})