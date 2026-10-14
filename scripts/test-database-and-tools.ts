import assert from "node:assert";
import { toolRegistry } from "../src/features/sales-team/tools/toolRegistry";
import {
  getShopBusinessPolicies,
  updateShopBusinessPolicies,
} from "../src/features/sales-team/services/salesTeamApi";
import {
  saveBusinessMemory,
  getBusinessMemories,
} from "../src/features/sales-team/services/businessMemoryService";
import {
  getStoreContextSnapshot,
  getStoreContextSnapshotAsync,
  resolveAndExecuteRelevantTools,
} from "../src/features/sales-team/services/geminiSalesTeamService";
import { resetState, mutateProducts, addOrder } from "../src/services/clientStore";

console.log("=== RUNNING TEST: Database & Tool Fetching Verification ===");

// 1. Reset baseline state
resetState();

const SHOP_ID = "shop_test_db_tools";

// 2. Set custom non-default shop business policies (e.g. 18% margin floor, 25% max discount)
const customPolicy = updateShopBusinessPolicies(SHOP_ID, {
  min_contribution_margin_pct: 18.5,
  max_discount_pct: 25.0,
  require_delivery_fee_coverage: true,
  max_cod_return_allowance_pct: 12.0,
});
assert.strictEqual(customPolicy.min_contribution_margin_pct, 18.5);

// 3. Save a custom business memory
saveBusinessMemory({
  shopId: SHOP_ID,
  memoryType: "owner_correction",
  content: "Always require 30% prepayment deposit for orders delivering to Mandalay outer townships",
  confidence: "high",
});

// 4. Seed products and orders
mutateProducts("add", {
  id: "prod-tea-99",
  name: "Royal Peacock Green Tea",
  price: 15000,
  cost_price: 7500,
  stock: 30,
});

addOrder({
  id: "ord-test-99",
  invoiceId: "INV-9999",
  customerName: "Ko Min Min",
  customerPhone: "0955512345",
  customerTelegramId: "tg_minmin",
  township: "Kamayut",
  deliveryFee: 2000,
  paymentMethod: "prepay",
  totalAmount: 17000,
  status: "confirmed",
  items: [{ productId: "prod-tea-99", productName: "Royal Peacock Green Tea", price: 15000, quantity: 1 }],
  createdAt: new Date().toISOString(),
});

// ============================================================================
// TEST 1: Tool Registry - get_shop_policies must return DYNAMIC policies (not hardcoded 15%)
// ============================================================================
console.log("Verifying get_shop_policies dynamic resolution...");
const syncPolicyResult = toolRegistry.executeTool("get_shop_policies", { shopId: SHOP_ID });
assert.strictEqual(
  syncPolicyResult.min_contribution_margin_pct,
  18.5,
  "get_shop_policies must return dynamic shop policy (18.5%), not hardcoded 15%"
);
assert.strictEqual(
  syncPolicyResult.max_discount_pct,
  25.0,
  "get_shop_policies must return dynamic discount cap (25.0%), not hardcoded 20%"
);
console.log("✅ get_shop_policies returned dynamic custom policy: 18.5% margin, 25% discount cap.");

// ============================================================================
// TEST 2: Tool Registry - get_business_memory
// ============================================================================
console.log("Verifying get_business_memory tool...");
const memoryResult = toolRegistry.executeTool("get_business_memory", { shopId: SHOP_ID });
assert(Array.isArray(memoryResult.memories), "Must return memories array");
assert(memoryResult.memories.length >= 1, "Must find saved business memory");
assert(
  memoryResult.memories[0].content.includes("Mandalay"),
  "Memory content must match saved owner correction"
);
console.log("✅ get_business_memory returned saved verified lessons.");

