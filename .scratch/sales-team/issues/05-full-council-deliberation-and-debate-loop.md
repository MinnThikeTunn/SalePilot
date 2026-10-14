# 05: Full Council Deliberation & 5-Agent Debate Loop

**What to build:** A merchant can click "Convene Full Sales Council" to run a complete multi-agent debate across Scout, Echo, Guardian, Muse, and Commander. The orchestrator executes a sequential 5-phase state machine: Scout and Echo extract evidence, Guardian sets financial limits, Muse drafts campaigns citing verified products/prices, Guardian audits the proposals against margin floors (max 2 revisions), and Commander resolves trade-offs, computes ICE scores, and presents an interactive Strategy Decision Card.

**Blocked by:** 03: Echo Friction Inquiry & Privacy Signals, 04: Guardian Profit Policies & Margin Engine

**Status:** done

- [x] Apply database migration creating `team_proposals`, `team_debates`, and `team_decisions` tables with tenant RLS
- [x] Implement Muse agent runner drafting marketing copy, bundles, and campaigns bounded by verified catalog stock and Guardian limits
- [x] Implement Commander agent runner calculating ICE scores (Impact, Confidence, Ease), synthesizing executive summaries, and formulating next actions
- [x] Implement the 5-phase sequential state machine orchestrator with a strict cap of 2 revisions between Muse and Guardian
- [x] Render the Sales Council debate UI showing real-time agent progression, structured challenge records, and expandable citations
- [x] Render the synthesized Strategy Decision Card with executive summary, ICE breakdown, alternatives, and action drafts
- [x] Add automated integration test driving the complete 5-agent deliberation loop through to decision synthesis
