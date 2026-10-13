import type { AuthError } from "@supabase/supabase-js";

/** Map Supabase Auth errors to clear UI messages (especially 429 rate limits). */
export function formatAuthError(error: AuthError | null): string | null {
  if (!error) return null;

  const code = error.code ?? "";
  const msg = error.message ?? "";
  const status = error.status;

  if (
    status === 429 ||
    code === "over_email_send_rate_limit" ||
    /rate limit/i.test(msg)
  ) {
    return (
      "Sign-up is temporarily blocked by Supabase email rate limits (about 2 emails/hour on the built-in mailer). " +
      "Wait 30–60 minutes, use Sign in if you already registered, or in the Supabase Dashboard go to " +
      "Authentication → Providers → Email and turn off “Confirm email” for local dev, " +
      "or Authentication → Rate Limits and raise the email limit / add custom SMTP."
    );
  }

  if (code === "user_already_exists" || /already registered/i.test(msg)) {
    return "This email is already registered. Try Sign in instead.";
  }

  if (/only request this once every/i.test(msg)) {
    return "Please wait a minute before trying again with the same email.";
  }

  return msg || "Authentication failed. Please try again.";
}
