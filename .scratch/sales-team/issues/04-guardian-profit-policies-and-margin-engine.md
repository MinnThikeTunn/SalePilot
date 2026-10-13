# 04: Guardian Profit Policies & Margin Engine

**What to build:** A merchant can configure their shop's financial policies (minimum contribution margin %, discount ceilings) and consult Guardian to audit promotional ideas. The system persists shop policies in PostgreSQL, executes deterministic unit economics calculations (deducting variable delivery costs, product COGS, and return risks), and allows merchants to test a discount idea to see exact contribution math and veto notices if a proposal breaches margin floors.

**Blocked by:** 02: Scout Inquiry & Core Evidence Schema

**Status:** ready-for-agent

- [ ] Apply database migration creating `shop_business_policies` table with defaults (15% min margin, 20% max discount) and tenant RLS
- [ ] Build editable "Shop Policies" settings drawer in the Team Room allowing merchants to adjust thresholds
- [ ] Implement Guardian's deterministic financial calculation engine (Net Revenue, Gross Margin, Contribution Margin, COD Return Risk Allowance)
- [ ] Return explicit `unknown` for margins when product `cost_price` is missing, never substituting zero
- [ ] Implement Guardian agent runner and Agent Roster UI with quick trigger ("Audit Discount Margin")
- [ ] Add automated unit tests verifying Guardian's deterministic margin formulas and policy veto logic