// ============================================================================
// TEST 3: Async Tool Execution on All Registered Tools
// ============================================================================
async function runAsyncTests() {
  console.log("Verifying executeToolAsync across all tools...");

  // Catalog
  const catAsync = await toolRegistry.executeToolAsync("get_product_catalog", { shopId: SHOP_ID });
  assert(catAsync.products.length >= 1, "Async catalog must return products");
  assert.strictEqual(catAsync.products[0].name, "Royal Peacock Green Tea");

  // Orders
  const ordAsync = await toolRegistry.executeToolAsync("get_order_history", { shopId: SHOP_ID });
  assert(ordAsync.orders.length >= 1, "Async orders must return order ledger");

  // Delivery Matrix
  const delAsync = await toolRegistry.executeToolAsync("get_delivery_matrix", { shopId: SHOP_ID });
  assert(Array.isArray(delAsync.zones), "Async delivery matrix must return zones array");

  // Policies
  const polAsync = await toolRegistry.executeToolAsync("get_shop_policies", { shopId: SHOP_ID });
  assert.strictEqual(polAsync.min_contribution_margin_pct, 18.5);

  // Business Memory
  const memAsync = await toolRegistry.executeToolAsync("get_business_memory", { shopId: SHOP_ID });
  assert.strictEqual(memAsync.totalCount >= 1, true);

  console.log("✅ All executeToolAsync calls completed successfully.");

  // ============================================================================
  // TEST 4: getStoreContextSnapshotAsync
  // ============================================================================
  console.log("Verifying getStoreContextSnapshotAsync...");
  const snapshot = await getStoreContextSnapshotAsync(SHOP_ID);
  assert(snapshot.products.length >= 1, "Snapshot must include products");
  assert(snapshot.orders.length >= 1, "Snapshot must include orders");
  assert.strictEqual(snapshot.policies.min_contribution_margin_pct, 18.5);
  assert(snapshot.memorySummary.includes("Mandalay"), "Snapshot must include business memories");
  console.log("✅ getStoreContextSnapshotAsync accurately synthesized full store state.");

  // ============================================================================
  // TEST 5: Dynamic Tool Dispatcher in Gemini Service
  // ============================================================================
  console.log("Verifying resolveAndExecuteRelevantTools dispatcher...");

  // Query 1: Policy inquiry
  const polDispatch = await resolveAndExecuteRelevantTools("guardian", "What is our policy on discounts?", SHOP_ID, snapshot);
  assert(
    polDispatch.toolCalls.some((tc) => tc.toolName === "get_shop_policies"),
    "Policy query must trigger get_shop_policies tool"
  );

  // Query 2: Delivery fee inquiry
  const delDispatch = await resolveAndExecuteRelevantTools("echo", "What are the shipping fees to Yangon townships?", SHOP_ID, snapshot);
  assert(
    delDispatch.toolCalls.some((tc) => tc.toolName === "get_delivery_matrix"),
    "Shipping query must trigger get_delivery_matrix tool"
  );

  // Query 3: Business memory inquiry
  const memDispatch = await resolveAndExecuteRelevantTools("commander", "What past lessons or owner corrections do we remember?", SHOP_ID, snapshot);
  assert(
    memDispatch.toolCalls.some((tc) => tc.toolName === "get_business_memory"),
    "Memory query must trigger get_business_memory tool"
  );

  // Query 4: Inventory & stock inquiry
  const invDispatch = await resolveAndExecuteRelevantTools("scout", "Show me current warehouse stock levels", SHOP_ID, snapshot);
  assert(
    invDispatch.toolCalls.some((tc) => tc.toolName === "get_product_catalog"),
    "Stock query must trigger get_product_catalog tool"
  );

  // Query 5: Margin calculation inquiry
  const calcDispatch = await resolveAndExecuteRelevantTools("guardian", "Simulate a 20% discount on Royal Peacock Tea", SHOP_ID, snapshot);
  assert(
    calcDispatch.toolCalls.some((tc) => tc.toolName === "calculate_unit_economics"),
    "Margin query must trigger calculate_unit_economics tool"
  );

  console.log("✅ Dynamic multi-tool dispatcher correctly triggered all relevant tools!");
  console.log("\n🎉 ALL DATABASE & TOOL FETCHING TESTS PASSED (GREEN)!");
}

runAsyncTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
