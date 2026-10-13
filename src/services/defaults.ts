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
          content: "Hello Candy! Are the handmade silk scarf and ceramic mug still available in stock?",
          timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
        },
        {
          id: "msg-init-2",
          sender: "bot",
          content: "Hello! Yes, both items are currently in stock. Standard delivery within Yangon is 2,500 MMK.",
          timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
        },
        {
          id: "msg-init-3",
          sender: "customer",
          content: "Can I get a discount if I purchase both items together? Could I speak directly with the shop owner?",
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
          content: "Can I pay via KPay or WavePay? Please send over the digital invoice.",
          timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
        },
        {
          id: "msg-aung-2",
          sender: "bot",
          content: "Certainly! We accept direct mobile transfers via both KPay and WavePay.",
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
    campaignRecords: [],
  };
}
