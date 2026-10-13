import type {
  ShopBusinessPolicy,
  TeamSession,
  TeamApproval,
  AgentRoleKey,
} from "../types/sales-team";
import { getState } from "../../../services/clientStore";

// Local in-memory policy cache with localStorage fallback
const POLICY_STORAGE_KEY = "sales_brain_policies_v1";

const DEFAULT_POLICY: ShopBusinessPolicy = {
  shop_id: "default_shop",
  min_contribution_margin_pct: 15,
  max_discount_pct: 20,
  require_delivery_fee_coverage: true,
  max_cod_return_allowance_pct: 10,
};

let cachedPolicy: ShopBusinessPolicy | null = null;

export function getShopBusinessPolicies(shopId: string): ShopBusinessPolicy {
  if (cachedPolicy && cachedPolicy.shop_id === shopId) {
    return cachedPolicy;
  }

  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(`${POLICY_STORAGE_KEY}_${shopId}`);
      if (stored) {
        cachedPolicy = JSON.parse(stored);
        return cachedPolicy!;
      }
    } catch {
      // ignore
    }
  }

  cachedPolicy = { ...DEFAULT_POLICY, shop_id: shopId };
  return cachedPolicy;
}

export function updateShopBusinessPolicies(
  shopId: string,
  policies: Partial<ShopBusinessPolicy>
): ShopBusinessPolicy {
  const current = getShopBusinessPolicies(shopId);
  const updated: ShopBusinessPolicy = {
    ...current,
    ...policies,
    shop_id: shopId,
    updated_at: new Date().toISOString(),
  };

  cachedPolicy = updated;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(`${POLICY_STORAGE_KEY}_${shopId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to persist shop policies:", e);
    }
  }

  return updated;
}

export interface DataFreshnessStatus {
  totalProducts: number;
  costedProducts: number;
  totalOrders: number;
  completedOrders: number;
  lastUpdated: string;
  dataCoverageStatus: "good" | "limited" | "insufficient";
  limitations: string[];
}

export function getDataFreshnessStatus(shopId: string): DataFreshnessStatus {
  const state = getState();
  const products = state.products || [];
  const orders = state.orders || [];

  const costedProducts = products.filter(
    (p) => p.cost_price !== undefined && p.cost_price > 0
  ).length;
  const completedOrders = orders.filter(
    (o) => o.status === "confirmed" || o.status === "completed"
  ).length;

  const limitations: string[] = [];
  if (completedOrders < 5) {
    limitations.push("Store has fewer than 5 completed transactions");
  }
  if (costedProducts < products.length) {
    limitations.push(`${products.length - costedProducts} products have unrecorded cost prices`);
  }

  let dataCoverageStatus: "good" | "limited" | "insufficient" = "good";
  if (completedOrders < 3 || products.length === 0) {
    dataCoverageStatus = "insufficient";
  } else if (limitations.length > 0) {
    dataCoverageStatus = "limited";
  }

  return {
    totalProducts: products.length,
    costedProducts,
    totalOrders: orders.length,
    completedOrders,
    lastUpdated: new Date().toISOString(),
    dataCoverageStatus,
    limitations,
  };
}

// In-memory approvals cache
let inMemoryApprovals: TeamApproval[] = [];

export function getPendingApprovals(shopId: string): TeamApproval[] {
  return inMemoryApprovals.filter(
    (a) => a.shop_id === shopId && a.status === "pending"
  );
}

export function getPendingApprovalsCount(shopId: string): number {
  return getPendingApprovals(shopId).length;
}

export interface AgentRosterInfo {
  key: AgentRoleKey;
  name: string;
  title: string;
  persona: string;
  motto: string;
  avatarUrl: string;
  description: string;
  status: "ready" | "investigating" | "auditing";
  iconName: string;
  specialty: string;
  systemPersonaPrompt: string;
}

export function getAgentRoster(): AgentRosterInfo[] {
  return [
    {
      key: "scout",
      name: "Scout",
      title: "Opportunity Hunter",
      persona: "Rigorous Inventory & Trend Analyst",
      motto: "Ground every claim in verified transaction timestamps and stock velocity.",
      avatarUrl: "/avatars/Scout.jpg",
      description: "Detects inventory anomalies, stockout hazards, and repeat buyers from real data.",
      status: "ready",
      iconName: "Search",
      specialty: "Inventory & Trends",
      systemPersonaPrompt:
        "You are Scout, the Opportunity Hunter. You examine real product inventory, sales histories, and reorder lead times. You flag slow-moving items, stockout risks, and repeat customer cohorts. You never guess numbers; you cite exact product IDs, stock counts, and timestamps.",
    },
    {
      key: "guardian",
      name: "Guardian",
      title: "Profit Protector",
      persona: "Conservative CFO & Margin Sentry (Patrick Campbell style)",
      motto: "Revenue is vanity, profit is sanity, cash is reality.",
      avatarUrl: "/avatars/Guardian.jpg",
      description: "Calculates unit economics, margin floors, and vetoes financially unsafe promotions.",
      status: "ready",
      iconName: "ShieldCheck",
      specialty: "Unit Economics",
      systemPersonaPrompt:
        "You are Guardian, the Profit Protector. You enforce deterministic unit economics, contribution margins, and policy discount limits. You factor in Myanmar social commerce realities like courier COD return rates (15-20%) and variable delivery fees. You veto any proposal with negative or sub-threshold contribution margins.",
    },
    {
      key: "muse",
      name: "Muse",
      title: "Campaign Creator",
      persona: "Direct-Response Growth Copywriter (Joanna Wiebe style)",
      motto: "Make offers irresistible, specific, and bounded by real availability.",
      avatarUrl: "/avatars/Muse.jpg",
      description: "Drafts high-converting campaign concepts, bundles, and copy within Guardian limits.",
      status: "ready",
      iconName: "Sparkles",
      specialty: "Campaigns & Offers",
      systemPersonaPrompt:
        "You are Muse, the Campaign Creator. You craft high-converting Telegram announcements, product bundles, and seasonal festival promotions (Thadingyut, Tazaungdaing, payday specials). You strictly cite verified catalog items, available stock, and prices, respecting Guardian's margin boundaries.",
    },
    {
      key: "echo",
      name: "Echo",
      title: "Customer Advocate",
      persona: "Empathetic Human-Centered UX Detective (Don Norman style)",
      motto: "Listen to the silence where customers abandoned the conversation.",
      avatarUrl: "/avatars/Echo.jpg",
      description: "Classifies customer objections and friction points from conversation touchpoints.",
      status: "ready",
      iconName: "MessageCircle",
      specialty: "Customer Friction",
      systemPersonaPrompt:
        "You are Echo, the Customer Advocate. You investigate why buyers drop off in Telegram conversations without purchasing (delivery fee objections, payment method hesitation, trust deficits). You classify objections into actionable categories while strictly safeguarding customer privacy and PII.",
    },
    {
      key: "commander",
      name: "Commander",
      title: "Strategy Lead",
      persona: "Decisive Executive Product Strategist (Marty Cagan style)",
      motto: "Clear decisions backed by evidence, prioritized by impact and feasibility.",
      avatarUrl: "/avatars/Commander.jpg",
      description: "Reconciles agent debates, scores with ICE, and synthesizes actionable Strategy Decision Cards.",
      status: "ready",
      iconName: "Award",
      specialty: "Strategic Decisions",
      systemPersonaPrompt:
        "You are Commander, the Strategy Lead. You arbitrate debates between Muse's promotional ideas and Guardian's financial constraints. You score opportunities using ICE (Impact, Confidence, Ease), discard unsupported assertions, and produce concise, executive Strategy Decision Cards for owner approval.",
    },
  ];
}


