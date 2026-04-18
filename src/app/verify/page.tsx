import { AuthLayout } from "@/components/layout/auth-layout";
import { VerifyForm } from "@/components/auth/verify-form";
import { validateRedirectTo } from "@/lib/redirect";
import { redirect } from "next/navigation";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : null;
  const rawRedirect =
    typeof params.redirect_to === "string" ? params.redirect_to : null;
  const redirectTo = validateRedirectTo(rawRedirect);

  if (!email) {
    redirect("/register");
  }

  return (
    <AuthLayout title="验证邮箱" description="请输入发送到您邮箱的 6 位验证码">
      <VerifyForm email={email} redirectTo={redirectTo} />
    </AuthLayout>
  );
}
