# 0001. Sales Team Coexistence and Edge Function Orchestration

## Context
SalePilot AI already contains an `AIStrategyDesk` component under the Insights tab that performs basic unit economics and heuristic opportunity detection. The user requested the full 5-agent Sales Council described in `docs/feature Request.txt`, while explicitly choosing to preserve the existing Insights tab rather than replacing it. Furthermore, the merchant must be able to trigger both full 5-agent council deliberations and ad-hoc single-agent inquiries (e.g., Scout, Echo, Guardian) or evidence lookups.

## Decision
1. **Feature Coexistence**: Create a new top-level workspace for the Sales Team (`activeTab === 'sales_team'`), keeping the existing `AIStrategyDesk` (`insights`) intact as a fast analytical overview.
2. **Server-Side Edge Function Orchestration**: Run all agent prompts, Guardian margin calculations, and state machine transitions in Supabase Edge Functions backed by PostgreSQL tables (`team_sessions`, `team_agent_runs`, `team_evidence`, `team_proposals`, `team_debates`, `team_decisions`, `team_approvals`).
3. **Execution Modes**: Support two primary invocation modes:
   - **Council Deliberation**: The complete 5-agent pipeline (Scout & Echo investigate &rarr; Muse drafts &rarr; Guardian audits & vetoes &rarr; Commander synthesizes decision card).
   - **Single-Agent Inquiry**: Targeted, lightweight queries to individual agents (e.g., Scout opportunity hunt, Echo objection analysis, Guardian margin audit) returning direct structured findings.
4. **Zero-Trust Security**: No Gemini API keys or service-role secrets are exposed to client code. All shop data access is strictly bounded by Supabase Auth and RLS.

## Status
Accepted
