import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, verifyOtpSchema, settingsSchema } from "@/lib/validators";

describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-email",
      password: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "user@example.com",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "user@example.com",
      password: "123456",
      confirmPassword: "654321",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short username", () => {
    const result = registerSchema.safeParse({
      username: "a",
      email: "user@example.com",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(false);
  });

  it("rejects long username", () => {
    const result = registerSchema.safeParse({
      username: "a".repeat(31),
      email: "user@example.com",
      password: "123456",
      confirmPassword: "123456",
    });
    expect(result.success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("accepts valid 6-digit token", () => {
    const result = verifyOtpSchema.safeParse({
      email: "user@example.com",
      token: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short token", () => {
    const result = verifyOtpSchema.safeParse({
      email: "user@example.com",
      token: "12345",
    });
    expect(result.success).toBe(false);
  });

  it("rejects long token", () => {
    const result = verifyOtpSchema.safeParse({
      email: "user@example.com",
      token: "1234567",
    });
    expect(result.success).toBe(false);
  });
});

describe("settingsSchema", () => {
  it("accepts valid config object", () => {
    const result = settingsSchema.safeParse({
      config_data: { theme: "dark", fontSize: 14 },
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty config object", () => {
    const result = settingsSchema.safeParse({
      config_data: {},
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing config_data", () => {
    const result = settingsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
