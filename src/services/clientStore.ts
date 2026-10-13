import { cloneDefaultState, DEFAULT_STATE } from "../data/defaultState";
import { createEmptyShopState, getDefaultSessions } from "./defaults";
import type { Product, ShopConfig, SystemState, DeliveryZone, DeliveryZoneFormData, Order, TelegramSession, CampaignRecord } from "../types";
import { processCustomerMessage } from "./botSimulator";
import { getMarketingImageUrl, getMarketingInsights, getStrategyBriefing } from "./fallbackAi";
import { invokeApi } from "./api";
let activeUserId: string | null = null;
let memoryState: SystemState | null = null;

export function setActiveUser(userId: string | null) {
  if (activeUserId !== userId) {
    activeUserId = userId;
    memoryState = null;
  }
}

export function clearUserState(userId?: string) {
  memoryState = null;
  if (typeof localStorage !== "undefined") {
    const key = userId ? `sales_brain_state_${userId}` : (activeUserId ? `sales_brain_state_${activeUserId}` : "sales_brain_state_guest");
    localStorage.removeItem(key);
    localStorage.removeItem("sales_brain_state_v3");
    localStorage.removeItem("sales_brain_state_v2");
    localStorage.removeItem("sales_brain_state_v1");
  }
}

function getStorageKey(): string {
  if (activeUserId) {
    return `sales_brain_state_${activeUserId}`;
  }
  return "sales_brain_state_guest";
}

function sanitizeSessionsToEnglish(sessions: Record<string, TelegramSession>): Record<string, TelegramSession> {
  const defaults = getDefaultSessions();
  const sanitized = { ...sessions };
  // If default_customer has old Burmese text, replace with updated English defaults
  if (sanitized.default_customer && sanitized.default_customer.messages.some(m => m.content.includes("မင်္ဂလာပါ") || m.content.includes("hoke ke par"))) {
    sanitized.default_customer = defaults.default_customer;
  }
  if (sanitized.sess_aung_tg && sanitized.sess_aung_tg.messages.some(m => m.content.includes("KPay") && m.content.includes("ရပါတယ်"))) {
    sanitized.sess_aung_tg = defaults.sess_aung_tg;
  }
  return sanitized;
}

function load(): SystemState {
  if (memoryState) return memoryState;
  const key = getStorageKey();
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("sales_brain_state_v1")) {
      localStorage.removeItem("sales_brain_state_v1");
    }
    const raw = typeof localStorage !== "undefined"
      ? (localStorage.getItem(key) || (!activeUserId ? (localStorage.getItem("sales_brain_state_v3") || localStorage.getItem("sales_brain_state_v2")) : null))
      : null;
    if (raw) {
      const base = activeUserId ? createEmptyShopState() : cloneDefaultState();
      memoryState = { ...base, ...JSON.parse(raw) };
      if (!Array.isArray(memoryState.deliveryZones)) {
        memoryState.deliveryZones = [];
      }
      if (!Array.isArray(memoryState.campaignRecords)) {
        memoryState.campaignRecords = [];
      }
      // Purge any unowned or foreign orders that leaked into local storage for this user
      if (activeUserId && Array.isArray(memoryState.orders)) {
        memoryState.orders = memoryState.orders.filter(
          (o) => o.owner_id === activeUserId || (memoryState!.config.shopId && (o as any).shop_id === memoryState!.config.shopId)
        );
      }
      if (!memoryState.sessions || Object.keys(memoryState.sessions).length === 0) {
        memoryState.sessions = getDefaultSessions();
      } else {
        memoryState.sessions = sanitizeSessionsToEnglish(memoryState.sessions);
      }
      save();
      return memoryState;
    }
  } catch {
    /* ignore */
  }

  // Brand new logged-in account starts with clean, isolated empty state
  memoryState = activeUserId ? createEmptyShopState() : cloneDefaultState();
  if (!Array.isArray(memoryState.deliveryZones)) {
    memoryState.deliveryZones = [];
  }
  if (!Array.isArray(memoryState.campaignRecords)) {
    memoryState.campaignRecords = [];
  }
  if (!memoryState.sessions || Object.keys(memoryState.sessions).length === 0) {
    memoryState.sessions = getDefaultSessions();
  }
  save();
  return memoryState;
}

function save() {
  if (!memoryState) return;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(getStorageKey(), JSON.stringify(memoryState));
    }
  } catch (e) {
    console.warn("Could not persist state to localStorage", e);
  }
}

export function getState(): SystemState {
  return load();
}

export function setStoreState(next: SystemState): void {
  memoryState = next;
  save();
}

export function resetState(): SystemState {
  memoryState = activeUserId ? createEmptyShopState() : cloneDefaultState();
  save();
  return memoryState;
}

