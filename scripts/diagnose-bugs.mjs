import { processCustomerMessage } from '../src/services/botSimulator.ts';
import fs from 'fs';
import path from 'path';

console.log('=== RUNNING DIAGNOSTIC TEST HARNESS ===\n');

let failedTests = 0;

// ==========================================
// Test 3: Double Cart Item Addition Bug
// ==========================================
console.log('--- Test 3: botSimulator.ts Double-Add Bug ---');
const dummyState = {
  config: { shopName: 'Silk Store' },
  products: [{ id: 'p1', name: 'Silk Scarf', price: 15000, description: '', stock: 10, image: '', varies: [] }],
  deliveryZones: [],
  orders: [],
  sessions: {}
};

processCustomerMessage(dummyState, 'sess-test', { content: 'I want Silk Scarf' });
const cartItem = dummyState.sessions['sess-test']?.cart?.find(c => c.productId === 'p1');

if (cartItem && cartItem.quantity === 2) {
  console.log('❌ BUG 3 CONFIRMED (RED): Customer mentioned "Silk Scarf" once, but quantity is 2 (double-added).');
  failedTests++;
} else if (cartItem && cartItem.quantity === 1) {
  console.log('✅ BUG 3 PASSED (GREEN): Cart quantity is 1.');
} else {
  console.log('❓ Cart item not found:', cartItem);
  failedTests++;
}

// ==========================================
// Test 1: OWASP A01 Public Orders RLS Leak
// ==========================================
console.log('\n--- Test 1: schema.sql RLS Public Orders Leak ---');
const schemaContent = fs.readFileSync(path.resolve('./supabase/schema.sql'), 'utf-8');
const rlsPublicOrdersRegex = /CREATE\s+POLICY\s+"Public can view order by invoice"\s+ON\s+public\.orders\s+FOR\s+SELECT\s+TO\s+public\s+USING\s*\(\s*true\s*\);/i;

if (rlsPublicOrdersRegex.test(schemaContent)) {
  console.log('❌ BUG 1 CONFIRMED (RED): schema.sql contains "USING (true)" on public SELECT for public.orders!');
  console.log('   Any unauthenticated attacker can SELECT * from orders and scrape private customer data.');
  failedTests++;
} else {
  console.log('✅ BUG 1 PASSED (GREEN): Public SELECT policy does not have unrestricted USING (true).');
}

// ==========================================
// Test 2: Core Loop Order Disconnect
// ==========================================
console.log('\n--- Test 2: ShopChatbot.tsx insert vs App.tsx orders sync ---');
const shopChatbotContent = fs.readFileSync(path.resolve('./src/components/ShopChatbot.tsx'), 'utf-8');
const appContent = fs.readFileSync(path.resolve('./src/App.tsx'), 'utf-8');

const chatbotInsertsOwnerId = /supabase\s*\.\s*from\(\s*["']orders["']\s*\)\s*\.\s*insert\(\s*\{[\s\S]*?owner_id\s*:/m.test(shopChatbotContent);
const appSelectsOrdersTable = /supabase\s*\.\s*from\(\s*["']orders["']\s*\)\s*\.\s*select/m.test(appContent);

if (!chatbotInsertsOwnerId || !appSelectsOrdersTable) {
  console.log('❌ BUG 2 CONFIRMED (RED): Core Loop Disconnected!');
  if (!chatbotInsertsOwnerId) console.log('   - ShopChatbot inserts order WITHOUT owner_id (RLS owner policy fails).');
  if (!appSelectsOrdersTable) console.log('   - App.tsx NEVER queries supabase.from("orders"). It only reads storage JSON.');
  failedTests++;
} else {
  console.log('✅ BUG 2 PASSED (GREEN): Storefront and Dashboard order sync contract is satisfied.');
}

console.log(`\n==========================================`);
if (failedTests > 0) {
  console.log(`FAILED: ${failedTests} diagnostic test(s) failed.`);
  process.exit(1);
} else {
  console.log('ALL DIAGNOSTIC TESTS PASSED.');
  process.exit(0);
}
