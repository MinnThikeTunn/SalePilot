import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireUser } from "../_shared/auth.ts";
import { createShopContext } from "../_shared/context.ts";
import { handleAction } from "../_shared/handlers.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);

  const authResult = await requireUser(req);
  if (authResult instanceof Response) {
    return new Response(authResult.body, {
      status: authResult.status,
      headers: { ...Object.fromEntries(authResult.headers), "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    let action = url.searchParams.get("action") || "";
    let body: Record<string, unknown> = {};

    if (req.method === "POST") {
      const parsed = await req.json().catch(() => ({}));
      body = typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
      if (!action && body.action) action = String(body.action);
    }

    if (!action) {
      return jsonResponse(req, { error: "Missing action" }, 400);
    }

    const ctx = await createShopContext(authResult.userId);
    const result = await handleAction(ctx, action, body, url.searchParams);
    return jsonResponse(req, result);
  } catch (e) {
    console.error("[api]", e);
    return jsonResponse(req, { error: String(e) }, 500);
  }
});
