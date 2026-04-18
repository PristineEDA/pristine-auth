import { z } from "zod"

import { CONFIG_SYNC_ALLOWLIST, CONFIG_SYNC_SCHEMA_VERSION, type SyncConfigKey } from "./constants"

type SyncConfigValue = boolean | number | string

const syncConfigValueSchemas: Record<SyncConfigKey, z.ZodType<SyncConfigValue>> = {
  "ui.theme": z.enum(["light", "dark"]),
  "window.closeActionPreference": z.enum(["tray", "quit"]),
  "ui.floatingInfoWindow.visible": z.boolean(),
  "editor.fontSize": z.number().int().min(10).max(24),
  "editor.fontFamily": z.string().trim().min(1).max(64),
  "editor.theme": z.enum([
    "dracula",
    "github-light",
    "github-dark",
    "one-dark-pro",
    "night-owl",
    "tokyo-night",
    "solarized-light",
    "solarized-dark",
  ]),
  "editor.wordWrap": z.enum(["off", "on", "bounded", "wordWrapColumn"]),
  "editor.renderWhitespace": z.enum(["none", "boundary", "selection", "trailing", "all"]),
  "editor.renderControlCharacters": z.boolean(),
  "editor.fontLigatures": z.boolean(),
  "editor.tabSize": z.union([z.literal(2), z.literal(4), z.literal(8)]),
  "editor.cursorBlinking": z.enum(["blink", "smooth", "phase", "expand", "solid"]),
  "editor.smoothScrolling": z.boolean(),
  "editor.scrollBeyondLastLine": z.boolean(),
  "editor.foldingStrategy": z.enum(["indentation", "auto"]),
  "editor.lineNumbers": z.enum(["on", "off", "relative", "interval"]),
  "editor.minimap.enabled": z.boolean(),
  "editor.glyphMargin": z.boolean(),
  "editor.guides.bracketPairs": z.boolean(),
  "editor.guides.indentation": z.boolean(),
}

export interface SanitizedSyncConfigResult {
  fieldErrors: Record<string, string[]>
  settings: Partial<Record<SyncConfigKey, SyncConfigValue>>
}

export function sanitizeSyncSettings(input: Record<string, unknown>): SanitizedSyncConfigResult {
  const settings: Partial<Record<SyncConfigKey, SyncConfigValue>> = {}
  const fieldErrors: Record<string, string[]> = {}

  Object.entries(input).forEach(([key, value]) => {
    if (!CONFIG_SYNC_ALLOWLIST.includes(key as SyncConfigKey)) {
      return
    }

    const parser = syncConfigValueSchemas[key as SyncConfigKey]
    const parsedValue = parser.safeParse(value)

    if (!parsedValue.success) {
      fieldErrors[key] = ["Invalid value."]
      return
    }

    settings[key as SyncConfigKey] = parsedValue.data
  })

  return {
    fieldErrors,
    settings,
  }
}

export function createEmptyConfigSnapshot() {
  return {
    settings: {},
    syncVersion: CONFIG_SYNC_SCHEMA_VERSION,
    syncedAt: null,
  }
}