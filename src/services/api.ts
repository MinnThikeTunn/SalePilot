import { supabase } from "../utils/supabase";
import { getShopState, saveShopState } from "./shopState";
import { getState } from "./clientStore";
import { cloneDefaultState } from "../data/defaultState";
import { getMarketingImageUrl, getMarketingInsights, getStrategyBriefing } from "./fallbackAi";



/** Client-side fallback handler when Edge Functions are not deployed */
async function fallbackLocalAction<T>(
  action: string,
  body: Record<string, unknown> = {},
  userId?: string
): Promise<T> {
  if (action === "orders/update") {
    if (userId) {
      const state = await getShopState(userId);
      const orderId = body.orderId as string;
      const status = body.status as any;
      const targetOrder = state.orders.find((o) => o.id === orderId);
      const prevStatus = targetOrder?.status;
      state.orders = state.orders.map((o) => (o.id === orderId ? { ...o, status } : o));

      if (status === "confirmed" && prevStatus !== "confirmed" && targetOrder) {
        (targetOrder.items || []).forEach((item) => {
          const prod = state.products.find(
            (p) => p.id === item.productId || (item.productName && p.name === item.productName)
          );
          if (prod) {
            prod.stock = Math.max(0, (prod.stock || 0) - (item.quantity || 1));
          }
        });
      }

      await saveShopState(userId, state);
      try {
        await supabase
          .from("orders")
          .update({ status, updated_at: new Date().toISOString() })
          .eq("id", orderId);
      } catch (err) {
        console.warn("Error updating orders table in fallbackLocalAction:", err);
      }
    }
    return { success: true } as T;
  }

  if (action === "bot/takeover") {
    if (userId) {
      const state = await getShopState(userId);
      const sessId = String(body.sessionId || "default_customer");
      if (state.sessions[sessId]) {
        state.sessions[sessId].liveTakeoverActive = true;
        await saveShopState(userId, state);
      }
    }
    return { success: true } as T;
  }

  if (action === "bot/release") {
    if (userId) {
      const state = await getShopState(userId);
      const sessId = String(body.sessionId || "default_customer");
      if (state.sessions[sessId]) {
        state.sessions[sessId].liveTakeoverActive = false;
        await saveShopState(userId, state);
      }
    }
    return { success: true } as T;
  }

  if (action === "bot/owner-reply") {
    if (userId) {
      const state = await getShopState(userId);
      const sessId = String(body.sessionId || "default_customer");
      if (state.sessions[sessId]) {
        state.sessions[sessId].messages.push({
          id: `msg-${Date.now()}`,
          sender: "bot",
          content: String(body.content || ""),
          timestamp: new Date().toISOString(),
        });
        await saveShopState(userId, state);
      }
    }
    return { success: true } as T;
  }

  if (action === "reset") {
    if (userId) {
      const state = cloneDefaultState();
      await saveShopState(userId, state);
    }
    return { success: true } as T;
  }

  if (action === "ai/strategy") {
    const lang = "en";
    const state = userId ? await getShopState(userId) : getState();
    return { success: true, strategy: getStrategyBriefing(state, lang) } as T;
  }

  if (action === "ai/marketing/insights") {
    const campaignType = String(body.campaignType || "flash_sale");
    const productIds = Array.isArray(body.productIds) ? (body.productIds as string[]) : [];
    const state = userId ? await getShopState(userId) : getState();
    return { success: true, insights: getMarketingInsights(state, campaignType, productIds) } as T;
  }

  if (action === "ai/marketing/image") {
    const campaignType = String(body.campaignType || "flash_sale");
    return { success: true, imageUrl: getMarketingImageUrl(campaignType) } as T;
  }

  return { success: true } as T;
}

export async function invokeApi<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
  query?: Record<string, string>
): Promise<T> {

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const userId = sessionData.session?.user?.id;

  // Attempt Supabase Edge Function only if explicitly enabled via environment variable
  const useEdgeFunctions = import.meta.env.VITE_USE_EDGE_FUNCTIONS === "true";
  if (useEdgeFunctions && token) {
    try {
      const { data, error } = await supabase.functions.invoke("api", {
        body: { action, ...body, ...query },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!error && data) {
        if (
          typeof data === "object" &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
        ) {
          throw new Error((data as { error: string }).error);
        }
        return data as T;
      }
    } catch {
      // Edge function unavailable or failed, fallback to direct client handler
    }
  }

  // Graceful client-side fallback
  return fallbackLocalAction<T>(action, body, userId);
}

