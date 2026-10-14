import assert from "node:assert";
import {
  calculateProductEconomics,
  runGuardianAudit,
} from "../src/features/sales-team/agents/guardianRunner";
import { resetState, mutateProducts } from "../src/services/clientStore";
import { updateShopBusinessPolicies } from "../src/features/sales-team/services/salesTeamApi";

console.log("=== RUNNING TEST: Ticket 04 - Guardian Profit Policies & Margin Engine ===");

// 1. Reset baseline state
resetState();

const SHOP_ID = "test_shop_guardian";

// 2. Set strict shop business policy
updateShopBusinessPolicies(SHOP_ID, {
  min_contribution_margin_pct: 15.0,
  max_discount_pct: 20.0,
  require_delivery_fee_coverage: true,
  max_cod_return_allowance_pct: 15.0,
});

// 3. Test Pure Deterministic Formula: Healthy Unit Economics
console.log("Testing healthy unit economics calculation...");
const healthyCalc = calculateProductEconomics({
  price: 20000,
  costPrice: 12000,
  discountPct: 10,
  deliveryFee: 3000,
  courierReturnRiskPct: 15,
  policy: {
    shop_id: SHOP_ID,
    min_contribution_margin_pct: 15.0,
    max_discount_pct: 20.0,
    require_delivery_fee_coverage: true,
    max_cod_return_allowance_pct: 15.0,
  },
});

assert.strictEqual(healthyCalc.netPrice, 18000, "Net price must be 18,000 MMK");
assert.strictEqual(healthyCalc.grossMarginMmk, 6000, "Gross margin must be 6,000 MMK");
assert.strictEqual(healthyCalc.returnRiskAllowanceMmk, 450, "Return risk allowance must be 450 MMK (15% of 3000)");
assert.strictEqual(healthyCalc.contributionMmk, 5550, "Contribution MMK must be 5,550 MMK");
assert(healthyCalc.contributionMarginPct && healthyCalc.contributionMarginPct > 30, "Contribution margin must be ~30.8%");
assert.strictEqual(healthyCalc.status, "approved", "Healthy margin must be approved");
assert(!healthyCalc.isVetoed, "Healthy margin must NOT be vetoed");
console.log(`✅ Approved healthy unit economics: ${healthyCalc.contributionMarginPct}% contribution margin`);

// 4. Test Discount Cap Policy Veto
console.log("Testing discount cap policy veto (25% discount > 20% max)...");
const discountVetoCalc = calculateProductEconomics({
  price: 20000,
  costPrice: 10000,
  discountPct: 25,
  deliveryFee: 3000,
  courierReturnRiskPct: 15,
  policy: {
    shop_id: SHOP_ID,
    min_contribution_margin_pct: 15.0,
    max_discount_pct: 20.0,
    require_delivery_fee_coverage: true,
    max_cod_return_allowance_pct: 15.0,
  },
});

assert.strictEqual(discountVetoCalc.status, "vetoed", "25% discount must trigger policy veto");
assert(discountVetoCalc.isVetoed, "isVetoed flag must be true");
assert(discountVetoCalc.vetoReason?.toLowerCase().includes("discount"), "Veto reason must cite discount ceiling");
console.log(`✅ Guardian successfully vetoed excessive discount: ${discountVetoCalc.vetoReason}`);

// 5. Test Margin Floor Policy Veto
console.log("Testing contribution margin floor veto (thin margin breaching 15% floor)...");
const thinMarginCalc = calculateProductEconomics({
  price: 20000,
  costPrice: 17500,
  discountPct: 5,
  deliveryFee: 3000,
  courierReturnRiskPct: 15,
  policy: {
    shop_id: SHOP_ID,
    min_contribution_margin_pct: 15.0,
    max_discount_pct: 20.0,
    require_delivery_fee_coverage: true,
    max_cod_return_allowance_pct: 15.0,
  },
});

assert.strictEqual(thinMarginCalc.status, "vetoed", "Thin margin must trigger policy veto");
assert(thinMarginCalc.isVetoed, "isVetoed flag must be true");
assert(thinMarginCalc.vetoReason?.toLowerCase().includes("contribution"), "Veto reason must cite contribution floor");
console.log(`✅ Guardian successfully vetoed thin margin: ${thinMarginCalc.vetoReason}`);

// 6. Test Critical Seam: Missing COGS (cost_price missing or 0)
console.log("Testing missing COGS seam: must NEVER substitute 0 as cost...");
const missingCostCalc = calculateProductEconomics({
  price: 20000,
  costPrice: undefined,
  discountPct: 0,
  deliveryFee: 3000,
  courierReturnRiskPct: 15,
  policy: {
    shop_id: SHOP_ID,
    min_contribution_margin_pct: 15.0,
    max_discount_pct: 20.0,
    require_delivery_fee_coverage: true,
    max_cod_return_allowance_pct: 15.0,
  },
});

assert.strictEqual(missingCostCalc.costMissing, true, "Must flag costMissing: true");
assert.strictEqual(missingCostCalc.grossMarginMmk, null, "Gross margin MMK must be null when cost is missing (not 0 or 20000)");
assert.strictEqual(missingCostCalc.contributionMarginPct, null, "Contribution % must be null when cost is missing");
assert.strictEqual(missingCostCalc.status, "warning_unverified", "Status must be warning_unverified");
console.log("✅ Missing COGS handled safely: margins returned as null/unknown without substituting zero!");

// 7. Seed catalog products and execute Guardian Agent Runner
console.log("Executing Guardian Agent Runner on store catalog...");
mutateProducts("add", {
  id: "prod_guard_healthy",
  name: "Silk Scarf",
  price: 25000,
  cost_price: 12000,
  stock: 20,
  category: "Fashion",
  description: "Premium silk scarf",
  image: "",
});

mutateProducts("add", {
  id: "prod_guard_nocost",
  name: "Uncosted Handicraft",
  price: 15000,
  stock: 10,
  category: "Crafts",
  description: "Handcrafted item with missing wholesale invoice",
  image: "",
});

const guardianReport = runGuardianAudit({
  shopId: SHOP_ID,
  proposedDiscountPct: 10,
});

assert(guardianReport.financialAudits.length >= 2, "Must audit all catalog products");
assert(guardianReport.evidence.length >= 2, "Guardian must generate verifiable evidence citations");
assert.strictEqual(guardianReport.agentKey, "guardian");
assert.strictEqual(guardianReport.agentName, "Guardian");

const uncostedAudit = guardianReport.financialAudits.find((a) => a.productId === "prod_guard_nocost");
assert(uncostedAudit, "Must include audit for uncosted product");
assert.strictEqual(uncostedAudit.costMissing, true, "Uncosted audit must mark costMissing");
assert.strictEqual(uncostedAudit.status, "warning_unverified");

console.log(`✅ Guardian audit completed: ${guardianReport.financialAudits.length} products audited, ${guardianReport.evidence.length} evidence citations.`);

console.log("\n🎉 ALL TICKET 04 TESTS PASSED (GREEN)!");
