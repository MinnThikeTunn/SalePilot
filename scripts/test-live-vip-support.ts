import { getState, botTakeover, botRelease, botOwnerReply, botSimulateInput, createSimulationCustomer } from "../src/services/clientStore";
import { getDefaultSessions } from "../src/services/defaults";

console.log("=== RUNNING LIVE VIP SUPPORT AUTOMATED SUITE ===");

// 1. Verify default sessions
const defaults = getDefaultSessions();
if (!defaults.default_customer) {
  console.error("❌ FAIL: default_customer session not found in getDefaultSessions");
  process.exit(1);
}
console.log("✅ Step 1: Default sessions hydrated correctly:", Object.keys(defaults));

// 2. Load state
const state = getState();
if (!state.sessions || Object.keys(state.sessions).length === 0) {
  console.error("❌ FAIL: state.sessions is empty in clientStore");
  process.exit(1);
}
console.log("✅ Step 2: clientStore initialized with sessions:", Object.keys(state.sessions));

// 3. Takeover
const sessId = "default_customer";
botTakeover(sessId);
const postTakeover = getState();
if (!postTakeover.sessions[sessId].liveTakeoverActive) {
  console.error("❌ FAIL: liveTakeoverActive is not true after botTakeover");
  process.exit(1);
}
console.log("✅ Step 3: Live takeover activated successfully");

// 4. Owner Reply
const replyText = "Hello from Store Owner! Yes, we can offer free delivery.";
botOwnerReply(sessId, replyText);
const postReply = getState();
const latestMsg = postReply.sessions[sessId].messages[postReply.sessions[sessId].messages.length - 1];
if (latestMsg.sender !== "owner" || latestMsg.content !== replyText) {
  console.error("❌ FAIL: Owner reply not recorded properly:", latestMsg);
  process.exit(1);
}
console.log("✅ Step 4: Owner reply recorded with sender 'owner':", latestMsg.content);

// 5. Customer Simulation during Takeover
const customerMsg = "Thank you so much! Please confirm my order.";
botSimulateInput({ sessionId: sessId, content: customerMsg });
const postCust = getState();
const msgs = postCust.sessions[sessId].messages;
const lastCustMsg = msgs[msgs.length - 1];
if (lastCustMsg.sender !== "customer" || lastCustMsg.content !== customerMsg) {
  console.error("❌ FAIL: Customer message not recorded during takeover:", lastCustMsg);
  process.exit(1);
}
// Ensure Candy bot did not reply while takeover is active
if (msgs[msgs.length - 1].sender === "bot") {
  console.error("❌ FAIL: Bot should not auto-reply while takeover is active!");
  process.exit(1);
}
console.log("✅ Step 5: Customer input received, Bot auto-reply paused during live takeover");

// 6. Release to AI
botRelease(sessId);
const postRelease = getState();
if (postRelease.sessions[sessId].liveTakeoverActive) {
  console.error("❌ FAIL: liveTakeoverActive is not false after botRelease");
  process.exit(1);
}
console.log("✅ Step 6: Released back to AI Candy successfully");

// 7. Create Simulation Customer
const newCust = createSimulationCustomer("Ko Min Min");
const postNew = getState();
if (!postNew.sessions[newCust.sessionId]) {
  console.error("❌ FAIL: New simulation customer was not created in state");
  process.exit(1);
}
console.log("✅ Step 7: New simulation customer created dynamically:", newCust.sessionId, newCust.customerName);

console.log("\n🎉 ALL LIVE VIP SUPPORT SUITE TESTS PASSED (GREEN)!");
