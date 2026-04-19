import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  createAdminClientMock,
  ensureUserProfileMock,
  eqMock,
  findProfileByUserIdMock,
  fromMock,
  getUserByIdMock,
  maybeSingleMock,
  redeemDesktopExchangeCodeMock,
  selectMock,
} = vi.hoisted(() => {
  const maybeSingleMock = vi.fn()
  const eqMock = vi.fn(() => ({ maybeSingle: maybeSingleMock }))
  const selectMock = vi.fn(() => ({ eq: eqMock }))
  const fromMock = vi.fn(() => ({ select: selectMock }))
  const getUserByIdMock = vi.fn()
  const createAdminClientMock = vi.fn(() => ({
    auth: {
      admin: {
        getUserById: getUserByIdMock,
      },
    },
    from: fromMock,
  }))
  const ensureUserProfileMock = vi.fn()
  const findProfileByUserIdMock = vi.fn()
  const redeemDesktopExchangeCodeMock = vi.fn()

  return {
    createAdminClientMock,
    ensureUserProfileMock,
    eqMock,
    findProfileByUserIdMock,
    fromMock,
    getUserByIdMock,
    maybeSingleMock,
    redeemDesktopExchangeCodeMock,
    selectMock,
  }
})

vi.mock("@/lib/auth/desktop", () => ({
  redeemDesktopExchangeCode: redeemDesktopExchangeCodeMock,
}))

vi.mock("@/lib/auth/profile", () => ({
  ensureUserProfile: ensureUserProfileMock,
  findProfileByUserId: findProfileByUserIdMock,
}))

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}))

import { POST } from "@/app/api/desktop/exchange/route"

describe("desktop exchange route", () => {
  beforeEach(() => {
    createAdminClientMock.mockClear()
    ensureUserProfileMock.mockReset()
    eqMock.mockClear()
    findProfileByUserIdMock.mockReset()
    fromMock.mockClear()
    getUserByIdMock.mockReset()
    maybeSingleMock.mockReset()
    redeemDesktopExchangeCodeMock.mockReset()
    selectMock.mockClear()
  })

  it("repairs a cleared avatar path before returning the desktop profile", async () => {
    redeemDesktopExchangeCodeMock.mockResolvedValue({
      expiresAt: "2026-04-19T12:00:00.000Z",
      payload: {
        accessToken: "access-token",
        email: "maksyuki@qq.com",
        refreshToken: "refresh-token",
        sessionExpiresAt: 1_234_567_890,
        userId: "user-1",
      },
      redirectUri: "pristine://auth/callback",
    })
    findProfileByUserIdMock.mockResolvedValue({
      avatarPath: null,
      avatarUrl: null,
      email: "maksyuki@qq.com",
      userId: "user-1",
      username: "maksyuki",
    })
    getUserByIdMock.mockResolvedValue({
      data: {
        user: {
          email: "maksyuki@qq.com",
          id: "user-1",
          user_metadata: {},
        },
      },
      error: null,
    })
    ensureUserProfileMock.mockResolvedValue({
      avatarPath: "user-1/profile.jpg",
      avatarUrl: "https://cdn.example/user-1/profile.jpg",
      email: "maksyuki@qq.com",
      userId: "user-1",
      username: "maksyuki",
    })
    maybeSingleMock.mockResolvedValue({
      data: null,
      error: null,
    })

    const response = await POST(
      new Request("http://localhost/api/desktop/exchange", {
        body: JSON.stringify({ code: "ABCDEFGHIJKL" }),
        method: "POST",
      }),
    )

    expect(response.status).toBe(200)
    expect(getUserByIdMock).toHaveBeenCalledWith("user-1")
    expect(ensureUserProfileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "maksyuki@qq.com",
        id: "user-1",
      }),
    )

    await expect(response.json()).resolves.toMatchObject({
      profile: {
        avatarPath: "user-1/profile.jpg",
        avatarUrl: "https://cdn.example/user-1/profile.jpg",
        email: "maksyuki@qq.com",
        userId: "user-1",
        username: "maksyuki",
      },
    })
  })
})