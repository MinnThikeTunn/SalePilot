import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import type { GoogleGenAI } from "npm:@google/genai@2.4.0";
import type { SystemState } from "./types.ts";
import { getGeminiClient } from "./gemini.ts";
import { getTelegramChatId, sendTelegramMessage } from "./telegram.ts";
import { loadState, saveState } from "./state.ts";

export type ShopContext = {
  userId: string;
  state: SystemState;
  save: () => Promise<void>;
  getGemini: () => GoogleGenAI;
  getTelegramChatId: (sessionId: string) => number | null;
  sendTelegram: (chatId: string | number, text: string, options?: { reply_markup?: unknown }) => Promise<void>;
};

export async function createShopContext(userId: string): Promise<ShopContext> {
  const state = await loadState(userId);
  const ctx: ShopContext = {
    userId,
    state,
    save: async () => {
      await saveState(userId, ctx.state);
    },
    getGemini: getGeminiClient,
    getTelegramChatId,
    sendTelegram: (chatId, text, options) => sendTelegramMessage(ctx.state, chatId, text, options),
  };
  return ctx;
}

export async function createShopContextByShopId(shopId: string): Promise<ShopContext> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Check new shops table first
  const { data: shopData } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("shop_id", shopId)
    .maybeSingle();

  if (shopData?.owner_id) {
    return createShopContext(shopData.owner_id);
  }

  // Fallback to legacy business_onboarding
  const { data: legacyData, error: legacyError } = await supabase
    .from("business_onboarding")
    .select("user_id")
    .eq("shop_id", shopId)
    .single();

  if (legacyError || !legacyData) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  return createShopContext(legacyData.user_id);
}
