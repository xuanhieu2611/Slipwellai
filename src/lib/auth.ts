const fallbackPath = "/";

export type AuthCallbackError = "invalid_link" | "recovery_required";

export const authErrorMessages: Record<AuthCallbackError, string> = {
  invalid_link: "That sign-in link is invalid or has expired. Please try again.",
  recovery_required: "Open a new password-reset link, then choose a new password.",
};

/**
 * Auth callback destinations are user-controlled query values. Keep redirects
 * inside this application instead of reflecting an arbitrary external URL.
 */
export function safeReturnPath(value: string | null | undefined, fallback = fallbackPath): string {
  if (!value) return fallback;

  try {
    const decoded = decodeURIComponent(value);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) return fallback;
    const parsed = new URL(decoded, "https://slipwell.invalid");
    if (parsed.origin !== "https://slipwell.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function configuredAppOrigin(requestOrigin: string): string | null {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (!configured) return process.env.NODE_ENV === "production" ? null : requestOrigin;

  try {
    const parsed = new URL(configured);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.origin;
  } catch {
    return null;
  }
}

export function authCallbackUrl(origin: string, next?: string): string {
  const url = new URL("/auth/callback", origin);
  const safeNext = safeReturnPath(next);
  if (safeNext !== fallbackPath) url.searchParams.set("next", safeNext);
  return url.toString();
}

export function authErrorUrl(origin: string, error: AuthCallbackError): string {
  const url = new URL("/", origin);
  url.searchParams.set("auth", error);
  return url.toString();
}
