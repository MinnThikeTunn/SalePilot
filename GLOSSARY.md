# SalePilot AI — Domain Model

An AI-orchestrated social commerce platform and decision engine for Myanmar SMEs, combining conversational Telegram commerce with an evidence-based multi-agent Sales Council.

## Language

### Core Commerce

**Shop**:
The commercial merchant workspace owned by a registered business user.
_Avoid_: Store, tenant, merchant account

**Order**:
A customer commitment to purchase items, tracking delivery township, payment method, and verification status.
_Avoid_: Transaction, booking, checkout

**Customer**:
A buyer who interacts with the storefront or Telegram bot.
_Avoid_: Client, shopper, user

---

### Sales Council & Team Orchestration

**Sales Council**:
A coordinated multi-agent deliberation session that investigates store data, debates proposals, and produces verified decisions.
_Avoid_: Committee, chat group, AI brainstorm

**Team Session**:
A discrete, state-persisted investigation cycle with a defined business goal, date range, and audit trail.
_Avoid_: Conversation, chat thread, run

**Scout**:
The opportunity hunter agent responsible for finding inventory risks, sales patterns, abandoned inquiries, and repeat buyers.
_Avoid_: Researcher, trend finder

**Muse**:
The campaign creator agent responsible for drafting marketing proposals, bundles, copy, and promotional concepts within verified policy limits.
_Avoid_: Creative bot, marketer, copywriter

**Guardian**:
The profit protector agent responsible for deterministic unit economics, contribution margins, and vetoing unprofitable offers.
_Avoid_: Accountant, financial advisor

**Shop Policy**:
An owner-configured set of financial and operational constraints (e.g. minimum contribution margin, discount ceilings) enforced deterministically by Guardian.
_Avoid_: Store rule, settings, guideline


**Echo**:
The customer advocate agent responsible for classifying customer objections, friction points, and conversation abandonment.
_Avoid_: Support bot, listener

**Commander**:
The strategy lead agent responsible for resolving debates, scoring opportunities by ICE, and synthesizing the final decision card for owner approval.
_Avoid_: Boss bot, manager

---

### Evidence & Actions

**Evidence Record**:
An auditable snapshot of observed metrics, source records, and coverage limitations used to substantiate agent claims.
_Avoid_: AI fact, citation, data point

**Evidence Explorer**:
A dedicated interactive view for inspecting verified metrics and source record snapshots across time windows.
_Avoid_: Data viewer, log browser

**Approved Action**:
An immutable, cryptographically hashed action draft approved by the shop owner for idempotent execution.
_Avoid_: Bot action, automated trigger

**Council Deliberation**:
The end-to-end multi-agent orchestration loop where all five agents investigate, draft, debate, simulate, and synthesize a strategy.
_Avoid_: Full run, council meeting

**Single-Agent Inquiry**:
A targeted request directed to a specific agent (e.g., Scout, Echo, Guardian) returning bounded findings without running a full five-agent debate.
_Avoid_: Subagent prompt, direct message


