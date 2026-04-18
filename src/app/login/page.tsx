import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { validateRedirectTo } from "@/lib/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawRedirect =
    typeof params.redirect_to === "string" ? params.redirect_to : null;
  const redirectTo = validateRedirectTo(rawRedirect);

  return (
    <AuthLayout title="登录 Pristine" description="使用您的账户登录">
      <LoginForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
