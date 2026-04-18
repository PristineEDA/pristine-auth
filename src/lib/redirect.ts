const ALLOWED_REDIRECT_PREFIXES = ["pristine://"];

export function validateRedirectTo(redirectTo: string | null): string {
  if (!redirectTo) return "pristine://auth-callback";
  if (
    ALLOWED_REDIRECT_PREFIXES.some((prefix) => redirectTo.startsWith(prefix))
  ) {
    return redirectTo;
  }
  return "pristine://auth-callback";
}
