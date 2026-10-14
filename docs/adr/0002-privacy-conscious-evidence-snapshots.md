# 0002. Privacy-Conscious Evidence Snapshots

## Context
The Sales Council requires empirical evidence from customer chat interactions and order abandonment (used by Scout and Echo) to substantiate recommendations. Storing full unredacted customer transcripts in PostgreSQL tables and passing them into LLM prompt contexts creates privacy and security liabilities (OWASP data exposure) and inflates token costs.

## Decision
1. **Anonymized Signal Extraction**: Extract only structured, categorical friction events (e.g. `objection_category: 'delivery_rate_too_high'`, `funnel_step: 'selecting_township'`, `timestamp`, `product_id`) into `team_evidence`.
2. **No Raw PII in Prompts**: Never transmit unredacted customer names, phone numbers, or complete chat transcripts to Gemini prompts or persistent evidence tables.
3. **Traceability**: Link evidence snapshots back to authorized source IDs (`source_type: 'inquiry'`, `source_id`) without duplicating personal communication content.

## Status
Accepted
