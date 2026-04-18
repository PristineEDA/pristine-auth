import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";

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
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test", refresh_token: "test" } },
        error: null,
      }),
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm redirectTo="pristine://auth-callback" />);

    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "登录" })
    ).toBeInTheDocument();
  });

  it("renders link to register page", () => {
    render(<LoginForm redirectTo="pristine://auth-callback" />);

    expect(screen.getByText("注册")).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    render(<LoginForm redirectTo="pristine://auth-callback" />);

    const emailInput = screen.getByLabelText("邮箱");
    const passwordInput = screen.getByLabelText("密码");
    const submitBtn = screen.getByRole("button", { name: "登录" });

    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "12345");
    await user.click(submitBtn);

    expect(
      screen.getByText("密码至少 6 个字符")
    ).toBeInTheDocument();
  });
});
