# Specification: SalePilot Team (The 5-Agent Sales Council & War Room)

**Status:** ready-for-agent  
**Related ADRs:** [ADR-0001](../adr/0001-sales-team-architecture-and-coexistence.md), [ADR-0002](../adr/0002-privacy-conscious-evidence-snapshots.md), [ADR-0003](../adr/0003-cryptographic-action-approvals-and-bounded-debate.md)  
**Glossary:** [GLOSSARY.md](../../GLOSSARY.md)  
**Source Specification:** `docs/feature Request.txt`  

---

## Problem Statement

Small-and-medium enterprise (SME) social merchants in Myanmar face high operational fragmentation, thin net margins (10-25%), high courier cash-on-delivery (COD) return rates (15-30%), and missed sales opportunities caused by unmanaged customer inquiries and slow reaction times. 

While AI chatbots can automate initial conversations, merchants lack a strategic intelligence department to analyze real transaction data, protect net profitability, recover abandoned inquiries, and design safe promotional campaigns. Existing AI solutions often fabricate unrealistic forecasts, suggest unprofitable discounts that erode gross margins, or act autonomously without human oversight, leading to lost inventory and capital. Merchants need a trustworthy, evidence-based virtual sales team that respects actual unit economics, explains its reasoning with verifiable citations, operates under strict financial guardrails, and requires explicit owner approval for every external action.

---

## Solution

SalePilot Team introduces an evidence-based multi-agent Sales Council and interactive War Room integrated into SalePilot AI. Built directly on top of the merchant's real product catalog, order history, Telegram sales interactions, and delivery matrix, it orchestrates five specialized agent roles:

1. **Scout (Opportunity Hunter):** Identifies slow-moving stock, stockout hazards, repeat buyers, and sales pattern anomalies.
2. **Echo (Customer Advocate):** Categorizes customer friction, reasons for conversation abandonment, and delivery fee objections.
3. **Guardian (Profit Protector):** Enforces deterministic unit economics, calculates contribution margins, and vetoes financially unsafe promotions.
4. **Muse (Campaign Creator):** Drafts marketing copy, bundle proposals, and promotional concepts within Guardian's verified margin constraints.
5. **Commander (Strategy Lead):** Reconciles debates, scores opportunities using Impact, Confidence, and Ease (ICE), and synthesizes actionable Strategy Decision Cards for merchant review.

The solution operates with two distinct interaction models:
- **Full Council Deliberation:** A bounded 5-phase structured debate where Scout and Echo gather evidence, Guardian sets financial limits, Muse proposes campaigns, Guardian audits proposals (max 2 revisions), and Commander presents a final decision card.
- **Single-Agent Inquiries:** Direct ad-hoc queries allowing the merchant to interrogate individual specialists (e.g. asking Scout for stockout risks or Echo for common objections) with rapid, focused findings.

Every recommendation is grounded in auditable evidence snapshots, financial calculations are strictly deterministic, and external actions require cryptographic SHA-256 owner approval before execution.

---

## User Stories

### Core War Room & Workspace Navigation
1. As a shop owner, I want a dedicated Sales Team workspace accessible from the main navigation, so that I can access my virtual sales intelligence department without losing access to my existing operational tools.
2. As a shop owner, I want a Team Room overview displaying priority opportunities, pending decisions, and active agent statuses, so that I immediately know what requires my attention.
3. As a shop owner, I want a badge indicator on the Sales Team tab showing the count of pending approvals, so that I never miss actionable decisions requiring my confirmation.
4. As a shop owner, I want to view my shop's data freshness and coverage status, so that I know whether recommendations are based on recent and complete information.

### Agent Roster & Single-Agent Inquiries
5. As a shop owner, I want an interactive Agent Roster showing Scout, Muse, Guardian, Echo, and Commander, so that I understand each specialist's role and current status.
6. As a shop owner, I want to click Scout in the roster and run quick opportunity scans (e.g. slow-moving inventory, stockout risks), so that I can inspect inventory health without running a full council meeting.
7. As a shop owner, I want to click Echo in the roster and inspect customer objections, so that I can see why buyers abandon conversations in Telegram.
8. As a shop owner, I want to click Guardian in the roster and test a discount idea, so that I can verify whether a proposed price cut satisfies my required contribution margin.
9. As a shop owner, I want to click Muse in the roster to generate promotional copy for a specific product, so that I can quickly draft marketing content within safe pricing boundaries.
10. As a shop owner, I want to inspect raw Evidence records directly through an Evidence Explorer, so that I can verify the underlying metrics and transaction snapshots behind any agent claim.

