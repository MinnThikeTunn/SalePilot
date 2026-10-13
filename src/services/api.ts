import { supabase } from "../utils/supabase";
import { getShopState, saveShopState } from "./shopState";
import { getState } from "./clientStore";
import { cloneDefaultState } from "../data/defaultState";
import { getMarketingImageUrl, getMarketingInsights, getStrategyBriefing } from "./fallbackAi";

/** Omnichannel_backend base URL (Messenger OAuth + webhooks). */
const OMNICHANNEL_URL =
  (import.meta.env.VITE_OMNICHANNEL_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

async function invokeOmnichannel<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${OMNICHANNEL_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = {};
  }

  if (!res.ok) {
    const err =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof (payload as { error: unknown }).error === "string"
      ? (payload as { error: string }).error
      : `Omnichannel request failed (${res.status})`;
    throw new Error(err);
  }

  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    (payload as { error?: string }).error
  ) {
    throw new Error((payload as { error: string }).error);
  }

  return payload as T;
}

/** Messenger routes talk to Omnichannel_backend directly (no Supabase deploy needed). */
async function invokeMessengerAction<T>(
  action: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  switch (action) {
    case "messenger/status":
      return invokeOmnichannel<T>("/messenger/status");
    case "messenger/auth-url": {
      const redirectUri = body.redirect_uri ?? body.redirectUri;
      const qs = redirectUri
        ? `?redirect_uri=${encodeURIComponent(String(redirectUri))}`
        : "";
      return invokeOmnichannel<T>(`/messenger/auth-url${qs}`);
    }
    case "messenger/oauth/complete":
      return invokeOmnichannel<T>("/messenger/oauth/complete", {
        method: "POST",
        body: JSON.stringify({
          code: body.code,
          state: body.state,
          redirect_uri: body.redirect_uri ?? body.redirectUri,
        }),
      });
    case "messenger/connect-page":
      return invokeOmnichannel<T>("/messenger/connect-page", {
        method: "POST",
        body: JSON.stringify({
          page_id: body.pageId ?? body.page_id,
        }),
      });
    case "messenger/disconnect":
      return invokeOmnichannel<T>("/messenger/disconnect", { method: "POST" });
    default:
      throw new Error(`Unknown messenger action: ${action}`);
  }
}

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
      state.orders = state.orders.map((o) => (o.id === orderId ? { ...o, status } : o));
      await saveShopState(userId, state);
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
    const lang = (body.lang as "en" | "my") || "en";
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
  if (action.startsWith("messenger/")) {
    return invokeMessengerAction<T>(action, body);
  }

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

export { OMNICHANNEL_URL };
