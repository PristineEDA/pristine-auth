"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface VerifyFormProps {
  email: string;
  redirectTo: string;
}

export function VerifyForm({ email, redirectTo }: VerifyFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState("");

  async function handleVerify() {
    if (token.length !== 6) return;

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "signup",
      });

      if (verifyError) {
        setError(verifyError.message);
        setLoading(false);
        return;
      }

      // Navigate to auth-redirect to send tokens via deep link
      const params = new URLSearchParams({ redirect_to: redirectTo });
      router.push(`/auth-redirect?${params.toString()}`);
    } catch {
      setError("验证时发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) {
        setError(resendError.message);
      }
    } catch {
      setError("重发验证码时发生错误");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center text-sm text-muted-foreground">
        验证码已发送至 <span className="font-medium text-foreground">{email}</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Label htmlFor="otp">验证码</Label>
        <InputOTP
          maxLength={6}
          value={token}
          onChange={setToken}
          disabled={loading}
          data-testid="otp-input"
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        className="w-full"
        disabled={loading || token.length !== 6}
        onClick={handleVerify}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        验证
      </Button>

      <div className="text-center">
        <Button
          variant="ghost"
          size="sm"
          disabled={resending}
          onClick={handleResend}
          className="text-xs text-muted-foreground"
        >
          {resending ? "发送中..." : "没收到？重新发送验证码"}
        </Button>
      </div>
    </div>
  );
}
