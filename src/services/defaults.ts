import type { SystemState, TelegramSession } from "../types";

export function getDefaultSessions(): Record<string, TelegramSession> {
  const now = Date.now();
  return {
    default_customer: {
      sessionId: "default_customer",
      customerName: "Ma Thida (VIP Inquirer)",
      customerPhone: "09798123456",
      customerTelegramId: "@thida_mm",
      messages: [
        {
          id: "msg-init-1",
          sender: "customer",
          content: "မင်္ဂလာပါ Candy, handmade silk scarf နဲ့ ceramic mug မှာချင်လို့ ရနိုင်သေးလားရှင်? (Are the silk scarf and ceramic mug available?)",
          timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
        },
        {
          id: "msg-init-2",
          sender: "bot",
          content: "မင်္ဂလာပါရှင်! Candy ပါ။ ပစ္စည်းနှစ်မျိုးလုံး stock ရှိပါတယ်ရှင်။ ရန်ကုန်မြို့တွင်း ပို့ခ 2,500 MMK ဖြစ်ပါတယ် (Both are in stock! Delivery within Yangon is 2,500 MMK).",
          timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
        },
        {
          id: "msg-init-3",
          sender: "customer",
          content: "၂ မျိုးလုံးယူရင် discount ရနိုင်မလားရှင်? ဆိုင်ရှင်နဲ့ တိုက်ရိုက်စကားပြောလို့ရမလား (Can I get a discount if I buy both? Can I speak with the shop owner)?",
          timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
        },
      ],
      lastActive: new Date(now - 1000 * 60 * 5).toISOString(),
      currentStep: "browsing",
      cart: [{ productId: "p1", quantity: 1 }],
      liveTakeoverActive: false,
    },
    sess_aung_tg: {
      sessionId: "sess_aung_tg",
      customerName: "Ko Aung (Telegram Buyer)",
      customerPhone: "09420098765",
      customerTelegramId: "@aung_commerce",
      messages: [
        {
          id: "msg-aung-1",
          sender: "customer",
          content: "KPay နဲ့ရှင်းလို့ရလားဗျ? Invoice လေး ပို့ပေးပါ (Can I pay with KPay? Please send me the invoice).",
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        },
        {
          id: "msg-aung-2",
          sender: "bot",
          content: "ရပါတယ်ရှင့်! KPay (သို့) WavePay ဖြင့် ငွေလွှဲပေးချေနိုင်ပါတယ်ရှင် (Yes, KPay and WavePay are accepted).",
          timestamp: new Date(now - 1000 * 60 * 40).toISOString(),
        },
      ],
      lastActive: new Date(now - 1000 * 60 * 40).toISOString(),
      currentStep: "ordering",
      cart: [],
      liveTakeoverActive: false,
    },
  };
}

export function createEmptyShopState(): SystemState {
  return {
    config: {
      shopName: "",
      ownerName: "",
      phone: "",
      currency: "MMK",
      telegramBotToken: "",
      telegramBotUsername: "Jjkql_bot",

      onboardingCompleted: false,
    },
    products: [],
    deliveryZones: [],
    orders: [],
    sessions: getDefaultSessions(),
  };
}