### Full Council Deliberation & Debate
11. As a shop owner, I want to launch a Full Sales Council deliberation with a custom business goal and date range, so that all five agents collaboratively analyze my store and debate the best strategy.
12. As a shop owner, I want Scout and Echo to gather evidence independently in parallel, so that opportunity hunting and customer friction analysis proceed quickly without mutual bias.
13. As a shop owner, I want Guardian to compute baseline contribution margins and discount ceilings before Muse drafts campaigns, so that creative proposals are constrained by financial reality from the start.
14. As a shop owner, I want Guardian to audit Muse's campaign proposals against my shop's policies, so that no campaign with a negative or sub-threshold margin reaches my desk.
15. As a shop owner, I want Muse to be limited to at most two revision attempts when rejected by Guardian, so that the council never wastes tokens or hangs in endless loops.
16. As a shop owner, I want Commander to clearly document any unresolved disagreements between Muse and Guardian, so that I can make the final business judgment on the trade-off.
17. As a shop owner, I want Commander to synthesize a comprehensive Strategy Decision Card containing an executive summary, ICE opportunity score, supporting evidence citations, financial assumptions, and next actions, so that I can evaluate the plan in under two minutes.
18. As a shop owner, I want to see visual distinctions between observed historical facts, deterministic calculations, scenario estimates, and AI forecasts, so that I am never misled by speculative claims.

### Action Center & Cryptographic Approvals
19. As a shop owner, I want an Action Center listing all proposed external actions, so that I can review each action's target channel, recipient criteria, copy, and financial impact.
20. As a shop owner, I want to edit proposed message copy, bundle items, or discount amounts before approving an action, so that the communication matches my exact brand voice and preferences.
21. As a shop owner, I want the system to compute and persist a SHA-256 hash of the exact approved action payload upon my approval, so that the action cannot be executed if underlying prices, inventory, or parameters change.
22. As a shop owner, I want the ability to reject a proposed action with a stated reason, so that the council records my feedback in business memory and learns my preferences.
23. As a shop owner, I want stale approvals to be automatically flagged and invalidated if stock levels drop below the required quantity before execution occurs, so that I never oversell out-of-stock items.

### Financial Guardrails & Shop Policies
24. As a shop owner, I want to configure my shop's minimum contribution margin percentage (e.g., 15%), so that Guardian automatically blocks offers that do not meet my profit expectations.
25. As a shop owner, I want to configure my maximum allowable promotional discount ceiling (e.g., 20%), so that Muse cannot propose steep price reductions.
26. As a shop owner, I want Guardian to treat variable courier delivery fees and expected COD return costs as mandatory expense deductions, so that margin calculations reflect Myanmar commerce reality.
27. As a shop owner, I want Guardian to explicitly return "unknown" for contribution margin when product cost price (COGS) is missing, so that I am never falsely told an uncosted product is profitable.

### Privacy & Data Scarcity Safety
28. As a shop owner, I want customer conversation analysis to extract only anonymized friction categories (e.g. `delivery_fee_high`) rather than storing full chat transcripts in evidence tables, so that my customers' personal messages remain private.
29. As a shop owner, I want my data isolated by strict tenant security policies, so that other merchants can never read my sales metrics, customer objections, or council decisions.
30. As a newly onboarded shop owner with fewer than 5 completed orders, I want the council to state "insufficient evidence" and provide actionable data-completion tasks, so that I am not given inaccurate advice based on statistically insignificant data.

---

## Implementation Decisions

### Domain & Terminology Consistency
All data structures, UI labels, and database schemas strictly adopt the canonical terminology defined in `GLOSSARY.md`:
- Merchants operate a **Shop** with registered **Orders** placed by **Customers**.
- Investigations are conducted in a **Team Session** producing an auditable **Evidence Record** chain.
- The 5 agents are strictly named **Scout**, **Muse**, **Guardian**, **Echo**, and **Commander**.
- Deliberation modes are **Council Deliberation** and **Single-Agent Inquiry**.
- Execution candidates are stored as an **Approved Action** protected by an immutable hash.

### Architectural Shape & Coexistence (ADR-0001)
- The existing `AIStrategyDesk` component under `insights` is preserved without modification to provide quick heuristic overviews.
- A new, decoupled feature module is created under `src/features/sales-team/` housing the Team Room, Agent Roster, Sales Council debate view, Action Center, and Evidence Explorer.
- Navigation in the main application shell integrates `sales_team` as a primary sidebar destination with a badge counter indicating pending approvals.

### Server-Side Edge Function Orchestration (ADR-0001)
- All agent invocations, prompt constructions, policy validations, and database writes run within server-side Supabase Edge Functions.
- Client browsers interact with the Sales Team via authenticated REST/RPC calls; no Gemini API keys, service-role tokens, or unverified shop IDs are accepted from the client.
- Background session execution is resumable and tracked via database state transitions to avoid edge function timeout failures.

### Agent Runtime & Execution Stack
- Built with a clean, modular TypeScript runner using `@google/genai` and Zod runtime schema validation. Heavy dependencies (such as monolithic LangChain) are avoided to maintain sub-second cold starts and runtime stability in Supabase Edge Functions.
- Guardian's unit economics calculations (net revenue, gross margin, contribution margin, stockout runway) are written in deterministic TypeScript and SQL functions. The LLM is used strictly to summarize findings, never to calculate numbers.