export function saveOnboarding(config: Partial<ShopConfig>) {
  const state = load();
  state.config = {
    ...state.config,
    shopName: config.shopName ?? state.config.shopName,
    ownerName: config.ownerName ?? state.config.ownerName,
    phone: config.phone ?? state.config.phone,
    telegramBotToken: config.telegramBotToken ?? state.config.telegramBotToken,
    telegramBotUsername: config.telegramBotUsername ?? state.config.telegramBotUsername,
    onboardingCompleted: config.onboardingCompleted ?? true,
    currency: "MMK",
  };
  save();
  return { success: true, config: state.config };
}

export function mutateProducts(action: string, product: Partial<Product> & { id?: string }) {
  const state = load();
  if (action === "add") {
    state.products.push({
      id: `prod-${Date.now()}`,
      name: product.name || "New Product",
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      description: product.description || "",
      image:
        product.image ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400",
      varies: product.varies || [],
    });
  } else if (action === "edit" && product.id) {
    state.products = state.products.map((p) =>
      p.id === product.id
        ? {
            ...p,
            ...product,
            price: Number(product.price) ?? p.price,
            stock: Number(product.stock) ?? p.stock,
          }
        : p
    );
  } else if (action === "delete" && product.id) {
    state.products = state.products.filter((p) => p.id !== product.id);
  }
  save();
  return state;
}

export function mutateDeliveryZone(
  action: string,
  payload: { zone?: DeliveryZoneFormData; id?: string }
) {
  const state = load();
  if (action === "add" && payload.zone) {
    state.deliveryZones.unshift({
      ...payload.zone,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    });
  } else if (action === "delete" && payload.id) {
    state.deliveryZones = state.deliveryZones.filter((z) => z.id !== payload.id);
  } else if (action === "update" && payload.id && payload.zone) {
    state.deliveryZones = state.deliveryZones.map((z) =>
      z.id === payload.id ? { ...z, ...payload.zone } : z
    );
  }
  save();
  return state;
}

export function setClientDeliveryZones(zones: DeliveryZone[]) {
  const state = load();
  state.deliveryZones = zones;
  save();
  return state;
}

export function addOrder(order: Order) {
  const state = load();
  if (activeUserId && !order.owner_id) {
    order.owner_id = activeUserId;
  }
  if (state.config.shopId && !(order as any).shop_id) {
    (order as any).shop_id = state.config.shopId;
  }
  state.orders.unshift(order);
  save();
  return state;
}

export function clearSessionCart(sessionId?: string) {
  const state = load();
  if (sessionId && state.sessions[sessionId]) {
    state.sessions[sessionId].cart = [];
  }
  Object.values(state.sessions).forEach((s) => {
    if (!sessionId || s.sessionId === sessionId || s.customerTelegramId === sessionId) {
      s.cart = [];
    }
  });
  save();
  return state;
}

export function updateOrderStatus(orderId: string, status: "confirmed" | "cancelled" | "completed") {
  const state = load();
  const order = state.orders.find((o) => o.id === orderId);
  if (order) {
    const prevStatus = order.status;
    order.status = status;
    if (status === "confirmed" && prevStatus !== "confirmed") {
      (order.items || []).forEach((item) => {
        const prod = state.products.find(
          (p) => p.id === item.productId || (item.productName && p.name === item.productName)
        );
        if (prod) {
          prod.stock = Math.max(0, (prod.stock || 0) - (item.quantity || 1));
        }
      });
    }
    if (status === "confirmed" || status === "completed") {
      Object.values(state.sessions).forEach((s) => {
        if (s.activeOrderId === orderId || s.customerTelegramId === order.customerTelegramId) {
          s.cart = [];
        }
      });
    }
  }
  save();
  return state;
}

export function updateOrderPaymentDetails(
  orderId: string,
  paymentDetails: {
    method: "KPay" | "WavePay" | "CBPay" | "AYA Pay" | "CoD";
    transactionId: string;
    screenshotUrl?: string;
  }
) {
  const state = load();
  const order = state.orders.find((o) => o.id === orderId || o.invoiceId === orderId);
  if (order) {
    order.paymentDetails = paymentDetails;
  }
  save();
  return state;
}


export function botTakeover(sessionId: string) {
  const state = load();
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].liveTakeoverActive = true;
    state.sessions[sessionId].messages.push({
      id: `sys-${Date.now()}`,
      sender: "system",
      content: "Owner has taken over this chat. Candy AI paused.",
      timestamp: new Date().toISOString(),
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sales_brain_session_updated", { detail: state.sessions[sessionId] })
      );
    }
  }
  save();
  return { success: true };
}

export function botRelease(sessionId: string) {
  const state = load();
  if (state.sessions[sessionId]) {
    state.sessions[sessionId].liveTakeoverActive = false;
    state.sessions[sessionId].messages.push({
      id: `sys-${Date.now()}`,
      sender: "system",
      content: "AI assistant Candy is active again.",
      timestamp: new Date().toISOString(),
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sales_brain_session_updated", { detail: state.sessions[sessionId] })
      );
    }
  }
  save();
  return { success: true };
}

