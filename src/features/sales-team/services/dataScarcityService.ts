import type { TeamEvidence } from "../types/sales-team";
import { getState } from "../../../services/clientStore";

export interface GuidedDataTask {
  id: string;
  title: string;
  description: string;
  category: "cogs" | "orders" | "policies" | "catalog";
  isCompleted: boolean;
  actionLabel: string;
}

export interface DataScarcityEvaluation {
  status: "insufficient_evidence" | "limited_evidence" | "robust";
  isSuppressed: boolean;
  totalProductsCount: number;
  costedProductsCount: number;
  completedOrdersCount: number;
  limitations: string[];
  guidedTasks: GuidedDataTask[];
  evaluatedAt: string;
}

export interface EvidenceFilterOptions {
  sourceType?: string;
  searchQuery?: string;
  sessionId?: string;
  dateStart?: string;
  dateEnd?: string;
}

/**
 * Evaluates store empirical data density and enforces ADR-0003 graceful degradation.
 * If completed transactions < 5 or products lack cost prices, flags data scarcity
 * and provides guided onboarding tasks while suppressing speculative projections.
 */
export function evaluateDataScarcity(shopId: string): DataScarcityEvaluation {
  const state = getState();
  const products = state.products || [];
  const orders = state.orders || [];

  const costedProducts = products.filter(
    (p) => p.cost_price !== undefined && p.cost_price !== null && Number(p.cost_price) > 0
  );
  const costedCount = costedProducts.length;
  const uncostedCount = products.length - costedCount;

  const completedOrders = orders.filter(
    (o) => o.status === "confirmed" || o.status === "completed"
  );
  const completedCount = completedOrders.length;

  const limitations: string[] = [];
  const guidedTasks: GuidedDataTask[] = [];

  if (completedCount < 5) {
    limitations.push(
      `Store has recorded only ${completedCount} completed transaction(s) (< 5 required for empirical statistical conversion modeling).`
    );
    guidedTasks.push({
      id: "task-order-volume",
      title: "Log Initial Customer Transactions",
      description: `Process ${Math.max(1, 5 - completedCount)} more confirmed/completed orders to unlock sales velocity curves.`,
      category: "orders",
      isCompleted: false,
      actionLabel: "View Orders",
    });
  }

  if (uncostedCount > 0) {
    limitations.push(
      `${uncostedCount} catalog item(s) are missing wholesale COGS (cost_price). Margin protections remain unverified.`
    );
    guidedTasks.push({
      id: "task-record-cogs",
      title: "Record Wholesale Cost Prices",
      description: `Enter cost_price for ${uncostedCount} uncosted items in your inventory catalog.`,
      category: "cogs",
      isCompleted: false,
      actionLabel: "Edit Inventory",
    });
  }

  if (products.length === 0) {
    limitations.push("No products currently exist in catalog.");
    guidedTasks.push({
      id: "task-add-products",
      title: "Add Initial Catalog Products",
      description: "Upload at least 3 active products with retail prices and stock quantities.",
      category: "catalog",
      isCompleted: false,
      actionLabel: "Add Products",
    });
  }

  let status: "insufficient_evidence" | "limited_evidence" | "robust" = "robust";
  if (completedCount < 5 || products.length === 0) {
    status = "insufficient_evidence";
  } else if (uncostedCount > 0) {
    status = "limited_evidence";
  }

  const isSuppressed = status === "insufficient_evidence";

  return {
    status,
    isSuppressed,
    totalProductsCount: products.length,
    costedProductsCount: costedCount,
    completedOrdersCount: completedCount,
    limitations,
    guidedTasks,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Filter Engine for Evidence Explorer
 * 
 * Filter by source entity, metric key, search query, or observation timestamp.
 */
export function filterEvidenceRecords(
  evidenceList: TeamEvidence[],
  filters: EvidenceFilterOptions
): TeamEvidence[] {
  return evidenceList.filter((ev) => {
    // 1. Source Type Filter
    if (filters.sourceType && filters.sourceType !== "all") {
      if (ev.source_type !== filters.sourceType) return false;
    }

    // 2. Session ID Filter
    if (filters.sessionId && ev.session_id !== filters.sessionId) {
      return false;
    }

    // 3. Search Query Filter
    if (filters.searchQuery && filters.searchQuery.trim().length > 0) {
      const q = filters.searchQuery.toLowerCase().trim();
      const matchMetric = (ev.metric_key || "").toLowerCase().includes(q);
      const matchSource = (ev.source_id || "").toLowerCase().includes(q);
      const matchUnit = (ev.unit || "").toLowerCase().includes(q);
      const matchType = (ev.source_type || "").toLowerCase().includes(q);
      if (!matchMetric && !matchSource && !matchUnit && !matchType) return false;
    }

    // 4. Date Range Filter
    if (filters.dateStart) {
      const start = new Date(filters.dateStart).getTime();
      const obs = new Date(ev.observed_at).getTime();
      if (obs < start) return false;
    }

    if (filters.dateEnd) {
      const end = new Date(filters.dateEnd).getTime();
      const obs = new Date(ev.observed_at).getTime();
      if (obs > end) return false;
    }

    return true;
  });
}
