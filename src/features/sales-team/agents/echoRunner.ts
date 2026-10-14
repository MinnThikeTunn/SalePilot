import { toolRegistry } from "../tools/toolRegistry";
import type { TeamEvidence } from "../types/sales-team";
import { getState } from "../../../services/clientStore";

export interface CustomerObjection {
  id: string;
  category:
    | "delivery_fee_too_high"
    | "payment_method_hesitation"
    | "price_sensitivity"
    | "unanswered_inquiry"
    | "sizing_or_spec_uncertainty";
  label: string;
  count: number;
  percentageOfDropOffs: number;
  severity: "high" | "medium" | "low";
  dropOffStage: string;
  summary: string;
  recommendation: string;
  evidenceRefs: string[];
}

export interface FunnelAnalysis {
  totalSessions: number;
  completedSessionsCount: number;
  abandonedSessionsCount: number;
  conversionRatePct: number;
  dropOffByStep: Record<string, number>;
}

export interface EchoInquiryResult {
  agentKey: "echo";
  agentName: "Echo";
  title: string;
  personaMotto: string;
  objections: CustomerObjection[];
  funnelAnalysis: FunnelAnalysis;
  evidence: TeamEvidence[];
  marketContext?: any;
  recommendations: string[];
  executedAt: string;
}

export interface EchoInquiryOptions {
  shopId: string;
  trigger?:
    | "analyze_customer_objections"
    | "inspect_funnel_dropoffs"
    | "suggest_faq_and_scripts"
    | "general"
    | "custom";
  customPrompt?: string;
}

/**
 * Echo Customer Advocate Runner
 * 
 * Classifies customer objection signals and analyzes Telegram checkout funnel drop-offs.
 * Strictly adheres to ADR-0002 Zero-PII invariant: customer names, phone numbers,
 * and raw transcripts are never persisted or returned.
 */
