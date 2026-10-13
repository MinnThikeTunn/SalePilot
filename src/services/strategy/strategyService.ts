import { supabase } from "../../utils/supabase";
import type {
  Product,
  Order,
  SalesOpportunity,
  AnalyticsRun,
  OpportunityOutcome,
  LifecycleStatus,
} from "../../types";
import { calculateBusinessMetrics } from "./metricsEngine";
import { validateDataQuality } from "./dataQualityValidator";
import { detectOpportunities } from "./opportunityDetectors";
import { scoreAndRankOpportunities } from "./scoringEngine";
import { enrichOpportunitiesWithAi } from "./explanationService";
import type { StrategyDeskResult } from "./types";

/**
 * Strategy Service Coordinator.
 * Manages analytics runs, opportunity ranking, lifecycle persistence, and outcome tracking.
 */
export async function runStrategyAnalysis(
  shopId: string,
  ownerId: string,
  products: Product[],
  orders: Order[],
  sessionsCount: number = 0,
  geminiApiKey?: string
): Promise<StrategyDeskResult> {
  // 1. Calculate deterministic metrics
  const metrics = calculateBusinessMetrics(orders, products, 7);

  // 2. Validate data health & completeness
  const dataQuality = validateDataQuality(orders, products, metrics, sessionsCount);

  // 3. Fetch existing opportunities to preserve owner decisions
  let existingOpportunities: SalesOpportunity[] = [];
  try {
    const { data } = await supabase
      .from("sales_opportunities")
      .select("*")
      .eq("shop_id", shopId)
      .eq("owner_id", ownerId);
    if (data) {
      existingOpportunities = data as SalesOpportunity[];
    }
  } catch (err) {
    console.warn("Could not query existing opportunities from Supabase:", err);
  }

  // 4. Run rule-based opportunity detectors
  const candidates = detectOpportunities(metrics, products, orders, dataQuality, sessionsCount);

  // 5. Create analytics run record
  const runId = crypto.randomUUID();
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 7);
  const prevStart = new Date(windowStart);
  prevStart.setDate(prevStart.getDate() - 7);

  const runRecord: AnalyticsRun = {
    id: runId,
    shop_id: shopId,
    owner_id: ownerId,
    analysis_window_start: windowStart.toISOString(),
    analysis_window_end: now.toISOString(),
    comparison_window_start: prevStart.toISOString(),
    comparison_window_end: windowStart.toISOString(),
    timezone: "Asia/Yangon",
    currency: "MMK",
    data_quality_status: dataQuality.status,
    data_quality_summary: {
      completeness_score: dataQuality.completenessScore,
      missing_data: dataQuality.missingData,
      warnings: dataQuality.warnings,
      freshness_timestamp: dataQuality.freshnessTimestamp,
    },
    metrics_summary: {
      current_period: {
        revenue: metrics.current.revenue,
        completed_orders: metrics.current.completedOrders,
        aov: metrics.current.aov,
        cancellation_rate: metrics.current.cancellationRate,
        total_units_sold: metrics.current.totalUnitsSold,
      },
      comparison_period: {
        revenue: metrics.previous.revenue,
        completed_orders: metrics.previous.completedOrders,
        aov: metrics.previous.aov,
        cancellation_rate: metrics.previous.cancellationRate,
        total_units_sold: metrics.previous.totalUnitsSold,
      },
      changes: {
        revenue_pct: metrics.changes.revenuePct,
        orders_pct: metrics.changes.ordersPct,
        aov_pct: metrics.changes.aovPct,
        cancellation_rate_pct: metrics.changes.cancellationRatePct,
      },
    },
    metric_version: "v1.0",
    scoring_version: "v1.0",
    status: dataQuality.status === "insufficient" ? "limited" : "completed",
    source_watermark: now.toISOString(),
    created_at: now.toISOString(),
  };

  // 6. Score and rank opportunities
  let rankedOpportunities = scoreAndRankOpportunities(
    candidates,
    existingOpportunities,
    shopId,
    ownerId,
    runId
  );

  // 7. Enrich explanations with Gemini (if API key available)
  rankedOpportunities = await enrichOpportunitiesWithAi(rankedOpportunities, geminiApiKey);

  // 8. Persist run and opportunities to Supabase asynchronously
  try {
    await supabase.from("analytics_runs").insert(runRecord);

    if (rankedOpportunities.length > 0) {
      const rows = rankedOpportunities.map((opp) => ({
        id: opp.id,
        shop_id: opp.shop_id,
        owner_id: opp.owner_id,
        run_id: opp.run_id,
        opportunity_key: opp.opportunity_key,
        opportunity_type: opp.opportunity_type,
        title: opp.title,
        problem_description: opp.problem_description,
        priority_score: opp.priority_score,
        score_breakdown: opp.score_breakdown,
        evidence_confidence: opp.evidence_confidence,
        evidence_snapshot: opp.evidence_snapshot,
        expected_impact: opp.expected_impact,
        recommended_action: opp.recommended_action,
        data_quality_warnings: opp.data_quality_warnings,
        ai_explanation: opp.ai_explanation,
        status: opp.status,
        dismissed_reason: opp.dismissed_reason,
        detected_at: opp.detected_at,
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("sales_opportunities").upsert(rows, { onConflict: "id" });
    }
  } catch (persistErr) {
    console.warn("Could not persist Strategy Desk run to Supabase:", persistErr);
  }

  // 9. Fetch past outcomes
  let outcomes: OpportunityOutcome[] = [];
  try {
    const { data } = await supabase
      .from("opportunity_outcomes")
      .select("*")
      .eq("shop_id", shopId)
      .order("completed_at", { ascending: false });
    if (data) {
      outcomes = data as OpportunityOutcome[];
    }
  } catch {
    // Non-fatal
  }

  const topPriority = rankedOpportunities.find((o) => o.status === "open") || rankedOpportunities[0] || null;

  return {
    run: runRecord,
    opportunities: rankedOpportunities,
    topPriority,
    outcomes,
  };
}

/**
 * Updates an opportunity's lifecycle status.
 */
export async function updateOpportunityStatus(
  opportunityId: string,
  status: LifecycleStatus,
  dismissedReason?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("sales_opportunities")
      .update({
        status,
        dismissed_reason: dismissedReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opportunityId);

    return !error;
  } catch (err) {
    console.error("Failed to update opportunity status:", err);
    return false;
  }
}

/**
 * Records a measured outcome after an action is completed.
 */
export async function recordOpportunityOutcome(
  opportunity: SalesOpportunity,
  notes: string,
  periodDays: number = 7
): Promise<OpportunityOutcome | null> {
  try {
    const outcomeId = `outc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const outcome: OpportunityOutcome = {
      id: outcomeId,
      opportunity_id: opportunity.id,
      opportunity_key: opportunity.opportunity_key,
      shop_id: opportunity.shop_id,
      owner_id: opportunity.owner_id,
      action_type: opportunity.recommended_action.action_type,
      baseline_metrics: opportunity.evidence_snapshot.metrics,
      observed_metrics: {},
      observation_period_days: periodDays,
      outcome_status: "monitoring",
      attribution_method: "pre_post_comparison",
      notes: notes || undefined,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("opportunity_outcomes").insert(outcome);
    if (!error) {
      await updateOpportunityStatus(opportunity.id, "completed");
      return outcome;
    }
  } catch (err) {
    console.error("Failed to record opportunity outcome:", err);
  }
  return null;
}
