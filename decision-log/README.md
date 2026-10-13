# 🤖 Architectural Decision Record (ADR) - Index

> **Purpose:** This directory serves as a centralized log for all architectural and technical decisions made throughout the project. Each decision is tracked in its own file with context, alternatives considered, and consequences.
>
> **Why Keep It Here:** Maintaining the decision log inside the codebase (via Git) ensures it evolves alongside your code. It becomes a historical record that new developers and AI agents can reference to understand *why* certain design choices were made.

---

## Workflow

### 1. Propose & Draft
When a major design shift or technical challenge arises, create a new `DEC-00X.md` file using the template below. Set status to `Proposed`.

### 2. Discuss & Refine
Submit the decision in the same Pull Request (PR) as your proposed architecture changes. Use PR comments to discuss alternatives.

### 3. Accept & Merge
Once approved, change status to `Accepted` and merge the PR. The decision becomes a permanent historical marker.

### 4. Sync System Instructions
If the decision introduces a strict constraint, copy the relevant instruction into your `.cursorrules`, `CLAUDE.md`, or linting configurations.

---

## Quick-View Index

| ID | Date | Decision Summary | Status | Rule Synced |
| --- | --- | --- | --- | --- |
| **DEC-001** | 2025-05-27 | Monolithic Express + Vite architecture | `Superseded by DEC-007` | No |
| **DEC-002** | 2025-05-27 | File-based JSON state persistence | `Superseded by DEC-006` | No |
| **DEC-003** | 2025-05-27 | Gemini 2.0 Flash for AI responses | `Accepted` | No |
| **DEC-004** | 2025-05-28 | React 19 with TypeScript | `Accepted` | No |
| **DEC-005** | 2025-05-28 | Motion library for animations | `Accepted` | No |
| **DEC-006** | 2026-05-29 | Supabase Auth + Storage + Edge Functions | `Accepted` | No |
| **DEC-007** | 2026-05-29 | Remove Express Monolith | `Accepted` | No |

---

## Decision Files

- [DEC-001](./DEC-001.md) - Monolithic Express + Vite architecture (Superseded)
- [DEC-002](./DEC-002.md) - File-based JSON state persistence (Superseded)
- [DEC-003](./DEC-003.md) - Gemini 2.0 Flash for AI responses
- [DEC-004](./DEC-004.md) - React 19 with TypeScript
- [DEC-005](./DEC-005.md) - Motion library for animations
- [DEC-006](./DEC-006.md) - Supabase Auth + Storage + Edge Functions
- [DEC-007](./DEC-007.md) - Remove Express Monolith

---

## Decision Template

Copy this template for each new decision (`DEC-00X.md`):

```markdown
# [DEC-00X]: [Decision Title]

**Date:** YYYY-MM-DD  
**Status:** `Proposed` | `Accepted` | `Superseded by DEC-00X`  
**Author:** [Name/Team]  
**PR Reference:** [Link to PR]

## Context
[Describe the situation or problem that prompted this decision.]

## Decision
[State clearly what was decided.]

## Alternatives Considered
- **Option A:** [Description] — [Why rejected]
- **Option B:** [Description] — [Why rejected]
- **Option C:** [Description] — [Why rejected]

## Consequences
- **Positive:** [Expected benefits]
- **Negative:** [Potential drawbacks or trade-offs]

## Rule Sync (if applicable)
[If this decision introduces a strict constraint, note what system instructions should be updated.]
```

---

## Golden Rules of Maintenance

1. **Never delete** an accepted decision file if requirements change later.
2. **Always create a new decision** to document changes, and update the old decision's status to `Superseded by DEC-00X`.
3. **Keep it low-friction** — write decisions when changes happen, not after.
4. **Make it high-utility** — include concrete examples, error messages, and code references.

---

*Last Updated: 2026-05-29*  
*Maintained by: Development Team*