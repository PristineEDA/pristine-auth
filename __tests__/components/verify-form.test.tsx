import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { VerifyForm } from "@/components/auth/verify-form";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      verifyOtp: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test", refresh_token: "test" } },
        error: null,
      }),
      resend: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

describe("VerifyForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders OTP input and verify button", () => {
    render(
      <VerifyForm
        email="user@example.com"
        redirectTo="pristine://auth-callback"
      />
    );

    expect(screen.getByText("验证码")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "验证" })
    ).toBeInTheDocument();
  });

  it("displays target email address", () => {
    render(
      <VerifyForm
        email="user@example.com"
        redirectTo="pristine://auth-callback"
      />
    );

    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("has resend button", () => {
    render(
      <VerifyForm
        email="user@example.com"
        redirectTo="pristine://auth-callback"
      />
    );

    expect(
      screen.getByRole("button", { name: "没收到？重新发送验证码" })
    ).toBeInTheDocument();
  });

  it("verify button is disabled when no OTP entered", () => {
    render(
      <VerifyForm
        email="user@example.com"
        redirectTo="pristine://auth-callback"
      />
    );

    const verifyBtn = screen.getByRole("button", { name: "验证" });
    expect(verifyBtn).toBeDisabled();
  });
});
