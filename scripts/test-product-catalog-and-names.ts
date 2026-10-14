import assert from "node:assert";
import { getState, setClientProducts, saveOnboarding } from "../src/services/clientStore";
import { toolRegistry } from "../src/features/sales-team/tools/toolRegistry";
import {
  getStoreContextSnapshot,
  getStoreContextSnapshotAsync,
} from "../src/features/sales-team/services/geminiSalesTeamService";

async function run() {
  console.log("=== RUNNING TEST: Product Catalog & Human-Friendly Names Verification ===");

  // 1. Configure shop with realistic boutique name
  saveOnboarding({
    shopName: "Silk & Stones Artisan Boutique",
    ownerName: "Daw Thida",
  });

  // 2. Populate products via setClientProducts
  const testProducts = [
    {
      id: "prod-998811",
      name: "Handwoven Lotus Silk Longyi",
      price: 65000,
      cost_price: 32000,
      stock: 18,
      description: "Authentic Inle Lake handwoven lotus silk fabric.",
      image: "https://example.com/lotus.jpg",
      lead_time_days: 4,
      safety_stock_threshold: 5,
    },
    {
      id: "prod-998822",
      name: "Mogok Star Sapphire Silver Ring",
      price: 185000,
      cost_price: 110000,
      stock: 3,
      description: "Hand-set 925 sterling silver natural sapphire.",
      image: "https://example.com/sapphire.jpg",
      lead_time_days: 7,
      safety_stock_threshold: 2,
    },
    {
      id: "prod-998833",
      name: "Bagan Lacquerware Tea Caddy",
      price: 28000,
      cost_price: 12000,
      stock: 25,
      description: "Traditional bamboo and lacquer handmade caddy.",
      image: "https://example.com/lacquer.jpg",
      lead_time_days: 3,
      safety_stock_threshold: 6,
    },
  ];

  setClientProducts(testProducts as any);

  // Verify clientStore updated
  const storedState = getState();
  assert.strictEqual(
    storedState.products.length,
    3,
    "clientStore should contain 3 products after setClientProducts"
  );
  console.log("✅ setClientProducts accurately saved products into clientStore.");

  // 3. Test get_product_catalog tool via toolRegistry
  const catalogResult = await toolRegistry.executeToolAsync("get_product_catalog", {
    shopId: "shop_artisan_yangon",
  });

  assert(catalogResult.products.length >= 3, "Catalog tool should return at least 3 products");
  assert.strictEqual(
    catalogResult.products[0].name,
    "Handwoven Lotus Silk Longyi",
    "Product name should be preserved"
  );
  console.log(`✅ get_product_catalog returned ${catalogResult.totalCount} products properly.`);

  // 4. Test snapshot formatting for human-friendly names (no raw IDs)
  const syncSnapshot = getStoreContextSnapshot("shop_artisan_yangon");
  assert.strictEqual(
    syncSnapshot.storeName,
    "Silk & Stones Artisan Boutique",
    "Store name should be human-readable"
  );
  assert(
    !syncSnapshot.productSummary.includes("[prod-"),
    "Product summary MUST NOT contain technical '[prod-' IDs"
  );
  assert(
    syncSnapshot.productSummary.includes("• Handwoven Lotus Silk Longyi"),
    "Product summary should format with clean bullet points and human name"
  );
  console.log("✅ getStoreContextSnapshot formats cleanly with store name and no technical [prod-...] IDs.");

  const asyncSnapshot = await getStoreContextSnapshotAsync("shop_artisan_yangon");
  assert.strictEqual(
    asyncSnapshot.storeName,
    "Silk & Stones Artisan Boutique",
    "Async store name should be human-readable"
  );
  assert(
    !asyncSnapshot.productSummary.includes("[prod-"),
    "Async product summary MUST NOT contain technical '[prod-' IDs"
  );
  assert(
    asyncSnapshot.productSummary.includes("• Handwoven Lotus Silk Longyi"),
    "Async product summary should format with clean bullet points and human name"
  );
  console.log("✅ getStoreContextSnapshotAsync formats cleanly with store name and no technical [prod-...] IDs.");

  console.log("\n🎉 ALL PRODUCT CATALOG & HUMAN-FRIENDLY NAME TESTS PASSED (GREEN)!\n");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
