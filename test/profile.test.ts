import type { User } from "@supabase/supabase-js"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createAdminClientMock,
  eqMock,
  existsMock,
  fromMock,
  maybeSingleMock,
  selectMock,
  singleMock,
  storageFromMock,
  upsertMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn()
  const singleMock = vi.fn()
  const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
  const selectMock = vi.fn(() => ({ eq: eqMock, single: singleMock }))
  const upsertMock = vi.fn(() => ({ select: selectMock }))
  const fromMock = vi.fn(() => ({ select: selectMock, upsert: upsertMock }))
  const existsMock = vi.fn()
  const storageFromMock = vi.fn(() => ({ exists: existsMock }))
  const createAdminClientMock = vi.fn(() => ({
    from: fromMock,
    storage: {
      from: storageFromMock,
    },
  }))

  return {
    createAdminClientMock,
    eqMock,
    existsMock,
    fromMock,
    maybeSingleMock,
    selectMock,
    singleMock,
    storageFromMock,
    upsertMock,
  }
})

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock("@/lib/auth/avatar", () => ({
  buildAvatarUrl: (avatarPath: string | null | undefined) => (
    avatarPath ? `https://cdn.example/${avatarPath}` : null
  ),
  uploadAvatarFile: vi.fn(),
}))

import { ensureUserProfile } from "@/lib/auth/profile"

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "alice@example.com",
    user_metadata: {},
    ...overrides,
  } as User
}

describe("ensureUserProfile", () => {
  beforeEach(() => {
    maybeSingleMock.mockReset()
    singleMock.mockReset()
    eqMock.mockClear()
    selectMock.mockClear()
    upsertMock.mockClear()
    fromMock.mockClear()
    existsMock.mockReset()
    storageFromMock.mockClear()
    createAdminClientMock.mockClear()
  })

  it("preserves an existing avatar path when auth metadata does not include one", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        avatar_path: "user-1/profile.png",
        email: "alice@example.com",
        user_id: "user-1",
        username: "alice",
      },
      error: null,
    })
    singleMock.mockResolvedValueOnce({
      data: {
        avatar_path: "user-1/profile.png",
        email: "alice@example.com",
        user_id: "user-1",
        username: "alice",
      },
      error: null,
    })

    const profile = await ensureUserProfile(createUser())

    expect(existsMock).not.toHaveBeenCalled()
    expect(upsertMock).toHaveBeenCalledWith(
      {
        avatar_path: "user-1/profile.png",
        email: "alice@example.com",
        user_id: "user-1",
        username: "alice",
      },
      {
        onConflict: "user_id",
      },
    )
    expect(profile.avatarPath).toBe("user-1/profile.png")
    expect(profile.avatarUrl).toBe("https://cdn.example/user-1/profile.png")
    expect(profile.username).toBe("alice")
  })

  it("repairs a missing avatar path from storage when the profile row was cleared", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        avatar_path: null,
        email: "alice@example.com",
        user_id: "user-1",
        username: "alice",
      },
      error: null,
    })
    existsMock
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: false, error: null })
      .mockResolvedValueOnce({ data: true, error: null })
    singleMock.mockResolvedValueOnce({
      data: {
        avatar_path: "user-1/profile.webp",
        email: "alice@example.com",
        user_id: "user-1",
        username: "alice",
      },
      error: null,
    })

    const profile = await ensureUserProfile(createUser())

    expect(storageFromMock).toHaveBeenCalledWith("avatars")
    expect(existsMock).toHaveBeenCalledTimes(3)
    expect(existsMock).toHaveBeenNthCalledWith(1, "user-1/profile.jpg")
    expect(existsMock).toHaveBeenNthCalledWith(2, "user-1/profile.png")
    expect(existsMock).toHaveBeenNthCalledWith(3, "user-1/profile.webp")
    expect(upsertMock).toHaveBeenCalledWith(
      {
        avatar_path: "user-1/profile.webp",
        email: "alice@example.com",
        user_id: "user-1",
        username: "alice",
      },
      {
        onConflict: "user_id",
      },
    )
    expect(profile.avatarPath).toBe("user-1/profile.webp")
    expect(profile.avatarUrl).toBe("https://cdn.example/user-1/profile.webp")
  })
})