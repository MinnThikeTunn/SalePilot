import assert from "node:assert";
import { toolRegistry } from "../src/features/sales-team/tools/toolRegistry";
import {
  getDataFreshnessStatus,
  getShopBusinessPolicies,
  updateShopBusinessPolicies,
  getPendingApprovalsCount,
} from "../src/features/sales-team/services/salesTeamApi";
import { resetState, mutateProducts, addOrder } from "../src/services/clientStore";

console.log("=== RUNNING TEST: Ticket 01 - Sales Team Workspace & Tool Registry ===");

// 1. Reset baseline state
resetState();

// Seed test catalog
mutateProducts("add", {
  id: "prod-tea-01",
  name: "Shan Green Tea Organic",
  price: 6000,
  cost_price: 3600,
  stock: 20,
  safety_stock_threshold: 5,
});

mutateProducts("add", {
  id: "prod-honey-02",
  name: "Wild Forest Honey",
  price: 12000,
  cost_price: 7000,
  stock: 3, // Below threshold
  safety_stock_threshold: 5,
});

// Seed test order
addOrder({
  id: "ord-test-01",
  invoiceId: "INV-TEAM-001",
  customerName: "Ma Thida",
  customerPhone: "09987654321",
  customerTelegramId: "tg_thida",
  township: "Bahan",
  deliveryFee: 2500,
  paymentMethod: "cod",
  totalAmount: 8500,
  status: "confirmed",
  items: [
    {
      productId: "prod-tea-01",
      productName: "Shan Green Tea Organic",
      price: 6000,
      quantity: 1,
    },
  ],
  createdAt: new Date().toISOString(),
});

// 2. Verify Tool Registry
console.log("Verifying Agent Tool Registry...");
const tools = toolRegistry.getAllTools();
const toolNames = tools.map((t) => t.name);

console.log("Registered Tools:", toolNames);
assert(toolNames.includes("get_product_catalog"), "Must have get_product_catalog tool");
assert(toolNames.includes("get_order_history"), "Must have get_order_history tool");
assert(toolNames.includes("get_delivery_matrix"), "Must have get_delivery_matrix tool");
assert(toolNames.includes("calculate_unit_economics"), "Must have calculate_unit_economics tool");
assert(toolNames.includes("get_customer_friction_signals"), "Must have get_customer_friction_signals tool");
assert(toolNames.includes("get_shop_policies"), "Must have get_shop_policies tool");

// 3. Test Tool Execution (get_product_catalog)
const catalogResult = toolRegistry.executeTool("get_product_catalog", { shopId: "test_shop" });
assert(Array.isArray(catalogResult.products), "Product catalog must return products array");
assert(catalogResult.products.length >= 2, "Must return seeded products");
console.log(`✅ Tool get_product_catalog returned ${catalogResult.products.length} products.`);

// 4. Test Deterministic Economics Tool (calculate_unit_economics)
const economicsResult = toolRegistry.executeTool("calculate_unit_economics", {
  shopId: "test_shop",
  price: 10000,
  costPrice: 6000,
  discountPct: 10,
  deliveryFee: 2000,
  courierReturnRiskPct: 15,
});

// Net price after 10% discount = 9000
// Gross contribution = 9000 - 6000 - return allowance = calculated deterministically
assert(economicsResult.netPrice === 9000, "Net price must be 9000");
assert(typeof economicsResult.contributionMarginPct === "number", "Contribution margin % must be numeric");
assert(economicsResult.contributionMarginPct > 0, "Contribution margin must be positive");
console.log(`✅ Deterministic economics calculation passed: Margin = ${economicsResult.contributionMarginPct}%`);

// 5. Test Sales Team Service Data Freshness
const freshness = getDataFreshnessStatus("test_shop");
console.log("Data Freshness Status:", freshness);
assert(freshness.totalProducts >= 2, "Must count total products");
assert(typeof freshness.dataCoverageStatus === "string", "Must provide data coverage status");

// 6. Test Shop Policies
const defaultPolicy = getShopBusinessPolicies("test_shop");
assert(defaultPolicy.min_contribution_margin_pct === 15, "Default min margin must be 15%");
assert(defaultPolicy.max_discount_pct === 20, "Default max discount must be 20%");

updateShopBusinessPolicies("test_shop", { min_contribution_margin_pct: 18 });
const updatedPolicy = getShopBusinessPolicies("test_shop");
assert(updatedPolicy.min_contribution_margin_pct === 18, "Updated policy must be 18%");
console.log("✅ Shop Business Policy update verified.");

// 7. Test Pending Approvals Count
const pendingCount = getPendingApprovalsCount("test_shop");
assert(typeof pendingCount === "number", "Pending approvals count must be a number");
console.log(`✅ Pending approvals count: ${pendingCount}`);

console.log("\n🎉 ALL TICKET 01 TESTS PASSED (GREEN)!");
