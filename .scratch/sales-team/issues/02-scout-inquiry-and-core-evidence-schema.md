# 02: Scout Inquiry & Core Evidence Schema

**What to build:** A merchant can click Scout in the Agent Roster and run an ad-hoc opportunity scan (e.g. detect slow-moving inventory, stockout risks, repeat buyer patterns). The system provisions the foundational database tables (`team_sessions`, `team_agent_runs`, `team_evidence`) with tenant RLS, executes the Scout runner against real database products and orders, and renders Scout's structured findings with verifiable evidence snapshot citations.

**Blocked by:** 01: Sales Team Workspace Shell & Navigation

**Status:** ready-for-agent

- [ ] Apply database migration creating `team_sessions`, `team_agent_runs`, and `team_evidence` with UUID foreign keys to `public.shops(id)` and tenant RLS
- [ ] Implement Scout agent runner service querying live inventory, sales trends, and buffer thresholds with Zod schema validation
- [ ] Render interactive Agent Roster in the Team Room header highlighting Scout
- [ ] Build single-agent inquiry drawer for Scout with preset triggers ("Hunt Stockout & Sales Risks", "Scan Slow-Moving Inventory")
- [ ] Display Scout's findings with expandable evidence citation badges linking to observed catalog snapshots
- [ ] Add automated verification test proving Scout runs and generates valid evidence records against seed data
