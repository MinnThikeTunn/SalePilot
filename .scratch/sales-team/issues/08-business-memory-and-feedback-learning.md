# 08: Business Memory & Feedback Learning

**What to build:** A merchant can manage verified shop lessons, confirmed tone preferences, and past decision outcomes in a Business Memory screen. The system persists approved actions, rejected strategies (with merchant reasons), and confirmed policies in PostgreSQL, and injects relevant past memories into subsequent Council deliberations to prevent repeating rejected strategies and adapt to the owner's voice.

**Blocked by:** 06: Action Center & Cryptographic Approvals (SHA-256), 07: Evidence Explorer & Low-Data Fallback

**Status:** done

- [x] Apply database migration creating `business_memory` table with source references, verification status, expiry, and tenant RLS
- [x] Automatically store rejected proposal reasons and approved strategy outcomes as memory entries
- [x] Build Business Memory management screen allowing merchants to view, edit, and delete stored rules and lessons
- [x] Implement relevance-based memory retriever in the Council orchestrator to provide historical context to Muse and Commander
- [x] Enforce guardrail: unverified AI conclusions are strictly prevented from automatically promoting to permanent memory
- [x] Add automated test verifying that a rejected discount proposal is stored in memory and suppressed in subsequent council runs
