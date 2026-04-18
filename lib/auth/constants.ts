export const AVATAR_BUCKET = "avatars"
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
export const DESKTOP_EXCHANGE_CODE_LENGTH = 24
export const DESKTOP_EXCHANGE_TTL_MS = 5 * 60 * 1000
export const CONFIG_SYNC_SCHEMA_VERSION = 1

export const ALLOWED_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const CONFIG_SYNC_ALLOWLIST = [
  "ui.theme",
  "window.closeActionPreference",
  "ui.floatingInfoWindow.visible",
  "editor.fontSize",
  "editor.fontFamily",
  "editor.theme",
  "editor.wordWrap",
  "editor.renderWhitespace",
  "editor.renderControlCharacters",
  "editor.fontLigatures",
  "editor.tabSize",
  "editor.cursorBlinking",
  "editor.smoothScrolling",
  "editor.scrollBeyondLastLine",
  "editor.foldingStrategy",
  "editor.lineNumbers",
  "editor.minimap.enabled",
  "editor.glyphMargin",
  "editor.guides.bracketPairs",
  "editor.guides.indentation",
] as const

export type SyncConfigKey = (typeof CONFIG_SYNC_ALLOWLIST)[number]