---
name: engineering-guardrails
description: |
  Enforces engineering guardrails for hackathon MVPs. Use this skill whenever an AI agent proposes architecture, dependencies, or deployment changes for this project. This skill ensures proposals follow MVP-first principles: prioritize speed and demonstrability over long-term scalability, keep dependencies minimal, and avoid overengineering. Make sure to apply these guardrails to any suggestion involving new libraries, infrastructure, or architectural changes.
---

# Engineering Guardrails

This skill enforces engineering guardrails for hackathon MVPs. Use this whenever AI agents propose architecture, dependencies, or deployment changes.

## Principles

- **This is a hackathon MVP:** Prioritize speed and demonstrability over long-term scalability.
- **Simplicity > Scalability:** Avoid adding complexity unless absolutely required for the demo.
- **Prefer single-process services:** Keep services that can be demoed locally without complex setup.
- **Prioritize readability and maintainability** over micro-optimizations.

## Hard Constraints

**Do NOT propose these without explicit user request:**
- ❌ Microservices or splitting into multiple backend services
- ❌ Redis, Kafka, RabbitMQ, or other message brokers by default
- ❌ Kubernetes, Helm charts, or cluster orchestration
- ❌ Heavy infrastructure (multi-region, autoscaling groups) for hackathon plans

## Soft Constraints

**Prefer these patterns:**
- ✅ Keep dependencies minimal and well-known
- ✅ Use `python -m uvicorn main:app --reload` for local runs (avoids shell PATH issues)
- ✅ Prefer async-first libraries and patterns (async/await, httpx)
- ✅ Keep configuration in `.env` or environment variables
- ✅ Never check secrets into git

## Quality Checks

Before suggesting any change, verify:

1. **Is the change required to demonstrate the core concept?** If not, reject or propose a smaller change.
2. **Does the change increase demo complexity?** If yes (more setup steps), prefer an alternative that keeps demo time under 5 minutes.
3. **Are additional dependencies justified?** If adding a dependency, include:
   - One-line rationale
   - Quick install/run snippet
4. **Are commands shell-friendly?** Copyable for both Windows (PowerShell) and Git Bash.

## How to Evaluate Proposals

When reviewing a proposed change:

1. **Check against Hard Constraints** — Flag any that are violated without user request
2. **Check Soft Constraints** — Verify the proposal follows preferred patterns
3. **Apply Quality Checks** — Ensure demo-friendliness and minimal complexity
4. **Provide feedback** — Either approve or suggest modifications

## Example Responses

### ✅ Approved Example
```
Proposal: Add python-dotenv for environment variable management

Justification: Following guardrails - minimal dependency (single file) for .env loading makes config easy without adding complexity.

Commands:
pip install python-dotenv
# Then load in code:
from dotenv import load_dotenv
load_dotenv()

Status: APPROVED ✓
```

### ❌ Rejected Example
```
Proposal: Add Redis for caching session data

Justification: Not required for MVP demo, adds infrastructure complexity.

Guardrails Violated: Hard constraint - avoid Redis by default for hackathon MVP

Status: REJECTED - Propose alternative (e.g., in-memory dict) or provide explicit user request
```

### ⚠️ Needs Clarification Example
```
Proposal: Split backend into microservices for better scaling

Justification: This introduces unnecessary complexity for a hackathon MVP.

Guardrails Violated: Hard constraint - avoid microservices

Status: REJECTED - If you want microservices, please explicitly request this and explain the demo requirements.
```

## Completion Criteria

For any approved proposal, ensure it includes:
- One-line justification referencing these guardrails
- Exact commands to run locally (copyable)
- List of new dependencies with install command
- Avoided disallowed infrastructure (unless explicitly requested)

---

*This skill helps keep the project focused on the hackathon MVP goals and prevents overengineering.*