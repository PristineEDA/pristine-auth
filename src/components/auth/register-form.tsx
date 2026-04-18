"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AvatarUpload } from "@/components/auth/avatar-upload";
import { createClient } from "@/lib/supabase/client";
import { registerSchema } from "@/lib/validators";
import { Loader2 } from "lucide-react";

interface RegisterFormProps {
  redirectTo: string;
}

export function RegisterForm({ redirectTo }: RegisterFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [username, setUsername] = useState("");

  function handleAvatarSelected(file: File) {
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const result = registerSchema.safeParse(raw);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path?.[0];
        if (key && typeof key === "string") {
          errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      let avatarUrl: string | null = null;

      // Upload avatar if selected (we'll update the profile after signup)
      // We need the user ID first, so we do signup first then upload

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: result.data.email,
          password: result.data.password,
          options: {
            data: {
              username: result.data.username,
              avatar_url: null,
            },
            emailRedirectTo: undefined,
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // Upload avatar if file was selected and we got a user
      if (avatarFile && signUpData.user) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${signUpData.user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath);
          avatarUrl = publicUrl;

          // Update the user metadata with avatar URL
          await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl },
          });
        }
      }

      // Navigate to verify page
      const params = new URLSearchParams({
        email: result.data.email,
        redirect_to: redirectTo,
      });
      router.push(`/verify?${params.toString()}`);
    } catch {
      setError("注册时发生错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AvatarUpload
        onFileSelected={handleAvatarSelected}
        previewUrl={avatarPreview}
        username={username}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          name="username"
          placeholder="输入用户名"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
        {fieldErrors.username && (
          <p className="text-xs text-destructive">{fieldErrors.username}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          required
          disabled={loading}
        />
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="至少 6 个字符"
          required
          disabled={loading}
        />
        {fieldErrors.password && (
          <p className="text-xs text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">确认密码</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="再次输入密码"
          required
          disabled={loading}
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        注册
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        已有账户？{" "}
        <Link
          href={`/login?redirect_to=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          登录
        </Link>
      </p>
    </form>
  );
}
