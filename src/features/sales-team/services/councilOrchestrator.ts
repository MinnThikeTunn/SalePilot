import type {
  TeamSession,
  TeamAgentRun,
  TeamProposal,
  TeamDebate,
  TeamDecision,
  TeamEvidence,
} from "../types/sales-team";
import { getShopBusinessPolicies } from "./salesTeamApi";
import { runScoutInquiry } from "../agents/scoutRunner";
import { runEchoInquiry } from "../agents/echoRunner";
import { runGuardianAudit, calculateProductEconomics } from "../agents/guardianRunner";
import { runMuseProposals } from "../agents/museRunner";
import { runCommanderSynthesis } from "../agents/commanderRunner";
import { toolRegistry } from "../tools/toolRegistry";

export interface CouncilDeliberationOptions {
  shopId: string;
  goal: string;
  userId?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

export interface CouncilDeliberationResult {
  session: TeamSession;
  status: "completed" | "failed";
  agentRuns: TeamAgentRun[];
  proposals: TeamProposal[];
  debates: TeamDebate[];
  decision: TeamDecision;
  evidence: TeamEvidence[];
  executedAt: string;
}

/**
 * 5-Agent Sales Council Orchestrator
 * 
 * Sequentially choreographs the deliberation loop:
 * Phase 1: Investigation (Scout + Echo parallel empirical evidence gathering)
 * Phase 2: Policy (Guardian financial boundaries)
 * Phase 3: Creative Formulation (Muse bounded campaigns)
 * Phase 4: Debate & Audit (Guardian challenges with max 2 revision rounds per ADR-0003)
 * Phase 5: Synthesis (Commander ICE scoring & Strategy Decision Card)
 */
export function runCouncilDeliberation(
  options: CouncilDeliberationOptions
): CouncilDeliberationResult {
  const { shopId, goal, userId = "system_owner" } = options;
  const now = new Date().toISOString();
  const sessionId = `sess-council-${Date.now()}`;

  const session: TeamSession = {
    id: sessionId,
    shop_id: shopId,
    created_by: userId,
    goal,
    status: "investigating",
    date_range_start: options.dateRangeStart,
    date_range_end: options.dateRangeEnd,
    context_snapshot: {},
    created_at: now,
  };

  const agentRuns: TeamAgentRun[] = [];
  const allEvidence: TeamEvidence[] = [];
  const proposals: TeamProposal[] = [];
  const debates: TeamDebate[] = [];

  const addAgentRun = (
    agentKey: "scout" | "echo" | "guardian" | "muse" | "commander",
    status: "completed" | "failed",
    outputJson: Record<string, any>
  ) => {
    agentRuns.push({
      id: `run-${agentKey}-${Date.now()}`,
      session_id: sessionId,
      shop_id: shopId,
      agent_key: agentKey,
      status,
      output_json: outputJson,
      started_at: now,
      completed_at: new Date().toISOString(),
      created_at: now,
    });
  };

  // =========================================================================
  // Phase 1: Empirical Data Gathering (Scout & Echo)
  // =========================================================================
  const scoutResult = runScoutInquiry({ shopId, trigger: "general" });
  addAgentRun("scout", "completed", { opportunitiesCount: scoutResult.opportunities.length });
  allEvidence.push(...scoutResult.evidence);

  const echoResult = runEchoInquiry({ shopId, trigger: "analyze_customer_objections" });
  addAgentRun("echo", "completed", {
    objectionsCount: echoResult.objections.length,
    conversionRate: echoResult.funnelAnalysis.conversionRatePct,
  });
  allEvidence.push(...echoResult.evidence);

  // =========================================================================
  // Phase 2: Financial Policy Guardrails (Guardian)
  // =========================================================================
  const policy = getShopBusinessPolicies(shopId);
  const guardianAudit = runGuardianAudit({ shopId });
  addAgentRun("guardian", "completed", {
    vetoCount: guardianAudit.vetoCount,
    minMarginPct: policy.min_contribution_margin_pct,
  });
  allEvidence.push(...guardianAudit.evidence);

  // =========================================================================
  // Phase 3 & 4: Creative Formulation & Bounded Debate Loop (Muse & Guardian)
  // Strict ADR-0003 cap: maximum 2 revision cycles
  // =========================================================================
  let revisionAttempt = 1;
  let debateResolved = false;
  let activeProposal: TeamProposal | null = null;

  while (revisionAttempt <= 2 && !debateResolved) {
    const museResult = runMuseProposals({
      shopId,
      sessionId,
      scoutEvidenceRefs: scoutResult.evidence.map((e) => e.id),
      echoEvidenceRefs: echoResult.evidence.map((e) => e.id),
      policy,
      revisionRound: revisionAttempt - 1,
      guardianFeedback:
        revisionAttempt > 1
          ? `Guardian vetoed attempt #${revisionAttempt - 1} due to margin threshold.`
          : undefined,
      goal,
    });

    activeProposal = museResult.proposals[0];
    proposals.push(activeProposal);
    allEvidence.push(...museResult.evidence);

    if (revisionAttempt === 1) {
      addAgentRun("muse", "completed", { proposalTitle: activeProposal.title });
    }

    // Guardian audits active proposal
    const catalogData = toolRegistry.executeTool("get_product_catalog", { shopId });
    const anchorProduct = (catalogData.products || [])[0];

    const proposalEco = calculateProductEconomics({
      price: anchorProduct ? Number(anchorProduct.price) : 25000,
      costPrice: anchorProduct?.cost_price ?? 12000,
      discountPct: revisionAttempt === 1 ? 15 : 8,
      deliveryFee: 2500,
      policy,
    });

    if (proposalEco.status === "approved") {
      debateResolved = true;
      activeProposal.status = "accepted";
      debates.push({
        id: `deb-${Date.now()}-${revisionAttempt}`,
        session_id: sessionId,
        shop_id: shopId,
        proposal_id: activeProposal.id,
        challenger: "guardian",
        objection_code: "margin_audit_passed",
        evidence_refs: proposalEco.costMissing ? [] : guardianAudit.evidence.map((e) => e.id),
        notes: `Guardian verified: Contribution margin of ${proposalEco.contributionMarginPct}% satisfies the ${policy.min_contribution_margin_pct}% policy floor.`,
        revision_attempt: revisionAttempt,
        resolution: "consensus",
        created_at: now,
      });
    } else {
      // Veto recorded
      debates.push({
        id: `deb-${Date.now()}-${revisionAttempt}`,
        session_id: sessionId,
        shop_id: shopId,
        proposal_id: activeProposal.id,
        challenger: "guardian",
        objection_code: "margin_floor_breached",
        evidence_refs: guardianAudit.evidence.map((e) => e.id),
        notes: `Guardian veto: ${proposalEco.vetoReason}`,
        revision_attempt: revisionAttempt,
        resolution: revisionAttempt >= 2 ? "escalated_to_owner" : "revised",
        created_at: now,
      });
      revisionAttempt++;
    }
  }

  // =========================================================================
  // Phase 5: Synthesis & Decision Card Formulation (Commander)
  // =========================================================================
  const commanderResult = runCommanderSynthesis({
    shopId,
    sessionId,
    goal,
    proposals,
    debates,
    evidenceList: allEvidence,
    policy,
  });
  addAgentRun("commander", "completed", {
    decisionTitle: commanderResult.decision.title,
    opportunityScore: commanderResult.decision.opportunity_score,
  });

  session.status = "completed";
  session.context_snapshot = {
    totalEvidenceCount: allEvidence.length,
    debatesCount: debates.length,
    proposalsCount: proposals.length,
    opportunityScore: commanderResult.decision.opportunity_score,
  };

  return {
    session,
    status: "completed",
    agentRuns,
    proposals,
    debates,
    decision: commanderResult.decision,
    evidence: allEvidence,
    executedAt: now,
  };
}
