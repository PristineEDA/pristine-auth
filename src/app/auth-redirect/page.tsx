"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateRedirectTo } from "@/lib/redirect";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function AuthRedirectContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function performRedirect() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setStatus("error");
          setErrorMessage("未找到有效的登录会话");
          return;
        }

        const rawRedirect = searchParams.get("redirect_to");
        const redirectTo = validateRedirectTo(rawRedirect);

        // Build deep link URL with tokens
        const url = new URL(redirectTo);
        url.searchParams.set("access_token", session.access_token);
        url.searchParams.set("refresh_token", session.refresh_token);

        setStatus("success");

        // Navigate to deep link
        window.location.href = url.toString();
      } catch {
        setStatus("error");
        setErrorMessage("跳转时发生错误");
      }
    }

    performRedirect();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              正在跳转回 Pristine IDE...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <p className="text-sm font-medium">认证成功！</p>
            <p className="text-sm text-muted-foreground">
              正在返回 Pristine IDE，如果没有自动跳转，请手动返回应用。
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">
              {errorMessage || "跳转失败"}
            </p>
            <p className="text-sm text-muted-foreground">
              请手动返回 Pristine IDE 并重试。
            </p>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/login")}
            >
              返回登录
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AuthRedirectContent />
    </Suspense>
  );
}
