import type { SystemState } from "./types.ts";

export function getTelegramChatId(sessionId: string): number | null {
  if (sessionId.startsWith("customer_")) {
    const maybeIdStr = sessionId.split("_")[1];
    const maybeId = Number(maybeIdStr);
    if (!isNaN(maybeId) && maybeId > 0) return maybeId;
  }
  return null;
}

export function toTelegramHtml(markdown: string): string {
  if (!markdown) return "";
  let escaped = markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
  escaped = escaped.replace(/__(.*?)__/g, "<b>$1</b>");
  escaped = escaped.replace(/\*([^\*]+)\*/g, "<i>$1</i>");
  escaped = escaped.replace(/_([^_]+)_/g, "<i>$1</i>");
  escaped = escaped.replace(/`([^`]+)`/g, "<code>$1</code>");
  return escaped;
}

export async function sendTelegramMessage(
  state: SystemState,
  chatId: string | number,
  text: string,
  options?: { reply_markup?: unknown }
): Promise<void> {
  const token = state.config.telegramBotToken;
  if (!token) return;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: toTelegramHtml(text),
    parse_mode: "HTML",
  };
  if (options?.reply_markup) payload.reply_markup = options.reply_markup;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error("[Telegram] sendMessage failed:", await res.text());
}

export async function registerTelegramWebhook(userId: string, token: string): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook/${userId}`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const data = await res.json();
  console.log("[Telegram] setWebhook:", data);
}
