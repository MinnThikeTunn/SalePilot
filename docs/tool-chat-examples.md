# ToolChat Integration Examples

Quick integration patterns for adding the tool-based Gemini chat to your app.

---

## Option 1: Add as a New Route (Recommended for Testing)

```tsx
import { ToolChatDemo } from "./pages/ToolChatDemo";

// In your router configuration:
<Routes>
  {/* ... existing routes ... */}
  <Route path="/ai-chat" element={<ToolChatDemo />} />
</Routes>

// Add navigation link:
<nav>
  <Link to="/ai-chat">AI Assistant</Link>
</nav>
```

---

## Option 2: Add as Floating Global Widget

```tsx
import { ToolChat } from "./components/ToolChat";

function App() {
  return (
    <>
      <YourExistingComponents />
      {/* Floating chat widget - appears across pages */}
      <ToolChat />
    </>
  );
}
```

---

## Option 3: Replace ShopChatbot in PublicShop Page

```tsx
// Before:
import { ShopChatbot } from "./components/ShopChatbot";

<ShopChatbot
  shopId={shopId}
  businessName={shopData.config.shopName}
  products={shopData.products}
  suggestedPrompts={["What products do you sell?", "Tell me about delivery"]}
/>

// After:
import { ToolChat } from "./components/ToolChat";

<ToolChat fullPage />
```

---

## Option 4: Add to Dashboard as Admin Tool

```tsx
import { useState } from "react";
import { ToolChat } from "./components/ToolChat";

function Dashboard() {
  const [showAI, setShowAI] = useState(false);

  return (
    <div>
      <button onClick={() => setShowAI(!showAI)}>
        {showAI ? "Hide" : "Show"} AI Assistant
      </button>

      {showAI && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="mx-auto mt-8 h-[calc(100vh-4rem)] max-w-4xl">
            <ToolChat fullPage />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Option 5: Contextual Rendering

```tsx
import { ShopChatbot } from "./components/ShopChatbot";
import { ToolChat } from "./components/ToolChat";

function PublicShop({ shopId, isAdmin }: Props) {
  return (
    <>
      {isAdmin ? (
        // Admin sees tool-based chat with access to full data
        <ToolChat fullPage />
      ) : (
        // Customers see shop-specific conversational sales chatbot
        <ShopChatbot
          shopId={shopId}
          businessName={shopData.config.shopName}
          products={shopData.products}
        />
      )}
    </>
  );
}
```

---

## Key Differences

| Feature | ShopChatbot | ToolChat |
|---|---|---|
| **Audience** | Customer-facing shoppers | Admin / Merchant store owner |
| **Context** | Single shop context & order placement | Multi-shop queries via Supabase tools |
| **State Machine** | Burmese/English conversational cart flow | Dynamic function-calling via Gemini API |
| **Primary Placement** | Storefront & Telegram Simulator | Merchant dashboard & admin analytics |
