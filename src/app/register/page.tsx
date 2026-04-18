import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { validateRedirectTo } from "@/lib/redirect";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawRedirect =
    typeof params.redirect_to === "string" ? params.redirect_to : null;
  const redirectTo = validateRedirectTo(rawRedirect);

  return (
    <AuthLayout title="注册 Pristine" description="创建您的 Pristine 账户">
      <RegisterForm redirectTo={redirectTo} />
    </AuthLayout>
  );
}
