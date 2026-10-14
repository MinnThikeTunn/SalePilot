import assert from "node:assert";
import { runEchoInquiry } from "../src/features/sales-team/agents/echoRunner";
import { resetState, addTelegramSession } from "../src/services/clientStore";

console.log("=== RUNNING TEST: Ticket 03 - Echo Friction Inquiry & Privacy Signals ===");

// 1. Reset baseline state
resetState();

// 2. Seed Telegram customer sessions with intentional friction scenarios:
// Session 1: Delivery fee drop-off at township stage
addTelegramSession({
  sessionId: "sess_test_drop_delivery",
  customerName: "Ko Kyaw Kyaw",
  customerPhone: "09999111222",
  customerTelegramId: "tg_kyaw_123",
  lastActive: new Date().toISOString(),
  currentStep: "selecting_township",
  cart: [{ productId: "prod-1", quantity: 2 }],
  liveTakeoverActive: false,
  messages: [
    { id: "m1", sender: "customer", content: "Mingalarpar, want to order", timestamp: new Date().toISOString() },
    { id: "m2", sender: "bot", content: "Please select your township", timestamp: new Date().toISOString() },
    { id: "m3", sender: "customer", content: "Kamayut delivery fee bauk lal? expensive tl", timestamp: new Date().toISOString() },
  ],
});

// Session 2: Prepayment hesitation drop-off
addTelegramSession({
  sessionId: "sess_test_drop_payment",
  customerName: "Ma Hnin Hnin",
  customerPhone: "09888333444",
  customerTelegramId: "tg_hnin_456",
  lastActive: new Date().toISOString(),
  currentStep: "prepayment_pending",
  cart: [{ productId: "prod-2", quantity: 1 }],
  liveTakeoverActive: false,
  messages: [
    { id: "m4", sender: "customer", content: "I want to buy", timestamp: new Date().toISOString() },
    { id: "m5", sender: "bot", content: "Please transfer KPay to 0912345678", timestamp: new Date().toISOString() },
    { id: "m6", sender: "customer", content: "Can I pay COD instead? Don't have KPay now", timestamp: new Date().toISOString() },
  ],
});

// Session 3: Completed happy path order
addTelegramSession({
  sessionId: "sess_test_completed_flow",
  customerName: "Ko Aung",
  customerPhone: "09777555666",
  customerTelegramId: "tg_aung_789",
  lastActive: new Date().toISOString(),
  currentStep: "completed",
  cart: [{ productId: "prod-1", quantity: 1 }],
  liveTakeoverActive: false,
  messages: [
    { id: "m7", sender: "customer", content: "Ordered successfully", timestamp: new Date().toISOString() },
  ],
});

// 3. Drive the code path: Execute Echo Customer Advocate runner
console.log("Executing Echo Customer Advocate runner...");
const echoResult = runEchoInquiry({
  shopId: "test_shop_echo",
  trigger: "analyze_customer_objections",
});

console.log("Echo Inquiries executed:", echoResult.title);
console.log("Objection categories detected:", echoResult.objections.length);
console.log("Funnel drop-off points analyzed:", echoResult.funnelAnalysis.totalSessions);

// 4. Assertions
// Must identify delivery fee objection
const deliveryObj = echoResult.objections.find((o) => o.category === "delivery_fee_too_high");
assert(deliveryObj, "Echo must detect delivery fee objection category");
assert(deliveryObj.count >= 1, "Must count delivery fee objections");
console.log(`✅ Echo flagged: ${deliveryObj.label} (${deliveryObj.count} occurrences)`);

// Must identify prepayment drop-off objection
const paymentObj = echoResult.objections.find((o) => o.category === "payment_method_hesitation");
assert(paymentObj, "Echo must detect payment hesitation category");
assert(paymentObj.count >= 1, "Must count payment drop-offs");
console.log(`✅ Echo flagged: ${paymentObj.label} (${paymentObj.count} occurrences)`);

// Funnel drop-off analysis
assert(echoResult.funnelAnalysis.abandonedSessionsCount >= 2, "Must count at least 2 abandoned sessions");
assert(echoResult.funnelAnalysis.conversionRatePct > 0, "Must calculate funnel conversion rate");
console.log(`✅ Funnel Conversion Rate: ${echoResult.funnelAnalysis.conversionRatePct}%`);

// CRITICAL ADR-0002 ZERO-PII AUDIT:
// Verify NO phone numbers or customer names exist in any evidence snapshot or result
const serialized = JSON.stringify(echoResult);
assert(!serialized.includes("09999111222"), "Zero-PII violation: Phone number found in Echo output!");
assert(!serialized.includes("09888333444"), "Zero-PII violation: Phone number found in Echo output!");
assert(!serialized.includes("Ko Kyaw Kyaw"), "Zero-PII violation: Customer name found in Echo output!");
assert(!serialized.includes("Ma Hnin Hnin"), "Zero-PII violation: Customer name found in Echo output!");
console.log("✅ Zero-PII Guarantee verified: 0 customer phone numbers or personal names leaked in evidence!");

// Evidence records must be populated
assert(echoResult.evidence.length >= 2, "Echo must generate verifiable evidence citations");
echoResult.evidence.forEach((ev) => {
  assert(ev.source_type === "inquiry" || ev.source_type === "analytics", "Evidence must be inquiry or analytics type");
  assert(ev.snapshot, "Evidence must include observable snapshot");
});
console.log(`✅ Generated ${echoResult.evidence.length} privacy-safe evidence citations.`);

console.log("\n🎉 ALL TICKET 03 TESTS PASSED (GREEN)!");
