import { createShopContext } from "../_shared/context.ts";
import { handleTelegramWebhook } from "../_shared/botEngine.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const userId = parts[parts.length - 1];

  if (!userId || userId === "telegram-webhook") {
    return new Response("Missing userId", { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  // Acknowledge immediately (Telegram retries on timeout)
  const work = (async () => {
    try {
      const ctx = await createShopContext(userId);
      await handleTelegramWebhook(ctx, body as Record<string, unknown>);
    } catch (e) {
      console.error("[telegram-webhook]", e);
    }
  })();

  // @ts-ignore EdgeRuntime waitUntil
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
    EdgeRuntime.waitUntil(work);
  } else {
    await work;
  }

  return new Response("OK", { status: 200 });
});
