# 03: Echo Friction Inquiry & Privacy Signals

**What to build:** A merchant can select Echo in the Agent Roster and query customer friction patterns to see why buyers drop off in Telegram conversations (e.g. delivery fee objections, payment hesitation). The system extracts structured, anonymized signals without storing raw customer transcripts or PII, persists them in `team_evidence`, and renders Echo's classified objection counts with citation cards.

**Blocked by:** 02: Scout Inquiry & Core Evidence Schema

**Status:** ready-for-agent

- [ ] Implement anonymized customer friction extractor mapping Telegram conversation steps to structured categories (`delivery_fee_too_high`, `prepayment_hesitation`, `unanswered_inquiry`)
- [ ] Enforce zero-PII guarantee: customer phone numbers, names, and raw chat messages are excluded from `team_evidence` and prompt contexts
- [ ] Implement Echo agent runner service with Zod schema validation returning classified objections, counts, and funnel drop-off rates
- [ ] Add Echo to the interactive Agent Roster with quick triggers ("Analyze Customer Objections", "Scan Incomplete Orders")
- [ ] Render Echo's findings with objection breakdown charts and verifiable evidence references
- [ ] Add automated verification test checking that friction signals are extracted correctly without PII leakage
