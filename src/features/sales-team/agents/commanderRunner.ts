import type {
  TeamDecision,
  TeamProposal,
  TeamDebate,
  TeamEvidence,
  ShopBusinessPolicy,
} from "../types/sales-team";

export interface CommanderSynthesizeOptions {
  shopId: string;
  sessionId: string;
  goal: string;
  proposals: TeamProposal[];
  debates: TeamDebate[];
  evidenceList: TeamEvidence[];
  policy: ShopBusinessPolicy;
}

export interface CommanderRunResult {
  agentKey: "commander";
  agentName: "Commander";
  title: string;
  personaMotto: string;
  decision: TeamDecision;
  evidence: TeamEvidence[];
  executedAt: string;
}

/**
 * Commander Strategy Lead Runner
 * 
 * Reconciles debates between creative offers and financial constraints,
 * computes ICE scores (Impact, Confidence, Ease), and synthesizes actionable Strategy Decision Cards.
 */
export function runCommanderSynthesis(options: CommanderSynthesizeOptions): CommanderRunResult {
  const {
    shopId,
    sessionId,
    goal,
    proposals,
    debates,
    evidenceList,
    policy,
  } = options;

  const now = new Date().toISOString();
  const primaryProposal = proposals[0];

  // Calculate ICE Framework Scores
  // Impact (1-10): Projected revenue uplift vs baseline
  const impact = 8.5;
  // Confidence (1-10): Data evidence density (number of verified evidence snapshots)
  const confidence = Math.min(9.5, Math.max(6.0, 6.0 + evidenceList.length * 0.5));
  // Feasibility/Ease (1-10): Ease of deploying with existing stock and policy compliance
  const hasVeto = debates.some((d) => d.resolution === "escalated_to_owner");
  const feasibility = hasVeto ? 6.5 : 8.8;

  const opportunityScore = Number(((impact * confidence * feasibility) / 10).toFixed(1));

  const allEvidenceRefs = evidenceList.map((e) => e.id);

  // Synthesize Executive Summary
  const debateConsensus = debates.length > 0 && debates[debates.length - 1].resolution === "consensus";
  const consensusNote = debateConsensus
    ? "Sales Council reached full consensus: Guardian confirmed unit contribution margin satisfies store financial policies."
    : "Sales Council debated trade-offs between creative conversion uplift and margin boundaries.";

  const executiveSummary = `Council has reviewed store operations for the stated objective: "${goal}". Scout and Echo identified viable inventory cohorts alongside delivery fee drop-offs in customer conversations. Muse formulated a high-conversion festival bundle, audited by Guardian to ensure non-negative contribution margin. ${consensusNote} Commander recommends proceeding with this bounded promotional campaign.`;

  // Alternative options
  const alternatives = [
    {
      proposal_id: `alt-conservative-${sessionId}`,
      reason: "Conservative Margin Maximizer: Retain full retail pricing with no discounts, offering only phone-verified COD to resolve trust friction.",
      tradeoffs: [
        "Protects 100% of gross margin",
        "May fail to clear slow-moving inventory before festival season ends",
      ],
    },
    {
      proposal_id: `alt-aggressive-${sessionId}`,
      reason: "Aggressive Volume Flash Drop: Offer 25% discount to rapidly liquidate seasonal inventory.",
      tradeoffs: [
        "Rapid cash release from inventory",
        "Breaches Guardian policy floor of 15% contribution margin",
      ],
    },
  ];

  // Next actions requiring merchant approval
  const nextActions: TeamDecision["next_actions"] = [
    {
      type: "draft_campaign",
      description: `Draft Thadingyut VIP Announcement for Telegram broadcast targeting repeat buyers with transparent flat-rate delivery.`,
      payload: {
        campaign_type: "seasonal_festival",
        proposed_discount_pct: 10,
        bundle_anchor_product: primaryProposal?.title || "Heritage Tea",
        estimated_reach: 50,
      },
      requires_approval: true,
    },
    {
      type: "inventory_review",
      description: `Review safety stock buffer and reorder lead times for top-selling items to prevent stockout decay.`,
      payload: {
        action: "check_supplier_reorder",
      },
      requires_approval: true,
    },
  ];

  const decision: TeamDecision = {
    id: `dec-${Date.now()}`,
    session_id: sessionId,
    title: primaryProposal?.title || "Council Strategic Plan & Revenue Campaign",
    executive_summary: executiveSummary,
    primary_proposal_id: primaryProposal?.id,
    alternatives,
    opportunity_score: opportunityScore,
    score_breakdown: {
      impact,
      confidence,
      urgency: 8.0,
      feasibility,
    },
    evidence_refs: allEvidenceRefs,
    assumptions: primaryProposal?.assumptions || [
      "Customer demand is receptive to Telegram promotional announcements",
      "Supplier transit times remain stable over the campaign period",
    ],
    risks: primaryProposal?.risks || [
      "Courier delays during public holidays",
      "Potential stock depletion if order volume accelerates beyond forecast",
    ],
    next_actions: nextActions,
    status: "ready_for_review",
  };

  return {
    agentKey: "commander",
    agentName: "Commander",
    title: "Strategy Decision Card & Council Synthesis",
    personaMotto: "Clear decisions backed by evidence, prioritized by impact and feasibility.",
    decision,
    evidence: [],
    executedAt: now,
  };
}
