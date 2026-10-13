# AI Agent Instructions for Sales Brain AI Workspace

## Project Overview

This repository contains "Sales Brain AI" — a Vite + React (TypeScript) SPA for AI-assisted Telegram commerce demos. Store data, bot simulation, and marketing insights run in the browser via `src/services/clientStore.ts` and `localStorage`. The app deploys as static files on Vercel (no Express server).

### Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Motion (animations), Lucide React (icons)
- **State:** Browser `localStorage` (`sales_brain_state_v1` key) via `clientStore.ts`
- **Bot / AI demo:** `botSimulator.ts`, `fallbackAi.ts` (rule-based insights; no live Gemini in the browser build)
- **Deploy:** Vercel static hosting (`vercel.json`)

### Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main React application |
| `src/types.ts` | TypeScript interfaces (Product, Order, Session, etc.) |
| `src/services/clientStore.ts` | State load/save, product/order mutations |
| `src/services/botSimulator.ts` | Telegram bot message simulation |
| `src/services/fallbackAi.ts` | Demo strategy & marketing insights |
| `src/data/defaultState.ts` | Default seed state |
| `src/components/*.tsx` | UI (Onboarding, SmartMarketing, TelegramSimulator, CustomChart) |

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Vite dev server (data persists in browser `localStorage`) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |

---

## Terminal Constraints (CRITICAL)

### PowerShell Environment
- **Primary shell:** Windows PowerShell
- **NO Bash syntax:** Do not use `cat << 'EOF'`, heredocs, or Unix utilities in terminal commands unless they are proven cross-platform npm scripts
- **File manipulation:** Prefer agent file I/O tools (`write`, `edit`) over shell pipes. For one-off scripts, write a local file (e.g. `script.cjs`), run `node script.cjs`, then remove it

### Unicode Protection
- **NEVER inject non-ASCII text in PowerShell commands.** Burmese (Myanmar) text in shell commands will corrupt to `?????`.
- **Always use file I/O tools** for writing or reading content with Burmese/Unicode characters.
- **Verify encoding:** Use `JSON.parse()` to verify JSON files contain correct Unicode.

### Example of Correct Approach

```powershell
# Wrong - Unicode corruption
node -e "console.log('မြန်မာ')"

# Correct - Use file tools
# Write the content to a file, then read/process it
```

---

## Localization & i18n Guardrails

### Manual Confirmations
- The user prefers to provide or confirm translated content (especially Burmese) before it is applied systematically.

### Translation Function Scope
- **NEVER call `t()` inside helper functions** declared outside React components. Doing so resolves to `undefined` and causes white screens.
- **Always pass `t` explicitly** as a function argument to utility functions.

### Key Conventions
- Use the **exact English string** as the translation key (e.g., `t("Client Customer")`)
- **No dot-notation:** Use `t("Add to Cart")` not `t("cart.add")`
- **No snake_case keys:** Use `t("Add to Cart")` not `t("add_to_cart")`

### Regex Safety
- When replacing/renaming `t()` calls, use **word boundaries** (`\bt\b`) to avoid corrupting unrelated properties like `draft.title`

---

## Architecture Patterns

### State Management
```typescript
// SystemState lives in clientStore.ts + localStorage
import { getState, mutateProducts } from "./services/clientStore";

const state = getState();
mutateProducts("add", { name: "New Item", price: 5000 });
// clientStore calls save() internally after mutations
```

- Default seed data: `src/data/defaultState.ts`
- Storage key: `sales_brain_state_v1`
- Call exported mutators in `clientStore.ts` rather than mutating state directly

### Error Handling
```typescript
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error("Operation failed:", error);
  return { success: false, error: (error as Error).message };
}
```

---

## TypeScript Guidelines

### Type Definitions
- Define all interfaces in `src/types.ts`
- NEVER use `any` type — use `unknown` with proper type guards
- Use proper union types for optional values: `string | null` not `string?`

### Example Interfaces
```typescript
interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // in MMK (Myanmar Kyat)
  description: string;
  stock: number;
  image: string;
}

interface Order {
  id: string;
  invoiceId: string;
  customerName: string;
  customerPhone: string;
  customerTelegramId: string;
  township: string;
  deliveryFee: number;
  paymentMethod: "cod" | "prepay";
  totalAmount: number;
  status: "pending" | "verifying" | "confirmed" | "completed" | "cancelled";
  items: OrderItem[];
  createdAt: string;
}
```

---

## React Best Practices

### Component Structure
- Keep components in `src/components/`
- Main application in `src/App.tsx`
- Use TypeScript for all components

### Animations
- Use **Motion** (`motion/react`) for animations
- Import: `import { motion } from "motion/react"`

### State Updates
```typescript
// Wrong - can cause stale closures
useEffect(() => {
  fetchData().then(setData);
}, []);

// Correct - include proper dependencies
useEffect(() => {
  fetchData().then(setData);
}, [/* add proper deps */]);
```

---

## AI / Marketing Demo Layer

- **Current build:** Insights and strategy copy come from `src/services/fallbackAi.ts` (deterministic, no API key required).
- **Bot replies:** `src/services/botSimulator.ts` simulates Telegram customer flows in the browser.
- If adding live Gemini later, keep API keys server-side only — never expose keys in the static Vercel bundle.

---

## Common Pitfalls to Avoid

### 1. State Not Persisting
**Problem:** Changes lost on refresh  
**Solution:** Mutate state only through `clientStore.ts` exports; they call `save()` to `localStorage`

### 2. Unicode Corruption
**Problem:** Burmese text shows as `?????`  
**Solution:** Use file tools, not shell commands, for Unicode content

### 3. Missing Type Safety
**Problem:** TypeScript errors  
**Solution:** Use interfaces from `src/types.ts`, not `any`

### 4. `t()` Outside Components
**Problem:** White screen crash  
**Solution:** Pass `t` as an argument to helpers; never call `t()` at module scope

### 5. Assuming a Backend
**Problem:** Looking for `server.ts` or Express APIs  
**Solution:** This repo is a client-only SPA; use `clientStore` and service modules instead

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Components | PascalCase | `Onboarding.tsx`, `CustomChart.tsx` |
| Services | camelCase | `clientStore.ts`, `botSimulator.ts` |
| Types | PascalCase | `types.ts` |
| Styles | Lowercase | `index.css` |

---

## Dependencies

Key packages in `package.json`:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.106.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^6.2.3"
  }
}
```

---

## Next Steps for Development

When working on this codebase:

1. **Run lint:** `npm run lint` before committing
2. **Check state:** Mutate via `clientStore.ts`; verify `localStorage` updates in devtools
3. **Verify types:** Use TypeScript interfaces from `src/types.ts`, not `any`
4. **Handle errors:** Wrap async operations in try/catch
5. **Unicode safety:** Use file tools for non-ASCII content
6. **Check architecture:** Review `architecture-design/architecture.md` for context
7. **Document lessons:** Add new issues to `lesson-learned.md`

---

*Last Updated: 2025-05-29*
*For project architecture details, see `architecture-design/architecture.md`*
*For decision history, see `decision-log/README.md`*
