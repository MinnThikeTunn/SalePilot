import assert from "node:assert";
import {
  evaluateDataScarcity,
  filterEvidenceRecords,
  type DataScarcityEvaluation,
} from "../src/features/sales-team/services/dataScarcityService";
import { resetState, mutateProducts, addOrder } from "../src/services/clientStore";
import type { TeamEvidence } from "../src/features/sales-team/types/sales-team";

console.log("=== RUNNING TEST: Ticket 07 - Evidence Explorer & Low-Data Fallback ===");

// 1. Reset baseline state
resetState();

const SHOP_ID = "test_shop_scarcity";

// 2. Test Low-Data Fixture: Only 1 product without cost_price, and 1 completed order
console.log("Testing Low-Data Fixture (<5 completed transactions, uncosted product)...");
mutateProducts("add", {
  id: "prod-low-data-1",
  name: "Handmade Bamboo Basket",
  price: 15000,
  cost_price: 0, // uncosted
  stock: 5,
  category: "Crafts",
  description: "Basket",
  image: "",
});

const evaluationLow = evaluateDataScarcity(SHOP_ID);

assert.strictEqual(
  evaluationLow.status,
  "insufficient_evidence",
  "Must flag 'insufficient_evidence' when completed orders < 5"
);
assert.strictEqual(evaluationLow.isSuppressed, true, "Must suppress speculative forecasting on low data");
assert(evaluationLow.limitations.length >= 1, "Must list specific data limitations");
assert(evaluationLow.guidedTasks.length >= 2, "Must provide guided data completion tasks");

const costTask = evaluationLow.guidedTasks.find((t) => t.id === "task-record-cogs");
assert(costTask, "Must recommend recording COGS for uncosted products");

const orderTask = evaluationLow.guidedTasks.find((t) => t.id === "task-order-volume");
assert(orderTask, "Must recommend processing at least 5 transactions");

console.log(`✅ Low-Data Fallback Triggered: Status='${evaluationLow.status}', ${evaluationLow.guidedTasks.length} guided tasks presented.`);
console.log(`   Limitations: ${evaluationLow.limitations.join(" | ")}`);

// 3. Test Robust Data Fixture: 6 completed orders and fully costed products
console.log("Testing Robust Data Fixture (>=5 completed transactions, costed products)...");
mutateProducts("update", {
  id: "prod-low-data-1",
  product: {
    cost_price: 9000,
  },
});

for (let i = 1; i <= 5; i++) {
  addOrder({
    id: `ord-robust-${i}`,
    invoiceId: `INV-2026-00${i}`,
    customerName: `Customer ${i}`,
    customerPhone: `0999900000${i}`,
    customerTelegramId: `tg_c_${i}`,
    township: "Kamayut",
    deliveryFee: 2500,
    paymentMethod: "cod",
    totalAmount: 17500,
    status: "completed",
    items: [{ productId: "prod-low-data-1", productName: "Handmade Bamboo Basket", quantity: 1, price: 15000 }],
    createdAt: new Date().toISOString(),
  });
}

const evaluationRobust = evaluateDataScarcity(SHOP_ID);
assert.strictEqual(evaluationRobust.status, "robust", "Must flag 'robust' when data coverage thresholds are satisfied");
assert.strictEqual(evaluationRobust.isSuppressed, false, "Must not suppress forecasting when data is robust");
console.log(`✅ Robust Data Evaluation: Status='${evaluationRobust.status}', completedOrders=${evaluationRobust.completedOrdersCount}.`);

// 4. Test Evidence Filtering & Explorer Engine
console.log("Testing Evidence Explorer filtering engine...");
const dummyEvidence: TeamEvidence[] = [
  {
    id: "ev-1",
    shop_id: SHOP_ID,
    session_id: "sess-1",
    source_type: "inventory",
    source_id: "prod-1",
    metric_key: "stockout_buffer_breached",
    value: 2,
    unit: "units",
    observed_at: new Date().toISOString(),
    snapshot: { currentStock: 2 },
    quality: { coverage: 100, missing_fields: [], limitations: [] },
  },
  {
    id: "ev-2",
    shop_id: SHOP_ID,
    session_id: "sess-1",
    source_type: "inquiry",
    source_id: "tg-drop",
    metric_key: "delivery_fee_too_high",
    value: 3,
    unit: "events",
    observed_at: new Date().toISOString(),
    snapshot: { count: 3 },
    quality: { coverage: 100, missing_fields: [], limitations: [] },
  },
  {
    id: "ev-3",
    shop_id: SHOP_ID,
    session_id: "sess-2",
    source_type: "product",
    source_id: "prod-2",
    metric_key: "unit_contribution_margin",
    value: 32.5,
    unit: "%",
    observed_at: new Date().toISOString(),
    snapshot: { marginPct: 32.5 },
    quality: { coverage: 100, missing_fields: [], limitations: [] },
  },
];

const filteredInventory = filterEvidenceRecords(dummyEvidence, { sourceType: "inventory" });
assert.strictEqual(filteredInventory.length, 1, "Should filter by source_type 'inventory'");
assert.strictEqual(filteredInventory[0].metric_key, "stockout_buffer_breached");

const filteredSearch = filterEvidenceRecords(dummyEvidence, { searchQuery: "delivery" });
assert.strictEqual(filteredSearch.length, 1, "Should filter by search query matching metric_key");
assert.strictEqual(filteredSearch[0].id, "ev-2");

console.log(`✅ Evidence Explorer Engine: correctly filtered records by source and query.`);

console.log("\n🎉 ALL TICKET 07 TESTS PASSED (GREEN)!");
