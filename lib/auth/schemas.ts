import { z } from "zod"

export const loginSchema = z.object({
  desktop: z.string().optional(),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  returnTo: z.string().optional(),
})

export const signupSchema = z.object({
  desktop: z.string().optional(),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  returnTo: z.string().optional(),
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters.")
    .max(24, "Use 24 characters or fewer.")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]{2,23}$/,
      "Use letters, numbers, underscores, or hyphens.",
    ),
})

export const verifyOtpSchema = z.object({
  desktop: z.string().optional(),
  email: z.string().trim().email("Enter a valid email address."),
  returnTo: z.string().optional(),
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit code from your email."),
})

export const desktopLinkSchema = z.object({
  returnTo: z.string().optional(),
})

export const desktopExchangeSchema = z.object({
  code: z.string().trim().min(12).max(128),
})

export const configSyncSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
})