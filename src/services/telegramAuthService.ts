import { supabase } from "../utils/supabase";

export const TARGET_BOT_USERNAME = "Jjkql_bot";

export interface TelegramLinkTokenRecord {
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  consumed: boolean;
  telegram_user_id?: number | null;
  telegram_username?: string | null;
}

export interface TelegramLinkResult {
  token: string;
  deepLink: string;
  expiresAt: string;
}

/**
 * Creates a single-use 5-minute link token bound to the authenticated User A.
 */
export async function createTelegramLinkToken(
  authenticatedUserId: string
): Promise<TelegramLinkResult> {
  if (!authenticatedUserId) {
    throw new Error("Cannot create Telegram link token without authenticated user ID");
  }

  // Generate cryptographically secure unique token
  const randomSuffix = window.crypto?.randomUUID
    ? window.crypto.randomUUID().replace(/-/g, "").slice(0, 20)
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

  const token = `auth_${randomSuffix}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error } = await supabase.from("telegram_auth_tokens").insert({
    token,
    user_id: authenticatedUserId,
    expires_at: expiresAt,
    consumed: false,
  });

  if (error) {
    console.error("Failed to insert telegram_auth_token:", error);
    throw new Error(`Database error: ${error.message}`);
  }

  const deepLink = `https://t.me/${TARGET_BOT_USERNAME}?start=link_${token}`;

  return {
    token,
    deepLink,
    expiresAt,
  };
}

/**
 * Subscribes via Supabase Realtime to detect when the token has been consumed by @Jjkql_bot.
 */
export function subscribeToTokenVerification(
  token: string,
  onVerified: (record: TelegramLinkTokenRecord) => void
): () => void {
  const channel = supabase
    .channel(`tg_auth_${token}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "telegram_auth_tokens",
        filter: `token=eq.${token}`,
      },
      (payload) => {
        const record = payload.new as TelegramLinkTokenRecord;
        if (record && record.consumed) {
          onVerified(record);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Checks if User A has already linked their Telegram account in the shops table.
 */
export async function getLinkedTelegramAccount(
  authenticatedUserId: string
): Promise<{ linked: boolean; telegramUserId?: number; telegramUsername?: string }> {
  if (!authenticatedUserId) return { linked: false };

  const { data, error } = await supabase
    .from("shops")
    .select("telegram_user_id, onboarding_profile")
    .eq("owner_id", authenticatedUserId)
    .single();

  if (error || !data) {
    return { linked: false };
  }

  const tgId = data.telegram_user_id;
  let username: string | undefined;
  if (data.onboarding_profile && typeof data.onboarding_profile === "object") {
    username = (data.onboarding_profile as any).telegram_username;
  }

  return {
    linked: !!tgId,
    telegramUserId: tgId || undefined,
    telegramUsername: username,
  };
}
