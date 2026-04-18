import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "@/components/auth/register-form";

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
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: () => ({
          data: { publicUrl: "https://example.com/avatar.png" },
        }),
      }),
    },
  }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<RegisterForm redirectTo="pristine://auth-callback" />);

    expect(screen.getByLabelText("用户名")).toBeInTheDocument();
    expect(screen.getByLabelText("邮箱")).toBeInTheDocument();
    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByLabelText("确认密码")).toBeInTheDocument();
    expect(screen.getByText("头像")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "注册" })
    ).toBeInTheDocument();
  });

  it("renders link to login page", () => {
    render(<RegisterForm redirectTo="pristine://auth-callback" />);

    expect(screen.getByText("登录")).toBeInTheDocument();
  });

  it("shows validation error for short username", async () => {
    const user = userEvent.setup();
    render(<RegisterForm redirectTo="pristine://auth-callback" />);

    const usernameInput = screen.getByLabelText("用户名");
    const emailInput = screen.getByLabelText("邮箱");
    const passwordInput = screen.getByLabelText("密码");
    const confirmInput = screen.getByLabelText("确认密码");
    const submitBtn = screen.getByRole("button", { name: "注册" });

    await user.type(usernameInput, "a");
    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "123456");
    await user.type(confirmInput, "123456");
    await user.click(submitBtn);

    expect(
      screen.getByText("用户名至少 2 个字符")
    ).toBeInTheDocument();
  });

  it("shows validation error for mismatched passwords", async () => {
    const user = userEvent.setup();
    render(<RegisterForm redirectTo="pristine://auth-callback" />);

    const usernameInput = screen.getByLabelText("用户名");
    const emailInput = screen.getByLabelText("邮箱");
    const passwordInput = screen.getByLabelText("密码");
    const confirmInput = screen.getByLabelText("确认密码");
    const submitBtn = screen.getByRole("button", { name: "注册" });

    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "user@example.com");
    await user.type(passwordInput, "123456");
    await user.type(confirmInput, "654321");
    await user.click(submitBtn);

    expect(
      screen.getByText("两次输入的密码不一致")
    ).toBeInTheDocument();
  });
});
