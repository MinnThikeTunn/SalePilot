# 07: Evidence Explorer & Low-Data Fallback

**What to build:** A merchant can inspect all verified empirical records and metric snapshots through a dedicated Evidence Explorer view, filtering by metric key, observation period, and source type. Furthermore, if a shop has fewer than 5 completed orders or missing product cost prices, the workspace detects the data deficit, displays an `insufficient_evidence` warning banner, suppresses speculative econometric projections, and presents prescriptive onboarding tasks to unlock full intelligence.

**Blocked by:** 05: Full Council Deliberation & 5-Agent Debate Loop

**Status:** done

- [x] Build Evidence Explorer UI with filters for date range, metric type, and source entity
- [x] Render data quality metrics: coverage score, calculation timestamp, formula version, and limitation notes
- [x] Implement data scarcity evaluator checking minimum transaction thresholds (at least 5 completed orders and costed products)
- [x] Display prominent `insufficient_evidence` warning banner when data scarcity is detected
- [x] Provide guided data-completion checklist (e.g. "Add cost price for top 3 items", "Log initial 5 customer transactions")
- [x] Add automated test verifying that low-volume test fixtures trigger the data scarcity fallback without crashing or hallucinating
