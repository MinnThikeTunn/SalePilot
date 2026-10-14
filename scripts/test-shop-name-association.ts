import assert from "node:assert";
import {
  resolveStoreName,
  resolveStoreNameSync,
  getStoreContextSnapshot,
  getStoreContextSnapshotAsync,
  generateAgentChatResponse,
} from "../src/features/sales-team/services/geminiSalesTeamService";

async function run() {
  console.log("=== RUNNING TEST: Shop Name Association ('hWwwoWgTjJ3f5X2f' -> 'Johnson') ===");

  const targetShopId = "hWwwoWgTjJ3f5X2f";

  // 1. Test live Supabase resolution of the user's real shop ID
  const resolvedName = await resolveStoreName(targetShopId);
  console.log(`Resolved name from Supabase for '${targetShopId}': "${resolvedName}"`);

  assert.strictEqual(
    resolvedName,
    "Johnson",
    `Expected shop '${targetShopId}' to resolve to 'Johnson' from Supabase shops table`
  );
  console.log("✅ resolveStoreName correctly fetched 'Johnson' from Supabase shops table!");

  // 2. Test synchronous snapshot resolution (reads cached name)
  const syncSnapshot = getStoreContextSnapshot(targetShopId);
  assert.strictEqual(
    syncSnapshot.storeName,
    "Johnson",
    "Sync snapshot should use resolved 'Johnson' store name"
  );
  assert(
    !syncSnapshot.storeName.includes(targetShopId),
    "Store name MUST NOT contain the raw ID string"
  );
  console.log("✅ getStoreContextSnapshot accurately uses 'Johnson' as store name!");

  // 3. Test async snapshot resolution
  const asyncSnapshot = await getStoreContextSnapshotAsync(targetShopId);
  assert.strictEqual(
    asyncSnapshot.storeName,
    "Johnson",
    "Async snapshot should use resolved 'Johnson' store name"
  );
  console.log("✅ getStoreContextSnapshotAsync accurately uses 'Johnson' as store name!");

  // 4. Test agent chatbot response (greeting & overview)
  const commanderChat = await generateAgentChatResponse({
    agentKey: "commander",
    agentName: "Commander",
    agentTitle: "Strategy Lead",
    personaPrompt: "Decisive executive lead.",
    motto: "Strategy without data is hallucination.",
    shopId: targetShopId,
    userMessage: "Give me your strategic overview",
  });

  console.log("\nCommander Chat Output Sample:");
  console.log(commanderChat.text.slice(0, 200) + "...\n");

  assert(
    !commanderChat.text.includes(targetShopId),
    `Agent response MUST NOT leak raw technical ID '${targetShopId}'`
  );
  assert(
    !commanderChat.text.includes(`shop "${targetShopId}"`),
    `Agent response MUST NOT contain 'shop "${targetShopId}"'`
  );
  console.log("✅ Commander output successfully refers to 'Johnson' without leaking raw ID!");

  console.log("\n🎉 ALL SHOP NAME ASSOCIATION TESTS PASSED (GREEN)!\n");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
