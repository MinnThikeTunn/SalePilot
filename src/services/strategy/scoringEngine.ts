import type {
  SalesOpportunity,
  ScoreBreakdown,
  LifecycleStatus,
} from "../../types";
import type { OpportunityCandidate } from "./types";

/**
 * Deterministic scoring and ranking engine.
 * Adheres strictly to Section FR-04 of docs/AI_Strategy_Feature.md.
 * 
 * Formula:
 * priorityScore = (impact * 0.35) + (evidence * 0.25) + (urgency * 0.20) + (actionability * 0.20)
 */
export function scoreAndRankOpportunities(
  candidates: OpportunityCandidate[],
  existingOpportunities: SalesOpportunity[] = [],
  shopId: string,
  ownerId: string,
  runId?: string
): SalesOpportunity[] {
  const existingMap = new Map<string, SalesOpportunity>();
  existingOpportunities.forEach((opp) => {
    existingMap.set(opp.opportunity_key, opp);
  });

  const scoredList: SalesOpportunity[] = candidates.map((c) => {
    // 1. Calculate weighted priority score
    const impact = Math.min(100, Math.max(0, c.impactScore));
    const evidence = Math.min(100, Math.max(0, c.evidenceScore));
    const urgency = Math.min(100, Math.max(0, c.urgencyScore));
    const actionability = Math.min(100, Math.max(0, c.actionabilityScore));

    const rawScore =
      impact * 0.35 +
      evidence * 0.25 +
      urgency * 0.20 +
      actionability * 0.20;

    const priorityScore = Number(rawScore.toFixed(1));

    const scoreBreakdown: ScoreBreakdown = {
      impact,
      evidence,
      urgency,
      actionability,
    };

    // 2. Preserve previous owner decision if opportunity existed
    const existing = existingMap.get(c.key);
    let status: LifecycleStatus = "open";
    let dismissedReason: string | undefined = undefined;
    let existingId: string | undefined = undefined;

    if (existing) {
      existingId = existing.id;
      // Preserve active state or dismissal
      status = existing.status;
      dismissedReason = existing.dismissed_reason;
    }

    const oppId = existingId || `opp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    return {
      id: oppId,
      shop_id: shopId,
      owner_id: ownerId,
      run_id: runId,
      opportunity_key: c.key,
      opportunity_type: c.type,
      title: c.title,
      problem_description: c.problemDescription,
      priority_score: priorityScore,
      score_breakdown: scoreBreakdown,
      evidence_confidence: c.confidence,
      evidence_snapshot: {
        metrics: c.evidenceSnapshot.metrics,
        analysis_period: c.evidenceSnapshot.analysisPeriod,
        comparison_period: c.evidenceSnapshot.comparisonPeriod,
        comparison_values: c.evidenceSnapshot.comparisonValues,
        source_records: c.evidenceSnapshot.sourceRecords,
        warnings: c.warnings,
      },
      expected_impact: {
        revenue_at_risk_mmk: c.expectedImpact.revenueAtRiskMmk,
        potential_gain_mmk: c.expectedImpact.potentialGainMmk,
        units_impacted: c.expectedImpact.unitsImpacted,
        assumptions: c.expectedImpact.assumptions,
      },
      recommended_action: {
        action_type: c.recommendedAction.actionType,
        title: c.recommendedAction.title,
        description: c.recommendedAction.description,
        requires_approval: c.recommendedAction.requiresApproval,
        suggested_params: c.recommendedAction.suggestedParams,
      },
      data_quality_warnings: c.warnings,
      ai_explanation: {
        why_it_matters: c.templateExplanation.whyItMatters,
        action_rationale: c.templateExplanation.actionRationale,
        expected_outcome: c.templateExplanation.expectedOutcome,
        limitations: c.templateExplanation.limitations,
        generated_by: "template_fallback",
      },
      status,
      dismissed_reason: dismissedReason,
      detected_at: existing?.detected_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  // Sort descending by priority score
  return scoredList.sort((a, b) => b.priority_score - a.priority_score);
}