export function botOwnerReply(sessionId: string, content: string) {
  const state = load();
  const session = state.sessions[sessionId];
  if (session) {
    session.messages.push({
      id: `mo-${Date.now()}`,
      sender: "owner",
      content,
      timestamp: new Date().toISOString(),
    });
    session.lastActive = new Date().toISOString();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("sales_brain_session_updated", { detail: session })
      );
    }
  }
  save();
  return { success: true };
}

export function createSimulationCustomer(name?: string): TelegramSession {
  const state = load();
  const id = `sess_sim_${Date.now()}`;
  const session: TelegramSession = {
    sessionId: id,
    customerName: name || `Customer #${Math.floor(1000 + Math.random() * 9000)}`,
    customerPhone: `09${Math.floor(100000000 + Math.random() * 900000000)}`,
    customerTelegramId: `@user_${id.slice(-6)}`,
    messages: [
      {
        id: `msg-${Date.now()}`,
        sender: "customer",
        content: "Hi! I would like to inquire about your new arrivals and pricing.",
        timestamp: new Date().toISOString(),
      },
      {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        content: "Welcome! Candy is happy to assist you. Which items or categories are you looking for today?",
        timestamp: new Date().toISOString(),
      },
    ],
    lastActive: new Date().toISOString(),
    currentStep: "browsing",
    cart: [],
    liveTakeoverActive: false,
  };
  state.sessions[id] = session;
  save();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("sales_brain_session_updated", { detail: session })
    );
  }
  return session;
}

export function botSimulateInput(body: {
  sessionId: string;
  content?: string;
  base64Image?: string;
  transactionId?: string;
  township?: string;
  payMethod?: string;
  checkoutOption?: string;
}) {
  const state = load();
  const result = processCustomerMessage(state, body.sessionId, body);
  save();
  if (typeof window !== "undefined" && result.session) {
    window.dispatchEvent(
      new CustomEvent("sales_brain_session_updated", { detail: result.session })
    );
  }
  return result;
}

export async function getAiStrategy(lang: string = "en") {
  try {
    const data = await invokeApi<{ strategy: string }>("ai/strategy", { lang });
    if (data.strategy) return { success: true, strategy: data.strategy };
  } catch (err) {
    console.warn("AI Strategy API failed, using fallback:", err);
  }
  const state = load();
  return { success: true, strategy: getStrategyBriefing(state, lang) };
}

export async function getAiMarketingInsights(campaignType: string, productIds: string[]) {
  try {
    const data = await invokeApi<{ insights: any }>("ai/marketing/insights", { campaignType, productIds });
    if (data.insights) return { success: true, insights: data.insights };
  } catch (err) {
    console.warn("AI Marketing Insights API failed, using fallback:", err);
  }
  const state = load();
  return { success: true, insights: getMarketingInsights(state, campaignType, productIds) };
}

export async function getAiMarketingImage(campaignType: string, prompt?: string) {
  try {
    const data = await invokeApi<{ imageUrl: string }>("ai/marketing/image", { prompt: prompt || `Professional marketing poster for ${campaignType}` });
    if (data.imageUrl) return { success: true, imageUrl: data.imageUrl };
  } catch (err) {
    console.warn("AI Marketing Image API failed, using fallback:", err);
  }
  return {
    success: true,
    imageUrl: getMarketingImageUrl(campaignType),
  };
}

export function mutateCampaignRecord(
  action: "add" | "update",
  record: Partial<CampaignRecord> & { id?: string }
) {
  const state = load();
  if (!Array.isArray(state.campaignRecords)) state.campaignRecords = [];

  if (action === "add") {
    const launchTime = record.launchedAt ?? new Date().toISOString();
    // Close any previous active campaign so orders are never double-counted
    state.campaignRecords = state.campaignRecords.map((r) => {
      if (!r.endedAt) {
        return { ...r, endedAt: launchTime, status: "ended" as const };
      }
      return r;
    });

    const newRecord: CampaignRecord = {
      id: `camp-${Date.now()}`,
      campaignTheme: record.campaignTheme ?? "General",
      goal: record.goal ?? "more_profit",
      offer: record.offer ?? "full_price",
      discountPct: record.discountPct ?? 0,
      selectedProductIds: record.selectedProductIds ?? [],
      copyEn: record.copyEn ?? "",
      copyMy: record.copyMy ?? "",
      launchedAt: launchTime,
      endedAt: null,
      status: "active",
      measuredAt: null,
      ordersGenerated: 0,
      revenueGenerated: 0,
      baselineOrders: record.baselineOrders ?? 0,
      winner: null,
      variants: record.variants ?? [],
      notes: record.notes ?? "",
    };
    state.campaignRecords.unshift(newRecord);
  } else if (action === "update" && record.id) {
    state.campaignRecords = state.campaignRecords.map((r) =>
      r.id === record.id ? { ...r, ...record } : r
    );
  }

  save();
  return state;
}

/** Seed export for tests */
export { DEFAULT_STATE };
