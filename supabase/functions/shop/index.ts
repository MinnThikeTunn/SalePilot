import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { createShopContextByShopId } from "../_shared/context.ts";
import { processCustomerMessage } from "../_shared/botEngine.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleOptions(req);

  try {
    const url = new URL(req.url);
    let shopId = url.searchParams.get("shopId") || "";
    let action = url.searchParams.get("action") || "";
    let body: Record<string, unknown> = {};

    if (req.method === "POST") {
      const parsed = await req.json().catch(() => ({}));
      body = typeof parsed === "object" && parsed ? (parsed as Record<string, unknown>) : {};
      if (!action && body.action) action = String(body.action);
      if (!shopId && body.shopId) shopId = String(body.shopId);
    }

    if (!shopId) {
      return jsonResponse(req, { error: "Missing shopId" }, 400);
    }

    const ctx = await createShopContextByShopId(shopId);

    if (action === "get-state") {
      // Return only public data
      return jsonResponse(req, {
        config: {
          shopName: ctx.state.config.shopName,
          ownerName: ctx.state.config.ownerName,
          currency: ctx.state.config.currency,
        },
        products: ctx.state.products,
        deliveryZones: ctx.state.deliveryZones,
      });
    }

    if (action === "chat") {
      const sessionId = String(body.sessionId || "public_customer");
      const result = await processCustomerMessage(ctx, sessionId, body as never);
      return jsonResponse(req, result);
    }

    return jsonResponse(req, { error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    console.error("[shop]", e);
    return jsonResponse(req, { error: String(e) }, 500);
  }
});
