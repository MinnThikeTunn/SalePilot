export interface Product {
  id: string;
  name: string;
  category?: string;
  price: number; // in MMK
  description: string;
  stock: number;
  image: string;
  varies: { key: string; value: string }[];
  is_on_demand?: boolean;
  waiting_time?: string;
}

export interface DeliveryZone {
  id: string;
  township_name: string;
  region?: string;
  division?: string;
  rate: number;
  estimated_transit_timeline: string;
  created_at?: string;
}

export interface DeliveryZoneFormData {
  township_name: string;
  region?: string;
  division?: string;
  rate: number;
  estimated_transit_timeline: string;
}

export interface DeliveryMatrixResponse {
  data: DeliveryZone[];
  pagination: {
    total_records: number;
    current_page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
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
  paymentMethod: 'cod' | 'prepay';
  totalAmount: number; // product total + deliveryFee
  status: 'pending' | 'verifying' | 'confirmed' | 'completed' | 'cancelled';
  items: OrderItem[];
  paymentDetails?: {
    method: 'KPay' | 'WavePay' | 'CBPay' | 'AYA Pay' | 'CoD';
    transactionId: string;
    screenshotUrl?: string; // base64 encoded or placeholder image
  };
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot' | 'owner' | 'system';
  content: string;
  timestamp: string;
  imageUrl?: string;
  interactiveOptions?: string[]; // Quick reply suggestions
  invoiceData?: Order; // Attached invoice helper
  paymentDetailsNeeded?: boolean;
}

export interface ShopConfig {
  shopName: string;
  ownerName: string;
  phone: string;
  currency: string;
  telegramBotToken: string;
  telegramBotUsername: string;
  onboardingCompleted: boolean;
  messengerBotId?: string;
  messengerBotName?: string;
  shopId?: string;
  productsMigrated?: boolean;
}

export interface TelegramSession {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  customerTelegramId: string;
  messages: ChatMessage[];
  lastActive: string;
  currentStep: 'greeting' | 'browsing' | 'ordering' | 'selecting_township' | 'selecting_payment' | 'prepayment_pending' | 'verifying' | 'completed' | 'live_takeover';
  cart: { productId: string; quantity: number }[];
  liveTakeoverActive: boolean;
  activeOrderId?: string;
  tempPayMethod?: string;
}

/** Stored in shops.onboarding_profile (jsonb) */
export interface OnboardingProfile {
  business_type: string;
  mainly_sell: string;
  main_customer: string;
  age_group: string;
  matter_most: string;
  marketing_method: string;
  business_goal: string;
  selling_platform: string;
  weekly_order_volume: string;
  payment_method: string;
  delivery_method: string;
  bot_personality: string;
  phone?: string;
  business_address?: string;
}

export interface ShopRecord {
  id: string;
  owner_id: string;
  shop_id?: string;
  shop_name: string;
  owner_name: string | null;
  phone?: string | null;
  address?: string | null;
  onboarding_completed: boolean;
  onboarding_profile: OnboardingProfile | null;
}

/** Wizard form shape (Onboarding.tsx) */
export interface OnboardingFormState {
  business_name: string;
  owner_name: string;
  business_category: string;
  mainly_sell: string;
  main_customer: string;
  age_group: string;
  selling_platform: string;
  marketing_method: string;
  weekly_order_volume: string;
  payment_method: string;
  delivery_method: string;
  business_goal: string;
  bot_personality: string;
  matter_most: string;
  phone?: string;
  business_address?: string;
}

export interface BusinessOnboarding {
  onboarding_id?: number;
  user_id: string;
  shop_id?: string;
  business_name: string;
  business_category: string;
  selling_platform: string;
  weekly_order_volume: string;
  payment_method: string;
  delivery_method: string;
  business_goal: string;
  bot_personality: string;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SystemState {
  config: ShopConfig;
  products: Product[];
  deliveryZones: DeliveryZone[];
  orders: Order[];
  sessions: { [id: string]: TelegramSession };
}