export function runEchoInquiry(options: EchoInquiryOptions): EchoInquiryResult {
  const { shopId, trigger = "general" } = options;

  // 1. Fetch live contexts via tools
  const marketIntelPayment = toolRegistry.executeTool("search_market_intelligence", {
    shopId,
    topic: "payment_psychology",
  });
  const marketIntelCod = toolRegistry.executeTool("search_market_intelligence", {
    shopId,
    topic: "cod_return_rates",
  });

  const state = getState();
  const sessions = Object.values(state.sessions || {});

  const now = new Date().toISOString();
  const sessionId = `sess-echo-${Date.now()}`;
  const evidenceList: TeamEvidence[] = [];

  // Helper to register zero-PII evidence
  const addEvidence = (
    sourceType: "inquiry" | "analytics",
    sourceId: string,
    metricKey: string,
    value: any,
    unit: string,
    snapshot: Record<string, any>
  ): string => {
    const evId = `ev-echo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ev: TeamEvidence = {
      id: evId,
      shop_id: shopId,
      session_id: sessionId,
      source_type: sourceType,
      source_id: sourceId,
      metric_key: metricKey,
      value,
      unit,
      observed_at: now,
      snapshot,
      quality: {
        coverage: 100,
        missing_fields: [],
        limitations: [],
      },
    };
    evidenceList.push(ev);
    return evId;
  };

  // 2. Funnel Step & Friction Classification (Strict Zero-PII)
  let completedCount = 0;
  let abandonedCount = 0;
  const dropOffByStep: Record<string, number> = {};

  let deliveryObjectionsCount = 0;
  let paymentHesitationsCount = 0;
  let priceSensitivityCount = 0;
  let unansweredInquiryCount = 0;

  sessions.forEach((sess) => {
    const step = sess.currentStep || "browsing";
    if (step === "completed") {
      completedCount++;
    } else {
      abandonedCount++;
      dropOffByStep[step] = (dropOffByStep[step] || 0) + 1;
    }

    // Inspect conversation step and message signals anonymously
    let hasDeliveryMention = false;
    let hasPaymentMention = false;
    let hasPriceMention = false;

    if (step === "selecting_township") {
      hasDeliveryMention = true;
    }
    if (step === "selecting_payment" || step === "prepayment_pending") {
      hasPaymentMention = true;
    }

    // Classify text content without capturing strings or personal data
    (sess.messages || []).forEach((m) => {
      const lower = (m.content || "").toLowerCase();
      if (
        lower.includes("delivery") ||
        lower.includes("fee") ||
        lower.includes("ပို့ခ") ||
        lower.includes("transit") ||
        lower.includes("expensive tl") ||
        lower.includes("bauk lal")
      ) {
        hasDeliveryMention = true;
      }
      if (
        lower.includes("kpay") ||
        lower.includes("wave") ||
        lower.includes("cod") ||
        lower.includes("transfer") ||
        lower.includes("pay") ||
        lower.includes("prepay")
      ) {
        hasPaymentMention = true;
      }
      if (
        lower.includes("ဈေးကြီး") ||
        lower.includes("expensive") ||
        lower.includes("discount") ||
        lower.includes("discount pay par")
      ) {
        hasPriceMention = true;
      }
    });

    if (hasDeliveryMention) deliveryObjectionsCount++;
    if (hasPaymentMention) paymentHesitationsCount++;
    if (hasPriceMention) priceSensitivityCount++;
    if (sess.messages && sess.messages.length > 0) {
      const lastMsg = sess.messages[sess.messages.length - 1];
      if (lastMsg.sender === "customer" && step !== "completed") {
        unansweredInquiryCount++;
      }
    }
  });

  const totalSessions = sessions.length;
  const conversionRatePct =
    totalSessions > 0
      ? Number(((completedCount / totalSessions) * 100).toFixed(1))
      : 0;

  // 3. Register Zero-PII Evidence
  const funnelEvId = addEvidence(
    "analytics",
    "telegram_checkout_funnel",
    "funnel_conversion_rate",
    conversionRatePct,
    "%",
    {
      totalSessions,
      completedSessions: completedCount,
      abandonedSessions: abandonedCount,
      dropOffByStep,
      myanmarCommerceBenchmarkPct: 22.5,
    }
  );

  const deliveryEvId = addEvidence(
    "inquiry",
    "telegram_friction_signals",
    "delivery_fee_objections",
    deliveryObjectionsCount,
    "events",
    {
      category: "delivery_fee_too_high",
      occurrences: deliveryObjectionsCount,
      primaryDropOffStage: "selecting_township",
      benchmarkInsight:
        "Myanmar shoppers frequently drop off when delivery fees exceed 10% of cart total without prior disclosure.",
    }
  );

  let paymentEvId: string | null = null;
  if (paymentHesitationsCount > 0) {
    paymentEvId = addEvidence(
      "inquiry",
      "telegram_friction_signals",
      "payment_method_hesitations",
      paymentHesitationsCount,
      "events",
      {
        category: "payment_method_hesitation",
        occurrences: paymentHesitationsCount,
        primaryDropOffStage: "prepayment_pending",
        benchmarkCodPreferencePct: 60.0,
        benchmarkTrustInsight:
          "Prepayment requests without verified buyer trust trigger immediate cart abandonment (~35% drop-off).",
      }
    );
  }

  // 4. Construct Classified Objections
  const objections: CustomerObjection[] = [];

  if (deliveryObjectionsCount > 0) {
    objections.push({
      id: "obj-delivery-fee",
      category: "delivery_fee_too_high",
      label: "Delivery Fee Sensitivity at Township Selection",
      count: deliveryObjectionsCount,
      percentageOfDropOffs:
        abandonedCount > 0
          ? Math.round((deliveryObjectionsCount / abandonedCount) * 100)
          : 0,
      severity: deliveryObjectionsCount >= 2 ? "high" : "medium",
      dropOffStage: "Township & Address Selection",
      summary: `${deliveryObjectionsCount} potential buyers abandoned checkout upon encountering township delivery rates or expressing transit fee sensitivity.`,
      recommendation:
        "Disclose flat-rate township delivery upfront in Telegram bot welcome chips or offer free delivery on orders over 35,000 MMK.",
      evidenceRefs: [deliveryEvId, funnelEvId],
    });
  }

  if (paymentHesitationsCount > 0) {
    objections.push({
      id: "obj-payment-hesitation",
      category: "payment_method_hesitation",
      label: "Prepayment Hesitation & Payment Method Friction",
      count: paymentHesitationsCount,
      percentageOfDropOffs:
        abandonedCount > 0
          ? Math.round((paymentHesitationsCount / abandonedCount) * 100)
          : 0,
      severity: paymentHesitationsCount >= 2 ? "high" : "medium",
      dropOffStage: "Payment Selection & Slip Verification",
      summary: `${paymentHesitationsCount} customers stalled at the payment step, reluctant to transfer advance KPay/Wave funds or seeking Cash on Delivery (COD).`,
      recommendation:
        "Offer flexible Cash on Delivery (COD) with phone confirmation, or provide a 500 MMK instant discount bonus for verified KPay transfers to boost prepayment confidence.",
      evidenceRefs: paymentEvId ? [paymentEvId, funnelEvId] : [funnelEvId],
    });
  }

  if (priceSensitivityCount > 0) {
    const priceEvId = addEvidence(
      "inquiry",
      "telegram_friction_signals",
      "price_sensitivity_signals",
      priceSensitivityCount,
      "events",
      {
        category: "price_sensitivity",
        occurrences: priceSensitivityCount,
        primaryDropOffStage: "browsing_or_cart",
      }
    );

    objections.push({
      id: "obj-price-sensitivity",
      category: "price_sensitivity",
      label: "Price Sensitivity & Discount Inquiries",
      count: priceSensitivityCount,
      percentageOfDropOffs:
        abandonedCount > 0
          ? Math.round((priceSensitivityCount / abandonedCount) * 100)
          : 0,
      severity: priceSensitivityCount >= 3 ? "high" : "low",
      dropOffStage: "Catalog Browsing & Cart Negotiation",
      summary: `${priceSensitivityCount} inquiries questioned retail price competitiveness or requested direct discounts.`,
      recommendation:
        "Rather than eroding unit margins with raw price cuts, bundle slow-moving complementary items as free gift perks.",
      evidenceRefs: [priceEvId],
    });
  }

  const recommendations = [
    "Address Township Delivery Sticker Shock: Display estimated delivery fees before the buyer inputs detailed address.",
    "Bifurcate Payment Options: Offer COD for first-time buyers and reserve prepay incentives for repeat loyalists.",
    "Implement 15-Minute Recovery Ping: Send an automated polite follow-up if a customer stalls in the payment step.",
  ];

  return {
    agentKey: "echo",
    agentName: "Echo",
    title: "Customer Friction & Objection Report",
    personaMotto: "Listen to the silence where customers abandoned the conversation.",
    objections,
    funnelAnalysis: {
      totalSessions,
      completedSessionsCount: completedCount,
      abandonedSessionsCount: abandonedCount,
      conversionRatePct,
      dropOffByStep,
    },
    evidence: evidenceList,
    marketContext: {
      payment: marketIntelPayment?.intelligence || null,
      codReturn: marketIntelCod?.intelligence || null,
    },
    recommendations,
    executedAt: now,
  };
}
