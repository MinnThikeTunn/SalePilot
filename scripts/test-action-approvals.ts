import assert from "node:assert";
import {
  createPendingApproval,
  approveAction,
  rejectAction,
  verifyAndExecuteAction,
  computeCanonicalPayloadHash,
  getApprovalsForShop,
} from "../src/features/sales-team/services/approvalService";
import { resetState, mutateProducts } from "../src/services/clientStore";

console.log("=== RUNNING TEST: Ticket 06 - Action Center & Cryptographic Approvals (SHA-256) ===");

// 1. Reset baseline state
resetState();

const SHOP_ID = "test_shop_approvals";

// 2. Seed catalog product
mutateProducts("add", {
  id: "prod-sha-test",
  name: "Authentic Bagan Lacquerware Box",
  price: 45000,
  cost_price: 25000,
  stock: 12,
  safety_stock_threshold: 3,
  category: "Crafts",
  description: "Handcrafted traditional Bagan lacquerware",
  image: "",
});

// 3. Test Pure Deterministic Seam: Canonical JSON SHA-256 Hashing
console.log("Testing canonical JSON SHA-256 hashing seam...");
const payload1 = {
  productId: "prod-sha-test",
  discountPct: 10,
  targetChannel: "telegram_broadcast",
  priceMmk: 45000,
};

// Same payload with reversed keys
const payload2 = {
  priceMmk: 45000,
  targetChannel: "telegram_broadcast",
  discountPct: 10,
  productId: "prod-sha-test",
};

const hash1 = computeCanonicalPayloadHash(payload1);
const hash2 = computeCanonicalPayloadHash(payload2);

assert(hash1.length === 64, "SHA-256 hash must be 64 hexadecimal characters");
assert.strictEqual(hash1, hash2, "Canonical JSON hashing must be order-invariant");
console.log(`✅ Canonical SHA-256 Hash verified: ${hash1}`);

// 4. Create Pending Approval
console.log("Creating pending approval from decision action...");
const approval = createPendingApproval({
  shopId: SHOP_ID,
  decisionId: "dec-test-123",
  actionType: "draft_campaign",
  payload: payload1,
});

assert(approval.id, "Approval must have unique ID");
assert.strictEqual(approval.status, "pending", "Initial status must be pending");
assert.strictEqual(approval.approved_payload_hash, hash1, "Approval must record matching payload hash");
console.log(`✅ Created pending approval '${approval.id}' with hash ${approval.approved_payload_hash.slice(0, 16)}...`);

// 5. Test Owner Rejection Seam
console.log("Testing rejection flow with feedback...");
const rejectTestApproval = createPendingApproval({
  shopId: SHOP_ID,
  decisionId: "dec-test-reject",
  actionType: "draft_campaign",
  payload: { note: "too aggressive" },
});
const rejected = rejectAction(rejectTestApproval.id, "Discount exceeds owner comfort level");
assert.strictEqual(rejected.status, "rejected", "Status must be rejected");
console.log("✅ Rejection flow verified.");

// 6. Test Owner 1-Click Approval
console.log("Testing 1-click owner approval...");
const approved = approveAction(approval.id, "owner_user_456");
assert.strictEqual(approved.status, "approved", "Status must transition to approved");
assert(approved.approved_at, "Must record approved_at timestamp");
console.log(`✅ Action approved by ${approved.approved_by} at ${approved.approved_at}`);

// 7. CRITICAL SEAM: Pre-execution Invalidation Guard (ADR-0003)
console.log("Testing pre-execution guard: mutating product stock in catalog...");
// Mutate product stock to zero (out of stock)
mutateProducts("update", {
  id: "prod-sha-test",
  product: {
    stock: 0,
  },
});

console.log("Attempting to execute approved action after stock depletion...");
const executionAttempt = verifyAndExecuteAction(approval.id);

assert.strictEqual(executionAttempt.success, false, "Execution must FAIL when underlying stock changes");
assert.strictEqual(executionAttempt.status, "invalidated", "Status must transition to invalidated");
assert(executionAttempt.reason?.toLowerCase().includes("invalidated") || executionAttempt.reason?.toLowerCase().includes("stock"), "Reason must cite stock mutation");
console.log(`✅ Pre-execution guard blocked stale action: ${executionAttempt.reason}`);

// 8. Re-verification after restoring valid catalog state
console.log("Testing recovery: restocking item and creating refreshed approval...");
mutateProducts("update", {
  id: "prod-sha-test",
  product: {
    stock: 15,
    price: 45000,
  },
});

const refreshedApproval = createPendingApproval({
  shopId: SHOP_ID,
  decisionId: "dec-test-123",
  actionType: "draft_campaign",
  payload: payload1,
});
approveAction(refreshedApproval.id, "owner_user_456");

const successfulExecution = verifyAndExecuteAction(refreshedApproval.id);
assert.strictEqual(successfulExecution.success, true, "Execution must succeed when parameters remain valid");
assert.strictEqual(successfulExecution.status, "executed", "Status must transition to executed");
console.log("✅ Action successfully verified and executed!");

console.log("\n🎉 ALL TICKET 06 TESTS PASSED (GREEN)!");
