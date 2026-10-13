import assert from "node:assert";
import { getState, resetState, updateOrderStatus, mutateProducts, addOrder } from "../src/services/clientStore";

console.log("=== RUNNING FEEDBACK LOOP: COD Order Stock Deduction ===");

// 1. Reset state to clean baseline
resetState();

// 2. Add test product with stock = 10
const testProdId = "prod-test-stock-1";
mutateProducts("add", {
  id: testProdId,
  name: "Silk Scarf Test",
  price: 5000,
  stock: 10,
});

// Verify product exists in state with stock = 10
let state = getState();
const product = state.products.find((p) => p.name === "Silk Scarf Test");
assert(product, "Test product must exist");
const actualProdId = product.id;
const initialStock = product.stock;
console.log(`Initial stock for product '${product.name}' (${actualProdId}): ${initialStock}`);

// 3. Create a pending COD order with 2 items of this product
const testOrderId = "ord-test-cod-1";
const orderQuantity = 2;
addOrder({
  id: testOrderId,
  invoiceId: "INV-TEST-001",
  customerName: "Ko Min",
  customerPhone: "0912345678",
  customerTelegramId: "tg_test",
  township: "Kamayut",
  deliveryFee: 2000,
  paymentMethod: "cod",
  totalAmount: 12000,
  status: "pending",
  items: [
    {
      productId: actualProdId,
      productName: product.name,
      price: product.price,
      quantity: orderQuantity,
    },
  ],
  createdAt: new Date().toISOString(),
});

console.log(`Placed COD order '${testOrderId}' with ${orderQuantity} unit(s) of '${product.name}'.`);

// 4. Drive the code path: Approve COD order (status -> "confirmed")
console.log(`Approving COD order '${testOrderId}' (transitioning status to 'confirmed')...`);
updateOrderStatus(testOrderId, "confirmed");

// 5. Assert: Stock must be decremented by order quantity (10 - 2 = 8)
state = getState();
const updatedProduct = state.products.find((p) => p.id === actualProdId);
const expectedStock = initialStock - orderQuantity;

console.log(`Post-approval stock: ${updatedProduct?.stock}`);
console.log(`Expected stock: ${expectedStock}`);

if (updatedProduct?.stock === expectedStock) {
  console.log("✅ PASS (GREEN): Stock correctly deducted on COD order approval!");
  process.exit(0);
} else {
  console.error(`❌ FAIL (RED): Stock was NOT deducted! Expected ${expectedStock}, but found ${updatedProduct?.stock}.`);
  process.exit(1);
}
