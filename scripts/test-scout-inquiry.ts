import assert from "node:assert";
import { runScoutInquiry } from "../src/features/sales-team/agents/scoutRunner";
import { resetState, mutateProducts, addOrder } from "../src/services/clientStore";

console.log("=== RUNNING TEST: Ticket 02 - Scout Inquiry & Core Evidence Schema ===");

// 1. Reset baseline state
resetState();

// 2. Seed data with specific test conditions:
// Product A: Low stock (Stockout hazard)
const prodAId = "prod-stockout-tea";
mutateProducts("add", {
  id: prodAId,
  name: "Premium Jasmine Tea",
  price: 8500,
  cost_price: 5000,
  stock: 2, // Stock <= safety threshold
  safety_stock_threshold: 5,
  lead_time_days: 4,
});

// Product B: Dead / Slow-moving stock (high stock, 0 orders)
const prodBId = "prod-slow-teapot";
mutateProducts("add", {
  id: prodBId,
  name: "Handmade Clay Teapot",
  price: 25000,
  cost_price: 15000,
  stock: 25,
  safety_stock_threshold: 5,
  lead_time_days: 7,
});

// Product C: Fast-moving winner with sales
const prodCId = "prod-fast-honey";
mutateProducts("add", {
  id: prodCId,
  name: "Organic Raw Honey 500g",
  price: 12000,
  cost_price: 7500,
  stock: 30,
  safety_stock_threshold: 5,
  lead_time_days: 3,
});

// Add orders for Product A and Product C
addOrder({
  id: "ord-scout-01",
  invoiceId: "INV-SCOUT-01",
  customerName: "Daw Nu",
  customerPhone: "09111222333",
  customerTelegramId: "tg_nu",
  township: "Kamayut",
  deliveryFee: 2000,
  paymentMethod: "prepay",
  totalAmount: 22500,
  status: "confirmed",
  items: [
    { productId: prodAId, productName: "Premium Jasmine Tea", price: 8500, quantity: 1 },
    { productId: prodCId, productName: "Organic Raw Honey 500g", price: 12000, quantity: 1 },
  ],
  createdAt: new Date().toISOString(),
});

addOrder({
  id: "ord-scout-02",
  invoiceId: "INV-SCOUT-02",
  customerName: "Daw Nu", // Repeat buyer!
  customerPhone: "09111222333",
  customerTelegramId: "tg_nu",
  township: "Kamayut",
  deliveryFee: 2000,
  paymentMethod: "prepay",
  totalAmount: 24000,
  status: "confirmed",
  items: [
    { productId: prodCId, productName: "Organic Raw Honey 500g", price: 12000, quantity: 2 },
  ],
  createdAt: new Date().toISOString(),
});

// 3. Drive the code path: Execute Scout Inquiry
console.log("Executing Scout Opportunity Hunter runner...");
const scoutResult = runScoutInquiry({
  shopId: "test_shop_scout",
  trigger: "hunt_stockout_and_sales_risks",
});

console.log("Scout Findings count:", scoutResult.opportunities.length);
console.log("Generated Evidence count:", scoutResult.evidence.length);

// 4. Assertions
// Must detect Stockout hazard on Product A
const stockoutOpp = scoutResult.opportunities.find((o) => o.type === "stockout_risk");
assert(stockoutOpp, "Scout must detect stockout risk");
assert(stockoutOpp.affectedProductIds.includes(prodAId), "Stockout opp must reference Jasmine Tea");
console.log(`✅ Scout flagged stockout risk on '${stockoutOpp.title}'`);

// Must detect Slow-Moving / Dead Inventory on Product B
const slowOpp = scoutResult.opportunities.find((o) => o.type === "slow_moving_stock");
assert(slowOpp, "Scout must detect slow-moving inventory");
assert(slowOpp.affectedProductIds.includes(prodBId), "Slow stock opp must reference Clay Teapot");
console.log(`✅ Scout flagged dead inventory on '${slowOpp.title}'`);

// Must detect Repeat Buyer Cohort
const repeatOpp = scoutResult.opportunities.find((o) => o.type === "repeat_customers");
assert(repeatOpp, "Scout must detect repeat buyer patterns");
console.log(`✅ Scout flagged repeat buyers: '${repeatOpp.title}'`);

// Evidence citations must be valid and verifiable
assert(scoutResult.evidence.length >= 3, "Scout must attach evidence snapshots");
scoutResult.evidence.forEach((ev) => {
  assert(ev.metric_key, "Evidence must have metric_key");
  assert(ev.source_type, "Evidence must declare source_type");
  assert(ev.snapshot, "Evidence must contain observable snapshot");
});
console.log(`✅ Verified ${scoutResult.evidence.length} evidence snapshots with citations.`);

console.log("\n🎉 ALL TICKET 02 TESTS PASSED (GREEN)!");
