# 0003. Cryptographic Action Approvals and Bounded Debate

## Context
In a multi-agent sales council, autonomous external execution (e.g. sending discount messages or altering live pricing) without human oversight introduces legal, financial, and customer relationship risks. Furthermore, iterative debate loops between creative agents (Muse) and risk protectors (Guardian) can suffer from infinite token loops or non-terminating disputes.

## Decision
1. **Cryptographic Action Invalidation**: Every owner approval must compute and persist a SHA-256 hash of the exact approved action payload (`approved_payload_hash`). Prior to execution, the payload is re-verified; any mutation in product pricing, stock levels, or recipient eligibility immediately invalidates the approval.
2. **Bounded Revision Cap**: The debate loop between Muse and Guardian is strictly capped at a maximum of two revision cycles. If Guardian continues to veto a proposal after two attempts, Commander escalates the dispute directly to the shop owner on the Decision Card with documented rationale.
3. **Graceful Data Scarcity Degradation**: If a shop possesses fewer than 5 completed orders or lacks product cost prices, the engine flags data quality as `insufficient_evidence`, suppresses speculative econometric forecasting, and presents prescriptive onboarding tasks.

## Status
Accepted
