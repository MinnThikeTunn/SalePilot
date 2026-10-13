# 06: Action Center & Cryptographic Approvals (SHA-256)

**What to build:** A merchant can review all proposed actions resulting from a council decision in an Action Center screen, edit action parameters (copy, discount, products), reject proposals with stated reasons, or approve them. Upon approval, the server records an immutable approval with a cryptographic SHA-256 hash of the canonical payload. If product pricing, stock availability, or recipient parameters change before execution, the approval is automatically flagged and invalidated.

**Blocked by:** 05: Full Council Deliberation & 5-Agent Debate Loop

**Status:** ready-for-agent

- [ ] Apply database migration creating `team_approvals` table storing `decision_id`, `approved_by`, `approved_payload_hash`, and status
- [ ] Build Action Center UI listing proposed actions with channel, target audience, exact copy, product availability, and expected outcome
- [ ] Allow merchant to edit action details, reject with feedback reason, or trigger 1-click approval
- [ ] Implement server-side canonical JSON SHA-256 payload hashing and validation on approval
- [ ] Implement pre-execution guard: if underlying catalog price or stock mutates, invalidate the approval and require re-confirmation
- [ ] Add automated test verifying that payload hashing works and that modifying product stock invalidates the approval
