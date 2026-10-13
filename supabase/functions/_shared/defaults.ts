import type { SystemState } from "./types.ts";

export function createDefaultState(): SystemState {
  return {
    config: {
      shopName: "",
      ownerName: "",
      phone: "",
      currency: "MMK",
      telegramBotToken: "",
      telegramBotUsername: "",
      messengerPageAccessToken: "",
      messengerVerifyToken: "",
      messengerBotId: "messenger",
      messengerBotName: "Messenger Bot",
      onboardingCompleted: false,
    },
    products: [],
    deliveryZones: [],
    orders: [],
    sessions: {},
  };
}
