import type { Order, Product } from "../../types";
import type { BusinessMetrics, DataQualityCheckResult } from "./types";

/**
 * Validates availability, freshness, and completeness of business data.
 * Adheres to Section FR-02 in docs/AI_Strategy_Feature.md.
 */
export function validateDataQuality(
  orders: Order[],
  products: Product[],
  metrics: BusinessMetrics,
  sessionsCount: number = 0
): DataQualityCheckResult {
  const missingData: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // 1. Order volume & history check
  if (orders.length === 0) {
    missingData.push("Order history");
    warnings.push("No orders recorded yet. Historical and revenue trends cannot be calculated.");
    score -= 50;
  } else if (orders.length < 5) {
    warnings.push(`Low sample size: Only ${orders.length} order(s) available. Statistical confidence is limited.`);
    score -= 20;
  }

  // 2. Baseline comparison check
  if (metrics.previous.totalOrders === 0 && orders.length > 0) {
    warnings.push("Previous period has zero orders. Period-over-period percentage changes are unavailable.");
    score -= 15;
  }

  // 3. Product catalog & Cost (COGS) check
  if (products.length === 0) {
    missingData.push("Product catalog");
    warnings.push("No products found in the catalog. Inventory and margin analytics are disabled.");
    score -= 30;
  } else {
    const productsWithCost = products.filter((p) => (p.cost_price || 0) > 0);
    const costCoverage = productsWithCost.length / products.length;

    if (costCoverage === 0) {
      missingData.push("Product cost prices (COGS)");
      warnings.push("No product cost prices set. Profit margin and contribution analysis cannot run.");
      score -= 25;
    } else if (costCoverage < 0.7) {
      warnings.push(`Incomplete cost data: Only ${Math.round(costCoverage * 100)}% of items have cost price set.`);
      score -= 10;
    }
  }

  // 4. Customer inquiry / Chat session linkage check
  if (sessionsCount === 0) {
    missingData.push("Inquiry interaction logs");
    warnings.push("Inquiry tracking events are not active. Chat-to-order conversion gap analysis is suppressed.");
    score -= 10;
  }

  // 5. Freshness check
  if (orders.length > 0) {
    const latestOrder = orders.reduce((latest, o) => {
      const d = new Date(o.createdAt || 0).getTime();
      return d > latest ? d : latest;
    }, 0);

    const hoursSinceLastOrder = (Date.now() - latestOrder) / (1000 * 60 * 60);
    if (hoursSinceLastOrder > 168) {
      // Older than 7 days
      warnings.push(`Stale order data: Most recent order was placed ${Math.round(hoursSinceLastOrder / 24)} days ago.`);
      score -= 10;
    }
  }

  const normalizedScore = Math.max(0, Math.min(100, score));

  let status: "good" | "limited" | "insufficient" = "good";
  if (orders.length === 0 || products.length === 0 || normalizedScore < 40) {
    status = "insufficient";
  } else if (normalizedScore < 75 || missingData.length > 0) {
    status = "limited";
  }

  return {
    status,
    completenessScore: normalizedScore,
    missingData,
    warnings,
    freshnessTimestamp: new Date().toISOString(),
  };
}
