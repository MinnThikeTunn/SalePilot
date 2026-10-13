export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  image: string;
  varies: { key: string; value: string }[];
  is_on_demand?: boolean;
  waiting_time?: string;
}

export interface DeliveryZone {
  township: string;
  rate: number;
  deliveryTime: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  customerTelegramId: string;
  township: string;
  addressDetails?: string;
  deliveryFee: number;
  paymentMethod: "cod" | "prepay";
  totalAmount: number;
  status: "pending" | "verifying" | "confirmed" | "completed" | "cancelled";
  items: OrderItem[];
  paymentDetails?: {
    method: "KPay" | "WavePay" | "CBPay" | "AYA Pay" | "CoD";
    transactionId: string;
    screenshotUrl?: string;
  };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: "customer" | "bot" | "owner" | "system";
  content: string;
  timestamp: string;
  imageUrl?: string;
  interactiveOptions?: string[];
  invoiceData?: Order;
  paymentDetailsNeeded?: boolean;
}

export interface ShopConfig {
  shopName: string;
  ownerName: string;
  phone: string;
  currency: string;
  telegramBotToken: string;
  telegramBotUsername: string;
  messengerPageAccessToken: string;
  messengerVerifyToken: string;
  messengerBotId: string;
  messengerBotName: string;
  onboardingCompleted: boolean;
  shopId?: string;
}

export interface TelegramSession {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  customerTelegramId: string;
  messages: ChatMessage[];
  lastActive: string;
  currentStep: string;
  cart: { productId: string; quantity: number }[];
  liveTakeoverActive: boolean;
  activeOrderId?: string;
  tempPayMethod?: string;
}

export interface SystemState {
  config: ShopConfig;
  products: Product[];
  deliveryZones: DeliveryZone[];
  orders: Order[];
  sessions: Record<string, TelegramSession>;
}
