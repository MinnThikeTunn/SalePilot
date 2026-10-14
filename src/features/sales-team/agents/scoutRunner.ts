import { toolRegistry } from "../tools/toolRegistry";
import type { TeamEvidence } from "../types/sales-team";

export interface ScoutOpportunity {
  id: string;
  type: "stockout_risk" | "slow_moving_stock" | "repeat_customers" | "high_margin_winner";
  title: string;
  summary: string;
  urgency: "high" | "medium" | "low";
  potentialImpactMmk: number;
  affectedProductIds: string[];
  evidenceRefs: string[];
  recommendedNextStep: string;
}

export interface ScoutInquiryResult {
  agentKey: "scout";
  agentName: "Scout";
  title: "Opportunity Hunter Report";
  personaMotto: string;
  opportunities: ScoutOpportunity[];
  evidence: TeamEvidence[];
  marketContext?: any;
  executedAt: string;
}

export interface ScoutInquiryOptions {
  shopId: string;
  trigger?: "hunt_stockout_and_sales_risks" | "scan_slow_moving" | "repeat_cohorts" | "general";
  customPrompt?: string;
}

export function runScoutInquiry(options: ScoutInquiryOptions): ScoutInquiryResult {
  const { shopId, trigger = "general" } = options;

  // 1. Fetch live contexts via tools
  const catalogData = toolRegistry.executeTool("get_product_catalog", { shopId });
  const orderData = toolRegistry.executeTool("get_order_history", { shopId });
  const marketIntel = toolRegistry.executeTool("search_market_intelligence", { shopId, topic: "seasonal_festivals" });

  const products: any[] = catalogData.products || [];
  const orders: any[] = orderData.orders || [];

  const opportunities: ScoutOpportunity[] = [];
  const evidenceList: TeamEvidence[] = [];

  const now = new Date().toISOString();
  const sessionId = `sess-${Date.now()}`;

  // Helper to register evidence
  const addEvidence = (
    sourceType: "product" | "inventory" | "order" | "analytics",
    sourceId: string,
    metricKey: string,
    value: any,
    unit: string,
    snapshot: Record<string, any>
  ): string => {
    const evId = `ev-scout-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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

  // 2. Compute Product Sales Velocity from orders
  const productSalesMap: Record<string, { unitsSold: number; revenueMmk: number }> = {};
  const customerOrdersMap: Record<string, number> = {};

  orders.forEach((ord) => {
    if (ord.status === "confirmed" || ord.status === "completed") {
      const custKey = ord.customerPhone || ord.customerTelegramId || ord.customerName;
      if (custKey) {
        customerOrdersMap[custKey] = (customerOrdersMap[custKey] || 0) + 1;
      }

      (ord.items || []).forEach((item: any) => {
        const pId = item.productId;
        if (!productSalesMap[pId]) {
          productSalesMap[pId] = { unitsSold: 0, revenueMmk: 0 };
        }
        productSalesMap[pId].unitsSold += Number(item.quantity) || 1;
        productSalesMap[pId].revenueMmk += (Number(item.price) || 0) * (Number(item.quantity) || 1);
      });
    }
  });

  // 3. Detect Stockout Hazards
  products.forEach((prod) => {
    const stock = Number(prod.stock) || 0;
    const threshold = Number(prod.safety_stock_threshold) || 5;
    const leadTime = Number(prod.lead_time_days) || 3;
    const sales = productSalesMap[prod.id]?.unitsSold || 0;

    if (stock <= threshold) {
      const evId = addEvidence("inventory", prod.id, "stockout_buffer_breached", stock, "units", {
        productName: prod.name,
        currentStock: stock,
        safetyThreshold: threshold,
        leadTimeDays: leadTime,
        unitsSoldPeriod: sales,
      });

      const estLostDailyMmk = Math.round((Number(prod.price) || 5000) * (sales > 0 ? sales / 7 : 1));

      opportunities.push({
        id: `opp-stockout-${prod.id}`,
        type: "stockout_risk",
        title: `Imminent Stockout Risk: ${prod.name}`,
        summary: `Available inventory (${stock} units) has fallen to or below the safety buffer (${threshold} units). Supplier lead time is ${leadTime} days.`,
        urgency: "high",
        potentialImpactMmk: estLostDailyMmk * leadTime,
        affectedProductIds: [prod.id],
        evidenceRefs: [evId],
        recommendedNextStep: `Initiate supplier re-order for at least ${Math.max(15, threshold * 3)} units immediately to avoid lost conversions.`,
      });
    }
  });

  // 4. Detect Slow-Moving / Dead Inventory
  products.forEach((prod) => {
    const stock = Number(prod.stock) || 0;
    const sales = productSalesMap[prod.id]?.unitsSold || 0;
    const costPrice = Number(prod.cost_price) || Math.round((Number(prod.price) || 10000) * 0.6);

    if (stock >= 15 && sales === 0) {
      const capitalLockedMmk = stock * costPrice;
      const evId = addEvidence("product", prod.id, "dead_stock_capital_locked", capitalLockedMmk, "MMK", {
        productName: prod.name,
        currentStock: stock,
        unitCostMmk: costPrice,
        capitalLockedMmk,
        salesCount: 0,
      });

      opportunities.push({
        id: `opp-slow-${prod.id}`,
        type: "slow_moving_stock",
        title: `Capital Locked in Slow-Moving Inventory: ${prod.name}`,
        summary: `${stock} units currently held in stock with 0 recorded orders, locking approximately ${capitalLockedMmk.toLocaleString()} MMK in dormant working capital.`,
        urgency: "medium",
        potentialImpactMmk: capitalLockedMmk,
        affectedProductIds: [prod.id],
        evidenceRefs: [evId],
        recommendedNextStep: `Have Muse construct a promotional festival bundle or discounted flash offer (clearing stock while protecting Guardian margin floor).`,
      });
    }
  });

  // 5. Detect Repeat Customer Loyalty Cohorts
  let repeatCustomerCount = 0;
  let totalRepeatOrders = 0;
  Object.values(customerOrdersMap).forEach((cnt) => {
    if (cnt > 1) {
      repeatCustomerCount++;
      totalRepeatOrders += cnt;
    }
  });

  if (repeatCustomerCount > 0) {
    const evId = addEvidence("order", "cohort-repeat-buyers", "repeat_customer_frequency", repeatCustomerCount, "customers", {
      repeatCustomerCount,
      totalRepeatOrders,
      totalRecordedCustomers: Object.keys(customerOrdersMap).length,
    });

    opportunities.push({
      id: "opp-repeat-cohort",
      type: "repeat_customers",
      title: `Repeat Buyer Loyalty Cohort Detected (${repeatCustomerCount} Customers)`,
      summary: `${repeatCustomerCount} verified buyers have placed multiple orders. Repeat customers typically yield 3x higher lifetime value and zero customer acquisition cost.`,
      urgency: "medium",
      potentialImpactMmk: Math.round(totalRepeatOrders * 15000),
      affectedProductIds: products.slice(0, 2).map((p) => p.id),
      evidenceRefs: [evId],
      recommendedNextStep: `Deploy an exclusive VIP Telegram broadcast thanking loyal buyers with early access to upcoming festival arrivals.`,
    });
  }

  return {
    agentKey: "scout",
    agentName: "Scout",
    title: "Opportunity Hunter Report",
    personaMotto: "Ground every claim in verified transaction timestamps and stock velocity.",
    opportunities,
    evidence: evidenceList,
    marketContext: marketIntel?.intelligence || null,
    executedAt: now,
  };
}
