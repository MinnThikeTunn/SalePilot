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
  cost_price?: number; // COGS in MMK
  lead_time_days?: number; // Days to replenish
  safety_stock_threshold?: number; // Buffer stock minimum
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
  owner_id?: string;
  shop_id?: string;
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

// ==============================================================================
// AI Strategy Desk Interfaces (per docs/AI_Strategy_Feature.md)
// ==============================================================================

export type OpportunityType =
  | 'sales_decline'
  | 'stock_risk'
  | 'cancellation_risk'
  | 'conversion_gap'
  | 'unconverted_inquiries'
  | 'margin_opportunity'
  | 'repeat_purchase';

export type LifecycleStatus =
  | 'open'
  | 'accepted'
  | 'dismissed'
  | 'in_progress'
  | 'completed'
  | 'expired';

export type DataQualityStatus = 'good' | 'limited' | 'insufficient';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ScoreBreakdown {
  impact: number;       // 0-100 (35% weight)
  evidence: number;     // 0-100 (25% weight)
  urgency: number;      // 0-100 (20% weight)
  actionability: number;// 0-100 (20% weight)
}

export interface RecommendedAction {
  action_type: string;
  title: string;
  description: string;
  requires_approval: boolean;
  suggested_params?: Record<string, unknown>;
}

export interface AiExplanation {
  why_it_matters: string;
  action_rationale: string;
  expected_outcome?: string;
  limitations?: string;
  generated_by: 'gemini' | 'template_fallback';
}

export interface SalesOpportunity {
  id: string;
  shop_id: string;
  owner_id: string;
  run_id?: string;
  opportunity_key: string;
  opportunity_type: OpportunityType;
  title: string;
  problem_description: string;
  priority_score: number; // 0 - 100
  score_breakdown: ScoreBreakdown;
  evidence_confidence: ConfidenceLevel;
  evidence_snapshot: {
    metrics: Record<string, number | string | boolean>;
    analysis_period: string;
    comparison_period?: string;
    comparison_values?: Record<string, number | string>;
    source_records: string;
    warnings?: string[];
  };
  expected_impact: {
    revenue_at_risk_mmk?: number;
    potential_gain_mmk?: number;
    units_impacted?: number;
    assumptions?: string;
  };
  recommended_action: RecommendedAction;
  data_quality_warnings: string[];
  ai_explanation: AiExplanation;
  status: LifecycleStatus;
  dismissed_reason?: string;
  detected_at: string;
  expires_at?: string;
  updated_at: string;
}

export interface AnalyticsRun {
  id: string;
  shop_id: string;
  owner_id: string;
  analysis_window_start: string;
  analysis_window_end: string;
  comparison_window_start?: string;
  comparison_window_end?: string;
  timezone: string;
  currency: string;
  data_quality_status: DataQualityStatus;
  data_quality_summary: {
    completeness_score: number; // 0 - 100
    missing_data: string[];
    warnings: string[];
    freshness_timestamp: string;
  };
  metrics_summary: {
    current_period: {
      revenue: number;
      completed_orders: number;
      aov: number;
      cancellation_rate: number;
      total_units_sold: number;
    };
    comparison_period: {
      revenue: number;
      completed_orders: number;
      aov: number;
      cancellation_rate: number;
      total_units_sold: number;
    };
    changes: {
      revenue_pct: number | null;
      orders_pct: number | null;
      aov_pct: number | null;
      cancellation_rate_pct: number | null;
    };
  };
  metric_version: string;
  scoring_version: string;
  status: 'completed' | 'failed' | 'limited';
  source_watermark: string;
  created_at: string;
}

export interface OpportunityOutcome {
  id: string;
  opportunity_id: string;
  opportunity_key: string;
  shop_id: string;
  owner_id: string;
  action_type: string;
  baseline_metrics: Record<string, unknown>;
  observed_metrics?: Record<string, unknown>;
  observation_period_days: number;
  outcome_status: 'monitoring' | 'measured' | 'inconclusive';
  attribution_method: string;
  notes?: string;
  completed_at: string;
  created_at: string;
}

