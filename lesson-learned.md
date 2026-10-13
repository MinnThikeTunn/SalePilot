# 🤖 Agent Guardrails & Architectural Lessons

> **Purpose:** This document serves as a critical, living reference for AI coding agents working on this codebase. It captures documented anti-patterns, proven solutions, and architectural lessons learned from past debugging sessions. By feeding this file into an agent's context window or referencing it in system prompts, you prevent the agent from repeating the same technical mistakes.
>
> **How to Use:** 
> - Before generating schema designs, database migrations, or API route logic, review this file.
> - If you encounter a new issue, document it here using the standardized format.
> - Use absolute rules and explicit patterns—agents parse structured text much better than loose narratives.

---

## 🚀 Quick Reference Rules

### Terminal & Environment
- **Rule:** Use PowerShell-compatible commands only. Avoid Bash syntax (`cat << 'EOF'`, `| grep`, etc.) in direct terminal commands.
- **Rule:** Use file I/O tools instead of complex shell pipes for writing UTF-8 content.
- **Rule:** Keep `.env` in `.gitignore`. Never commit API keys or secrets.

### TypeScript & Types
- **Rule:** Always define interfaces in `src/types.ts` for all data structures (Product, Order, Session, etc.).
- **Rule:** Never use `any` type. Use proper interfaces or `unknown` with type guards.
- **Rule:** Nullable strings must use union types: `string | null` not `string?`.

### React Component Patterns
- **Rule:** Keep component files in `src/components/`. Main app in `src/App.tsx`.
- **Rule:** Use Motion (`motion/react`) for animations, not CSS transitions for complex sequences.
- **Rule:** Always use `key` prop when mapping arrays.

### State Management
- **Rule:** Never use global mutable variables for request-specific data on the server.
- **Rule:** Use the state object pattern: `state/products`, `state/orders`, etc.
- **Rule:** Call `saveState()` after any state mutation that should persist.

### API Design
- **Rule:** All API endpoints must return proper JSON: `Response.json({ data })`.
- **Rule:** Wrap file operations in try/catch for error handling.
- **Rule:** Use proper HTTP methods: GET for reads, POST for writes.

### AI Integration
- **Rule:** Never hardcode API keys in source code. Use `process.env.GEMINI_API_KEY`.
- **Rule:** Wrap AI calls in try/catch with fallback responses.
- **Rule:** Use Type.from() for structured AI output when needed.

---

## 📋 Issue Log

| Issue # | Title | Date Added | Status |
|---------|-------|------------|--------|
| ISSUE-001 | State mutations not persisting | 2025-05-27 | `Resolved` |
| ISSUE-002 | TypeScript strict mode errors | 2025-05-27 | `Resolved` |
| ISSUE-003 | React component re-render performance | 2025-05-28 | `Active` |
| ISSUE-004 | File encoding issues with Burmese text | 2025-05-28 | `Active` |
| ISSUE-005 | Environment variable loading in production | 2025-05-28 | `Resolved` |

---

## 📝 Documented Issues

## [ISSUE-001]: State Mutations Not Persisting

* **Context:** When API endpoints modified `state`, changes were not being saved to the JSON file. The in-memory state would update but after server restart, changes were lost.
* **Anti-Pattern (DO NOT DO):** Directly modifying the `state` object without calling `saveState()`.
* **The Error Triggered:** After adding a new product via POST, the product appeared in the UI but was gone after server restart.
* **The Correct Pattern (DO THIS):** Always call `saveState()` after modifying state in API handlers.

```typescript
// ❌ Incorrect
app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  state.products.push(newProduct);
  res.json({ success: true });
});

// ✅ Correct
app.post('/api/products', (req, res) => {
  const newProduct = req.body;
  state.products.push(newProduct);
  saveState(); // Persist to disk
  res.json({ success: true });
});
```

* **Enforcement Rule:** ALWAYS call `saveState()` after any mutation to `state.products`, `state.orders`, `state.config`, or `state.sessions`.

---

## [ISSUE-002]: TypeScript Strict Mode Errors

* **Context:** New code was causing TypeScript errors when running `npm run lint`. Issues included implicit `any` and missing return types.
* **Anti-Pattern (DO NOT DO):** Using `any` type or omitting type annotations on function parameters.
* **The Error Triggered:** 
  ```
  error TS7006: Parameter 'product' implicitly has an 'any' type
  error TS7031: Binding element 'id' implicitly has an 'any' type
  ```
* **The Correct Pattern (DO THIS):** Always define interfaces in `src/types.ts` and use them consistently.

```typescript
// ❌ Incorrect
function processItem(item) {
  return item.id;
}

// ✅ Correct
interface Item {
  id: string;
  name: string;
}

function processItem(item: Item): string {
  return item.id;
}
```

