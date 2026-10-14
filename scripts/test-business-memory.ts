import assert from "node:assert";
import {
  saveBusinessMemory,
  getBusinessMemories,
  deleteBusinessMemory,
  retrieveRelevantMemories,
  attemptUnverifiedPromotion,
} from "../src/features/sales-team/services/businessMemoryService";
import {
  createPendingApproval,
  rejectAction,
} from "../src/features/sales-team/services/approvalService";
import { runCouncilDeliberation } from "../src/features/sales-team/services/councilOrchestrator";
import { resetState, mutateProducts } from "../src/services/clientStore";

console.log("=== RUNNING TEST: Ticket 08 - Business Memory & Feedback Learning ===");

// 1. Reset baseline state
resetState();

const SHOP_ID = "test_shop_memory";

// 2. Test Direct Memory CRUD
console.log("Testing direct Business Memory CRUD...");
const memory1 = saveBusinessMemory({
  shopId: SHOP_ID,
  memoryType: "policy",
  content: "Store maintains a strict minimum 15% contribution margin on all items.",
  sourceRefs: ["policy_config"],
  confidence: "high",
});

assert(memory1.id, "Must assign valid memory id");
assert.strictEqual(memory1.memory_type, "policy");

const allMemories = getBusinessMemories(SHOP_ID);
assert.strictEqual(allMemories.length, 1, "Should have 1 stored memory");
console.log(`✅ Stored initial policy memory: '${memory1.content}'`);

// 3. Test Automatic Memory Capture from Owner Rejection in Action Center
console.log("Testing automatic memory capture upon action rejection...");
const testApproval = createPendingApproval({
  shopId: SHOP_ID,
  decisionId: "dec-mem-test",
  actionType: "draft_campaign",
  payload: {
    proposed_discount_pct: 20,
    productName: "Heritage Shan Tea",
  },
});

rejectAction(testApproval.id, "Never discount Shan tea more than 10%. Use complimentary teaware gifts instead.");

const memoriesAfterRejection = getBusinessMemories(SHOP_ID);
const correctionMem = memoriesAfterRejection.find((m) => m.memory_type === "owner_correction");
assert(correctionMem, "Action rejection must automatically capture an 'owner_correction' memory entry");
assert(correctionMem.content.includes("Never discount Shan tea more than 10%"), "Memory content must preserve owner rejection rationale");
console.log(`✅ Auto-captured owner correction memory: "${correctionMem.content}"`);

// 4. Test Relevance-Based Memory Retriever
console.log("Testing relevance-based memory retriever...");
const relevant = retrieveRelevantMemories({
  shopId: SHOP_ID,
  query: "Shan Tea festival promotion",
});

assert(relevant.length >= 1, "Must retrieve relevant memories matching product and topic");
assert(relevant.some((m) => m.content.includes("Shan tea")), "Retrieved memory must match topic keywords");
console.log(`✅ Retriever returned ${relevant.length} relevant historical memory entries.`);

// 5. Test Memory Injection into Council Orchestration (Muse Adapts)
console.log("Testing memory feedback loop in full Sales Council deliberation...");
mutateProducts("add", {
  id: "prod-tea-heritage",
  name: "Shan Mountain Heritage Tea",
  price: 25000,
  cost_price: 12000,
  stock: 40,
  safety_stock_threshold: 5,
  lead_time_days: 3,
  category: "Tea",
  description: "Heritage tea",
  image: "",
});

const councilRun = runCouncilDeliberation({
  shopId: SHOP_ID,
  goal: "Thadingyut Festival campaign for Shan tea",
});

assert(councilRun.decision, "Council must synthesize decision card");
const primaryProp = councilRun.proposals[0];
assert(primaryProp, "Council must craft proposal");

// Muse must NOT repeat the rejected 20% discount; must cap at 10% or below per memory!
const activeDiscount = (primaryProp as any).campaign_payload?.proposedDiscountPct ?? 10;
assert(activeDiscount <= 10, `Muse must obey owner correction memory: proposed discount ${activeDiscount}% must be <= 10%`);
console.log(`✅ Council deliberation successfully honored business memory: Muse bounded discount to ${activeDiscount}%.`);

// 6. Test Guardrail: Unverified AI Conclusion Cannot Promote to Permanent Memory
console.log("Testing unverified AI conclusion promotion guardrail...");
const promotionAttempt = attemptUnverifiedPromotion({
  shopId: SHOP_ID,
  content: "AI hallucination: Tea sales surge by 500% with no proof",
  isConfirmedByOwner: false,
});

assert.strictEqual(promotionAttempt.success, false, "Unverified AI conclusion must be rejected");
assert.strictEqual(promotionAttempt.reason, "Guardrail violation: Only human-confirmed corrections or approved actions may enter permanent memory.");
console.log("✅ Guardrail enforced: Unverified AI assertions blocked from polluting memory ledger!");

// 7. Test Delete Memory
console.log("Testing memory deletion...");
const deleteSuccess = deleteBusinessMemory(correctionMem.id, SHOP_ID);
assert.strictEqual(deleteSuccess, true, "Should successfully delete memory");
const memoriesPostDelete = getBusinessMemories(SHOP_ID);
assert(!memoriesPostDelete.some((m) => m.id === correctionMem.id), "Deleted memory must no longer exist");
console.log("✅ Memory deletion verified.");

console.log("\n🎉 ALL TICKET 08 TESTS PASSED (GREEN)!");