### Privacy-Conscious Evidence Architecture (ADR-0002)
- Customer interactions from Telegram sessions are mapped to structured, categorical friction events (e.g. `delivery_fee_too_high`, `prepayment_hesitation`, `stockout_dropoff`).
- No raw personal messages, customer names, or phone numbers are stored in `team_evidence` or sent to LLM prompt contexts.

### Cryptographic Action Approvals & Bounded Debate (ADR-0003)
- When a shop owner approves an action draft, the system records `team_approvals` containing `approved_payload_hash = SHA256(canonicalJson(payload))`.
- When an execution job runs, the server reconstructs the action payload against current database state and verifies the hash matches. Any mutation in stock, pricing, or recipient criteria causes execution rejection.
- The debate loop between Muse and Guardian is enforced by a state machine counter capped at 2 revision attempts. If a proposal fails validation on attempt 2, Commander surfaces the disagreement on the Decision Card for merchant arbitration.

### Database Schema Additions
New tenant-isolated tables are created in PostgreSQL with UUID foreign keys referencing `public.shops(id)`:
- `team_sessions`: Tracks deliberation lifecycle (`queued`, `investigating`, `debating`, `awaiting_approval`, `completed`, `failed`), goal, date range, context snapshot.
- `team_agent_runs`: Audit log for each agent invocation, status, input hash, token usage, execution duration.
- `team_evidence`: Canonical snapshot of metrics, source references, coverage limitations, and observed timestamps.
- `team_proposals`: Individual strategic proposals generated by Scout and Muse with hypotheses, estimated impacts, and risk factors.
- `team_debates`: Challenge records where Guardian logs policy violations and revisions requested from Muse.
- `team_decisions`: Commander's synthesized decision cards with ICE opportunity scores, executive summaries, and permitted next actions.
- `team_approvals`: Owner approval records binding `decision_id` to `approved_payload_hash`.
- `shop_business_policies`: Configurable merchant rules for minimum contribution margin, maximum discount, and approved channels.
- `business_memory`: Long-term verified preferences, accepted/rejected proposals, and historical lessons.

All tables enforce Row-Level Security (RLS) restricting reads and writes to authenticated shop owners (`auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)`).

---

## Testing Decisions

### What Makes a Good Test
Tests must verify external behavioral contracts, domain invariants, and security boundaries—never private implementation details. A test is valuable if it proves that:
1. Valid business data yields mathematically correct margins, scores, and decisions.
2. Missing or corrupted data degrades safely (returns explicit `unknown` or `insufficient_evidence`, never fabricated numbers).
3. Financial constraints strictly block policy-violating proposals.
4. Tenant isolation prevents cross-shop data leaks.
5. Approvals correctly invalidate when underlying data mutates.

### Testing Seam
The primary testing seam is the **Sales Team Service Seam** (`salesTeamService` & `councilOrchestrator`). This seam sits directly between the API layer and the agent/analytics pipeline. Driving tests through this seam allows testing the full multi-agent deliberation loop, deterministic Guardian checks, single-agent inquiries, and approval hashing in an automated harness without requiring real browser rendering or physical Telegram delivery.

### Modules to be Tested
- **Deterministic Analytics Engine:** Revenue, contribution margin, stockout days, and opportunity score calculations.
- **Guardian Constraint Engine:** Policy validation, margin floor enforcement, and discount ceiling vetoes.
- **Council Orchestrator & State Machine:** 5-phase execution flow, Muse revision counter cap (max 2), and debate escalation.
- **Cryptographic Approval Verifier:** SHA-256 payload hashing and stale-state rejection.
- **Multi-Tenant RLS Policies:** Verification that Shop B cannot view or modify Shop A's sessions, evidence, or decisions.

### Prior Art in the Codebase
- `scripts/test-cod-stock-deduction.ts`: Demonstrates testing deterministic state mutations and inventory decrements against client store state.
- `scripts/test-live-vip-support.ts`: Demonstrates testing multi-step state machine transitions, session initialization, and handoff logic.

---

## Out of Scope

The following items are explicitly excluded from this specification:
1. **Unsupervised Autonomous Outbound Messaging:** The system will draft actions and record cryptographic approvals, but will not send real-time Telegram messages to buyers without explicit human confirmation.
2. **Third-Party Model Switching:** The council uses the designated Google Gemini model (`@google/genai`) exclusively. Multi-vendor model fallback (e.g. Anthropic, OpenAI) is out of scope.
3. **Replacing Existing Strategy Desk:** The existing `AIStrategyDesk` under the `insights` tab remains fully operational and is not removed or replaced.
4. **Automated Bank Slip OCR:** While payment verification status is considered in order analytics, OCR image parsing of physical bank slips is deferred to future milestones.

---

## Further Notes

- **Phased Implementation:** Implementation begins with Release 1 (Core Evidence-Based Council, Team Room UI, Single-Agent Inquiries) and Release 2 (Guardian Profit Guardrails & Cryptographic Approvals) before connecting live campaign execution.
- **Language Localization:** The Sales Team interface and decision cards support bilingual presentation (English and Myanmar Pyidaungsu/Padauk script) adhering to the existing `LanguageContext` patterns.