* **Enforcement Rule:** 
  1. Define all data structures in `src/types.ts`
  2. Never use `any` - use `unknown` with type guards if needed
  3. Run `npm run lint` before committing

---

## [ISSUE-003]: React Component Re-render Performance

* **Context:** Large components like `Onboarding.tsx` (767 lines) were causing unnecessary re-renders, making the UI sluggish.
* **Anti-Pattern (DO NOT DO):** Creating objects or functions inside render that are used as dependencies in useEffect or useMemo.
* **The Error Triggered:** Slow typing in input fields, laggy button clicks during onboarding.
* **The Correct Pattern (DO THIS):** 
  - Use `useCallback` for event handlers passed to child components
  - Use `useMemo` for computed values that don't need to recalculate on every render
  - Extract static objects outside the component

```typescript
// ❌ Incorrect
function Dashboard() {
  const handleClick = () => { /* ... */ }; // New function every render
  
  return <ChildComponent onClick={handleClick} />;
}

// ✅ Correct
function Dashboard() {
  const handleClick = useCallback(() => { /* ... */ }, []);
  
  return <ChildComponent onClick={handleClick} />;
}
```

* **Enforcement Rule:** 
  - Run React DevTools Profiler periodically to check for unnecessary renders
  - Keep large components in separate files
  - Use React Developer Tools to profile render cycles

---

## [ISSUE-004]: File Encoding Issues with Burmese Text

* **Context:** When generating content with Burmese/Myanmar text (e.g., AI-generated product descriptions), characters were being corrupted in PowerShell commands or JSON files.
* **Anti-Pattern (DO NOT DO):** Using shell commands to generate or manipulate UTF-8 content with non-ASCII characters.
* **The Error Triggered:** 
  ```
  Input: "မြန်မာပြည်"
  Output: "??????????"
  ```
* **The Correct Pattern (DO THIS):** Use file I/O tools (read/write) instead of shell commands for any content with non-ASCII characters.

```powershell
# ❌ Incorrect - Unicode corruption in PowerShell
node -e "console.log('မြန်မာပြည်')"

# ✅ Correct - Use file tools
# Write content to file using file I/O tool
```

* **Enforcement Rule:** 
  - NEVER use PowerShell or Bash commands with Burmese text
  - Use file read/write tools for any content with non-Latin characters
  - Verify encoding in JSON files using JSON.parse()

---

## [ISSUE-005]: Environment Variable Loading in Production

* **Context:** `.env` values were working in development but failing in production builds. `process.env.VARIABLE_NAME` was undefined.
* **Anti-Pattern (DO NOT DO):** Using `import.meta.env` in backend code or not properly configuring environment for production.
* **The Error Triggered:**
  ```
  undefined process.env.GEMINI_API_KEY
  ```
* **The Correct Pattern (DO THIS):** 
  1. Ensure dotenv loads early in server.ts
  2. Use `process.env` consistently
  3. Verify .env file exists before running in production

```typescript
// server.ts - early import
import dotenv from "dotenv";
dotenv.config(); // Load before any other imports

// Later in code
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY is required");
  process.exit(1);
}
```

* **Enforcement Rule:** 
  1. Always check for required environment variables at startup
  2. Provide clear error messages when missing
  3. Document required `.env` variables in `.env.example`

---

## 🔄 Continuous Injection Loop

```
[Agent Makes Error] ──> [Debug/Fix It] ──> [Append to lesson-learned.md]
                                                       │
                                                       ▼
[Next Agent Task]   <── [Agent Reads File]   <── [Updated Rules Context]
```

---

## 🔧 How to Add New Issues

When you encounter a new bug or anti-pattern, document it with this format:

```markdown
## [ISSUE-00X]: [Descriptive Title]

* **Context:** [When does this issue occur?]
* **Anti-Pattern (DO NOT DO):** [What approach to avoid]
* **The Error Triggered:** [Actual error message or observed behavior]
* **The Correct Pattern (DO THIS):** [Code example showing right approach]
* **Enforcement Rule:** [When should this rule be applied?]
```

Then update the issue table at the top of the document.

---

## 📝 Contribution Guidelines

When adding a new lesson:

1. **Use the standardized format** (copy the ISSUE template above).
2. **Be specific** — include actual error messages and code snippets where possible.
3. **Provide enforcement rules** — make it clear when this rule applies.
4. **Use absolute language** — "MUST", "DO NOT", "ALWAYS" rather than "try to avoid".
5. **Categorize** — Add to appropriate section (Schema Validation, API Design, Database, etc.).
6. **Update the Issue Log table** at the top of this document.

---

*Last Updated: 2025-05-28*
*Maintained by: Development Team*