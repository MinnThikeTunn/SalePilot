import { toolRegistry } from "../tools/toolRegistry";
import type { TeamEvidence, ShopBusinessPolicy } from "../types/sales-team";
import { getShopBusinessPolicies } from "../services/salesTeamApi";

export interface ProductEconomicsInput {
  price: number;
  costPrice?: number | null;
  discountPct?: number;
  deliveryFee?: number;
  courierReturnRiskPct?: number;
  policy: ShopBusinessPolicy;
}

export interface ProductEconomicsResult {
  originalPrice: number;
  discountPct: number;
  discountAmount: number;
  netPrice: number;
  costPrice: number | null;
  costMissing: boolean;
  grossMarginMmk: number | null;
  grossMarginPct: number | null;
  returnRiskAllowanceMmk: number;
  contributionMmk: number | null;
  contributionMarginPct: number | null;
  status: "approved" | "vetoed" | "warning_unverified";
  isVetoed: boolean;
  vetoReason?: string;
}

export interface ProductFinancialAudit extends ProductEconomicsResult {
  productId: string;
  productName: string;
  currentStock: number;
  recommendation: string;
  evidenceRefs: string[];
}

export interface GuardianAuditResult {
  agentKey: "guardian";
  agentName: "Guardian";
  title: string;
  personaMotto: string;
  financialAudits: ProductFinancialAudit[];
  policySummary: ShopBusinessPolicy;
  evidence: TeamEvidence[];
  marketContext?: any;
  vetoCount: number;
  executedAt: string;
}

export interface GuardianAuditOptions {
  shopId: string;
  proposedDiscountPct?: number;
  deliveryFee?: number;
  targetProductId?: string;
  trigger?: "audit_catalog_margins" | "simulate_discount" | "stress_test_cod" | "general" | "custom";
  customPrompt?: string;
}

/**
 * Pure Deterministic Unit Economics Engine
 *
 * Implements strict financial guardrails for Guardian.
 * Never guesses or substitutes zero for missing COGS.
 */
export function calculateProductEconomics(input: ProductEconomicsInput): ProductEconomicsResult {
  const price = Math.max(0, Number(input.price) || 0);
  const discountPct = Math.min(100, Math.max(0, Number(input.discountPct) || 0));
  const discountAmount = Math.round(price * (discountPct / 100));
  const netPrice = price - discountAmount;
  const deliveryFee = Math.max(0, Number(input.deliveryFee) || 0);

  const policyReturnRisk = input.policy?.max_cod_return_allowance_pct ?? 15;
  const returnRiskPct =
    input.courierReturnRiskPct !== undefined
      ? Number(input.courierReturnRiskPct)
      : policyReturnRisk;

  const returnRiskAllowanceMmk = Math.round(deliveryFee * (returnRiskPct / 100));

  const hasCost =
    input.costPrice !== undefined &&
    input.costPrice !== null &&
    !isNaN(Number(input.costPrice)) &&
    Number(input.costPrice) > 0;

  // Seam: Missing COGS handling
  if (!hasCost) {
    return {
      originalPrice: price,
      discountPct,
      discountAmount,
      netPrice,
      costPrice: null,
      costMissing: true,
      grossMarginMmk: null,
      grossMarginPct: null,
      returnRiskAllowanceMmk,
      contributionMmk: null,
      contributionMarginPct: null,
      status: "warning_unverified",
      isVetoed: false,
      vetoReason:
        "Wholesale COGS (cost_price) is unrecorded; cannot determine unit profit margins without cost data.",
    };
  }

  const costPrice = Number(input.costPrice);
  const grossMarginMmk = netPrice - costPrice;
  const grossMarginPct =
    netPrice > 0 ? Number(((grossMarginMmk / netPrice) * 100).toFixed(1)) : 0;

  const contributionMmk = grossMarginMmk - returnRiskAllowanceMmk;
  const contributionMarginPct =
    netPrice > 0 ? Number(((contributionMmk / netPrice) * 100).toFixed(1)) : 0;

  const maxDiscountAllowed = input.policy?.max_discount_pct ?? 20;
  const minMarginAllowed = input.policy?.min_contribution_margin_pct ?? 15;

  // 1. Discount Ceiling Veto Check
  if (discountPct > maxDiscountAllowed) {
    return {
      originalPrice: price,
      discountPct,
      discountAmount,
      netPrice,
      costPrice,
      costMissing: false,
      grossMarginMmk,
      grossMarginPct,
      returnRiskAllowanceMmk,
      contributionMmk,
      contributionMarginPct,
      status: "vetoed",
      isVetoed: true,
      vetoReason: `Proposed discount (${discountPct}%) exceeds maximum discount ceiling of ${maxDiscountAllowed}%.`,
    };
  }

  // 2. Direct Financial Loss Check
  if (contributionMmk <= 0) {
    return {
      originalPrice: price,
      discountPct,
      discountAmount,
      netPrice,
      costPrice,
      costMissing: false,
      grossMarginMmk,
      grossMarginPct,
      returnRiskAllowanceMmk,
      contributionMmk,
      contributionMarginPct,
      status: "vetoed",
      isVetoed: true,
      vetoReason: `Unit contribution is non-positive (${contributionMmk.toLocaleString()} MMK); item would sell at a net financial loss.`,
    };
  }

  // 3. Minimum Contribution Margin Floor Veto Check
  if (contributionMarginPct < minMarginAllowed) {
    return {
      originalPrice: price,
      discountPct,
      discountAmount,
      netPrice,
      costPrice,
      costMissing: false,
      grossMarginMmk,
      grossMarginPct,
      returnRiskAllowanceMmk,
      contributionMmk,
      contributionMarginPct,
      status: "vetoed",
      isVetoed: true,
      vetoReason: `Projected contribution margin (${contributionMarginPct}%) breaches minimum contribution margin threshold of ${minMarginAllowed}%.`,
    };
  }

  // 4. Approved
  return {
    originalPrice: price,
    discountPct,
    discountAmount,
    netPrice,
    costPrice,
    costMissing: false,
    grossMarginMmk,
    grossMarginPct,
    returnRiskAllowanceMmk,
    contributionMmk,
    contributionMarginPct,
    status: "approved",
    isVetoed: false,
  };
}

