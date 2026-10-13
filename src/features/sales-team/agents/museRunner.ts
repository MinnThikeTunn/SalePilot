import { toolRegistry } from "../tools/toolRegistry";
import type { TeamProposal, ShopBusinessPolicy, TeamEvidence } from "../types/sales-team";

export interface MuseCraftOptions {
  shopId: string;
  sessionId: string;
  scoutEvidenceRefs?: string[];
  echoEvidenceRefs?: string[];
  policy: ShopBusinessPolicy;
  revisionRound?: number;
  guardianFeedback?: string;
  goal?: string;
}

export interface MuseRunResult {
  agentKey: "muse";
  agentName: "Muse";
  title: string;
  personaMotto: string;
  proposals: TeamProposal[];
  evidence: TeamEvidence[];
  executedAt: string;
}

/**
 * Muse Campaign Creator Runner
 * 
 * Crafts high-converting Telegram promotional announcements, product bundles,
 * and seasonal festival offers bounded by real inventory and Guardian margin ceilings.
 */
export function runMuseProposals(options: MuseCraftOptions): MuseRunResult {
  const {
    shopId,
    sessionId,
    scoutEvidenceRefs = [],
    echoEvidenceRefs = [],
    policy,
    revisionRound = 0,
    guardianFeedback,
    goal,
  } = options;

  const catalogData = toolRegistry.executeTool("get_product_catalog", { shopId });
  const seasonalIntel = toolRegistry.executeTool("search_market_intelligence", {
    shopId,
    topic: "seasonal_festivals",
  });

  const products: any[] = catalogData.products || [];
  const now = new Date().toISOString();
  const evidenceList: TeamEvidence[] = [];

  // Register Muse creative evidence
  const evId = `ev-muse-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  evidenceList.push({
    id: evId,
    shop_id: shopId,
    session_id: sessionId,
    source_type: "campaign",
    source_id: "seasonal_campaign_draft",
    metric_key: "projected_campaign_cr_uplift",
    value: 28.5,
    unit: "%",
    observed_at: now,
    snapshot: {
      season: seasonalIntel?.intelligence?.currentSeason || "Thadingyut Festival",
      proposedBundleStrategy: "High-margin anchor + dormant stock gift perk",
      revisionRound,
      guardianFeedback: guardianFeedback || null,
    },
    quality: {
      coverage: 100,
      missing_fields: [],
      limitations: [],
    },
  });

  // Pick anchor product (with healthy stock) and optional gift item
  const anchorProduct = products[0] || {
    id: "prod-default",
    name: "Shan Mountain Heritage Tea",
    price: 25000,
    stock: 20,
  };
  const giftProduct = products.length > 1 ? products[1] : null;

  // Determine safe discount percentage based on revision cycle
  let discountPct = Math.min(policy.max_discount_pct, 15);
  let proposalTitle = "Thadingyut Festival VIP Tea & Teaware Gift Bundle";
  let hypothesis = `Offering a limited-time festival bundle with ${anchorProduct.name} and guaranteed delivery will increase Telegram checkout completion by ~25% without sacrificing contribution margin.`;

  if (revisionRound > 0 && guardianFeedback) {
    // Muse adapts defensively upon Guardian challenge
    discountPct = Math.max(5, Math.floor(discountPct / 2));
    proposalTitle = `Revised: Thadingyut Appreciation Gift Set (${discountPct}% Cap + Free Tasting Perk)`;
    hypothesis = `Revised per Guardian margin veto: Discount scaled down to ${discountPct}%, replacing cash discount with surplus inventory gift item to preserve Guardian margin floor while overcoming buyer hesitation.`;
  }

  const allEvidenceRefs = [...scoutEvidenceRefs, ...echoEvidenceRefs, evId];

  const primaryProposal: TeamProposal = {
    id: `prop-muse-${Date.now()}`,
    session_id: sessionId,
    agent_key: "muse",
    title: proposalTitle,
    hypothesis,
    evidence_refs: allEvidenceRefs,
    assumptions: [
      `Anchor product (${anchorProduct.name}) has sufficient stock (${anchorProduct.stock} units) to fulfill campaign demand.`,
      "Thadingyut Lighting Festival gifts peak during current month with high gifting propensity.",
      `Offering transparent delivery fee upfront addresses Echo's identified checkout abandonment.`,
    ],
    estimated_impact: {
      metric: "Incremental Gross Revenue",
      value: (Number(anchorProduct.price) || 20000) * 15,
      unit: "MMK",
      basis: "scenario",
    },
    risks: [
      "Courier delivery delays if dispatched fewer than 48 hours before festival holiday cutoff.",
      "Stock exhaustion if order velocity exceeds reorder safety buffer.",
    ],
    recommended_action: `Deploy targeted Telegram broadcast to repeat buyer cohorts with 1-click order button and flat-rate delivery guarantee.`,
    requires_owner_approval: true,
    status: revisionRound > 0 ? "revised" : "draft",
  };

  return {
    agentKey: "muse",
    agentName: "Muse",
    title: "Direct-Response Campaign & Bundle Formulation",
    personaMotto: "Make offers irresistible, specific, and bounded by real availability.",
    proposals: [primaryProposal],
    evidence: evidenceList,
    executedAt: now,
  };
}
