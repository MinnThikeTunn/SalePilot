import assert from "node:assert";
import { runCouncilDeliberation } from "../src/features/sales-team/services/councilOrchestrator";
import { resetState, mutateProducts, addTelegramSession } from "../src/services/clientStore";
import { updateShopBusinessPolicies } from "../src/features/sales-team/services/salesTeamApi";

console.log("=== RUNNING TEST: Ticket 05 - Full Council Deliberation & 5-Agent Debate Loop ===");

// 1. Reset baseline state
resetState();

const SHOP_ID = "test_shop_council";

// 2. Configure strict shop policies
updateShopBusinessPolicies(SHOP_ID, {
  min_contribution_margin_pct: 15.0,
  max_discount_pct: 20.0,
  require_delivery_fee_coverage: true,
  max_cod_return_allowance_pct: 15.0,
});

// 3. Seed Catalog Products
// Item A: High margin, plenty of stock (good for promotion)
mutateProducts("add", {
  id: "prod-tea-heritage",
  name: "Shan Mountain Heritage Tea",
  price: 25000,
  cost_price: 12000,
  stock: 45,
  safety_stock_threshold: 5,
  lead_time_days: 3,
  category: "Tea",
  description: "Organic loose leaf Shan tea",
  image: "",
});

// Item B: Slow moving / dead stock (ideal for gift bundling)
mutateProducts("add", {
  id: "prod-teapot-clay",
  name: "Traditional Clay Tasting Cup",
  price: 8000,
  cost_price: 3000,
  stock: 25,
  safety_stock_threshold: 5,
  lead_time_days: 2,
  category: "Teaware",
  description: "Artisan clay tasting cup",
  image: "",
});

// 4. Seed Telegram Friction Sessions (Echo context)
addTelegramSession({
  sessionId: "sess_council_drop_1",
  customerName: "Buyer Alpha",
  customerPhone: "09111222333",
  customerTelegramId: "tg_alpha",
  lastActive: new Date().toISOString(),
  currentStep: "selecting_township",
  cart: [{ productId: "prod-tea-heritage", quantity: 1 }],
  liveTakeoverActive: false,
  messages: [
    { id: "m1", sender: "customer", content: "Is delivery to Bahan expensive?", timestamp: new Date().toISOString() },
  ],
});

// 5. Execute Full Council Deliberation Loop
console.log("Initiating full 5-agent Sales Council deliberation...");
const deliberationResult = runCouncilDeliberation({
  shopId: SHOP_ID,
  goal: "Maximize revenue for upcoming Thadingyut Lighting Festival without sacrificing contribution margin",
});

console.log("Council completed status:", deliberationResult.status);
console.log("Deliberation Session ID:", deliberationResult.session.id);
console.log("Debate rounds completed:", deliberationResult.debates.length);

// 6. Assertions
// A. Orchestrator Phase Checks
assert.strictEqual(deliberationResult.status, "completed", "Council deliberation must complete successfully");
assert(deliberationResult.session.id, "Must assign valid session id");

// B. Agent Runs - all 5 agents must execute
const agentsRun = deliberationResult.agentRuns.map((r) => r.agent_key);
assert(agentsRun.includes("scout"), "Scout must participate in deliberation");
assert(agentsRun.includes("echo"), "Echo must participate in deliberation");
assert(agentsRun.includes("guardian"), "Guardian must participate in deliberation");
assert(agentsRun.includes("muse"), "Muse must participate in deliberation");
assert(agentsRun.includes("commander"), "Commander must participate in deliberation");
console.log(`✅ All 5 Council agents ran successfully: [${agentsRun.join(", ")}]`);

// C. Muse Proposal Assertions
assert(deliberationResult.proposals.length >= 1, "Muse must formulate at least one campaign proposal");
const primaryProposal = deliberationResult.proposals[0];
assert(primaryProposal.title, "Proposal must have descriptive title");
assert(primaryProposal.hypothesis, "Proposal must state measurable hypothesis");
assert(primaryProposal.evidence_refs.length >= 1, "Muse must cite real evidence from Scout/Echo");
assert(primaryProposal.requires_owner_approval === true, "Proposals must require owner approval");
console.log(`✅ Muse crafted proposal: "${primaryProposal.title}"`);

// D. Guardian Debate & Bounded Revision Checks (ADR-0003)
assert(deliberationResult.debates.length >= 1, "Council must record at least 1 debate evaluation");
deliberationResult.debates.forEach((d) => {
  assert(d.revision_attempt <= 2, "Debate loop must not exceed maximum 2 revisions (ADR-0003)");
  assert(d.challenger === "guardian", "Guardian must challenge financial assumptions");
  assert(d.resolution === "consensus" || d.resolution === "escalated_to_owner" || d.resolution === "revised", "Debate must reach a valid resolution");
});
console.log(`✅ Guardian debate completed within ADR-0003 bounded revision cap (${deliberationResult.debates.length} rounds).`);

// E. Commander Strategy Decision Card
const decision = deliberationResult.decision;
assert(decision, "Commander must synthesize a Strategy Decision Card");
assert(decision.title, "Decision Card must have a title");
assert(decision.executive_summary.length > 30, "Executive summary must be comprehensive");
assert(decision.opportunity_score > 0, "Opportunity score must be calculated");
assert(decision.score_breakdown.impact >= 1 && decision.score_breakdown.impact <= 10, "ICE Impact score must be 1-10");
assert(decision.score_breakdown.confidence >= 1 && decision.score_breakdown.confidence <= 10, "ICE Confidence score must be 1-10");
assert(decision.score_breakdown.feasibility >= 1 && decision.score_breakdown.feasibility <= 10, "ICE Feasibility score must be 1-10");
assert(decision.next_actions.length >= 1, "Decision must provide concrete next action drafts");
assert.strictEqual(decision.next_actions[0].requires_approval, true, "Next actions must require owner approval");
console.log(`✅ Commander synthesized Strategy Decision Card: "${decision.title}" (ICE Score: ${decision.opportunity_score})`);

// F. Zero-PII Audit on Full Deliberation
const serialized = JSON.stringify(deliberationResult);
assert(!serialized.includes("09111222333"), "Zero-PII violation: Phone number found in deliberation result!");
assert(!serialized.includes("Buyer Alpha"), "Zero-PII violation: Customer name found in deliberation result!");
console.log("✅ Zero-PII Audit: No PII leaked anywhere in deliberation output!");

console.log("\n🎉 ALL TICKET 05 TESTS PASSED (GREEN)!");