/**
 * Guardian Profit Protector Runner
 *
 * Enforces business policy guardrails, performs deterministic unit economics calculations,
 * and attaches verifiable evidence snapshots.
 */
export function runGuardianAudit(options: GuardianAuditOptions): GuardianAuditResult {
  const {
    shopId,
    proposedDiscountPct = 0,
    deliveryFee = 2500,
    targetProductId,
  } = options;

  const policy = getShopBusinessPolicies(shopId);
  const catalogData = toolRegistry.executeTool("get_product_catalog", { shopId });
  const marketIntelCod = toolRegistry.executeTool("search_market_intelligence", {
    shopId,
    topic: "cod_return_rates",
  });

  const products: any[] = catalogData.products || [];
  const targetProducts = targetProductId
    ? products.filter((p) => p.id === targetProductId)
    : products;

  const now = new Date().toISOString();
  const sessionId = `sess-guard-${Date.now()}`;
  const evidenceList: TeamEvidence[] = [];

  const addEvidence = (
    sourceType: "product" | "analytics",
    sourceId: string,
    metricKey: string,
    value: any,
    unit: string,
    snapshot: Record<string, any>
  ): string => {
    const evId = `ev-guard-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ev: TeamEvidence = {
      id: evId,
      shop_id: shopId,
      session_id: sessionId,
      source_type: sourceType,
      source_id: sourceId,
      metric_key: metricKey,
      value,
      unit,
      observed_at: now,
      snapshot,
      quality: {
        coverage: 100,
        missing_fields: [],
        limitations: [],
      },
    };
    evidenceList.push(ev);
    return evId;
  };

  let vetoCount = 0;
  let approvedCount = 0;
  let unverifiedCount = 0;

  const financialAudits: ProductFinancialAudit[] = targetProducts.map((prod) => {
    const eco = calculateProductEconomics({
      price: Number(prod.price) || 0,
      costPrice: prod.cost_price,
      discountPct: proposedDiscountPct,
      deliveryFee,
      policy,
    });

    if (eco.status === "vetoed") vetoCount++;
    if (eco.status === "approved") approvedCount++;
    if (eco.status === "warning_unverified") unverifiedCount++;

    const evId = addEvidence(
      "product",
      prod.id,
      "unit_contribution_margin",
      eco.contributionMarginPct ?? "unknown",
      eco.contributionMarginPct !== null ? "%" : "status",
      {
        productName: prod.name,
        originalPrice: eco.originalPrice,
        discountPct: eco.discountPct,
        netPrice: eco.netPrice,
        costPrice: eco.costPrice,
        costMissing: eco.costMissing,
        grossMarginMmk: eco.grossMarginMmk,
        contributionMmk: eco.contributionMmk,
        contributionMarginPct: eco.contributionMarginPct,
        status: eco.status,
        vetoReason: eco.vetoReason || null,
      }
    );

    let recommendation = "";
    if (eco.status === "approved") {
      recommendation = `Financially sound. Margin of ${eco.contributionMarginPct}% satisfies the ${policy.min_contribution_margin_pct}% policy floor. Safe for campaign deployment.`;
    } else if (eco.status === "vetoed") {
      recommendation = `Vetoed: ${eco.vetoReason}. Guardian requires reducing discount or pairing with a high-margin add-on before launching.`;
    } else {
      recommendation = `Unverified: Please enter supplier wholesale cost price in inventory settings to unlock automated margin auditing.`;
    }

    return {
      ...eco,
      productId: prod.id,
      productName: prod.name,
      currentStock: Number(prod.stock) || 0,
      recommendation,
      evidenceRefs: [evId],
    };
  });

  // Overall compliance evidence
  addEvidence(
    "analytics",
    "shop_policy_audit",
    "policy_compliance_rate",
    financialAudits.length > 0
      ? Number(((approvedCount / financialAudits.length) * 100).toFixed(1))
      : 100,
    "%",
    {
      totalAudited: financialAudits.length,
      approvedCount,
      vetoCount,
      unverifiedCount,
      policySettings: {
        minMarginPct: policy.min_contribution_margin_pct,
        maxDiscountPct: policy.max_discount_pct,
        requireDeliveryCoverage: policy.require_delivery_fee_coverage,
        maxCodReturnRiskPct: policy.max_cod_return_allowance_pct,
      },
    }
  );

  return {
    agentKey: "guardian",
    agentName: "Guardian",
    title: "Profit Protection & Unit Economics Audit",
    personaMotto: "Revenue is vanity, profit is sanity, cash is reality.",
    financialAudits,
    policySummary: policy,
    evidence: evidenceList,
    marketContext: marketIntelCod?.intelligence || null,
    vetoCount,
    executedAt: now,
  };
}
