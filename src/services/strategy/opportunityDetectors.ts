import type { Order, Product } from "../../types";
import type {
  BusinessMetrics,
  DataQualityCheckResult,
  OpportunityCandidate,
} from "./types";

/**
 * Modular rule-based opportunity detection engine.
 * Adheres strictly to Section FR-03 in docs/AI_Strategy_Feature.md.
 */
export function detectOpportunities(
  metrics: BusinessMetrics,
  products: Product[],
  orders: Order[],
  quality: DataQualityCheckResult,
  sessionsCount: number = 0
): OpportunityCandidate[] {
  const candidates: OpportunityCandidate[] = [];

  // 1. Detector: Sales Decline
  const salesDecline = detectSalesDecline(metrics, quality);
  if (salesDecline) candidates.push(salesDecline);

  // 2. Detector: Stockout / Inventory Risk
  const stockRisks = detectStockRisks(products, metrics, quality);
  candidates.push(...stockRisks);

  // 3. Detector: Cancellation Rate Spike
  const cancellationRisk = detectCancellationRisk(metrics, orders, quality);
  if (cancellationRisk) candidates.push(cancellationRisk);

  // 4. Detector: Margin Opportunity (Requires Cost Price)
  const marginOpps = detectMarginOpportunities(products, metrics, quality);
  candidates.push(...marginOpps);

  // 5. Detector: Repeat Purchase Opportunity
  const repeatOpp = detectRepeatPurchaseOpportunity(orders, metrics, quality);
  if (repeatOpp) candidates.push(repeatOpp);

  // 6. Detector: Conversion Gap (Only if inquiry sessions exist)
  if (sessionsCount > 0) {
    const conversionOpp = detectConversionGap(metrics, sessionsCount, quality);
    if (conversionOpp) candidates.push(conversionOpp);
  }

  return candidates;
}

/**
 * 1. Sales Decline Detector
 */
function detectSalesDecline(
  metrics: BusinessMetrics,
  quality: DataQualityCheckResult
): OpportunityCandidate | null {
  const { current, previous, changes } = metrics;

  if (previous.revenue === 0 || changes.revenuePct === null) {
    return null; // Cannot calculate percentage decline from zero baseline
  }

  // Trigger if revenue dropped by 10% or more, or completed orders dropped by 15% or more
  const revenueDrop = changes.revenuePct <= -10;
  const ordersDrop = changes.ordersPct !== null && changes.ordersPct <= -15;

  if (!revenueDrop && !ordersDrop) {
    return null;
  }

  const dropPct = Math.abs(changes.revenuePct);
  const revenueDiff = previous.revenue - current.revenue;

  // Impact: Proportional to revenue loss (capped at 95)
  const impactScore = Math.min(95, Math.max(40, Math.round(dropPct * 1.5)));
  const evidenceScore = quality.status === "good" ? 85 : 60;
  const urgencyScore = dropPct > 25 ? 90 : 70;
  const actionabilityScore = 80;

  return {
    key: `sales_decline_7d`,
    type: "sales_decline",
    title: `Sales Volume Dropped by ${dropPct}% This Week`,
    problemDescription: `Store net sales dropped from ${previous.revenue.toLocaleString()} MMK to ${current.revenue.toLocaleString()} MMK across comparable periods.`,
    impactScore,
    evidenceScore,
    urgencyScore,
    actionabilityScore,
    confidence: quality.status === "good" ? "high" : "medium",
    evidenceSnapshot: {
      metrics: {
        current_revenue: current.revenue,
        previous_revenue: previous.revenue,
        revenue_drop_pct: dropPct,
        current_completed_orders: current.completedOrders,
        previous_completed_orders: previous.completedOrders,
      },
      analysisPeriod: "Current 7 Days",
      comparisonPeriod: "Previous 7 Days",
      comparisonValues: {
        previous_revenue_mmk: previous.revenue,
        previous_completed_orders: previous.completedOrders,
      },
      sourceRecords: `${current.orders.length + previous.orders.length} order records analyzed`,
      warnings: quality.warnings,
    },
    expectedImpact: {
      revenueAtRiskMmk: revenueDiff,
      assumptions: "Reversing current trajectory by recovering order volume to baseline.",
    },
    recommendedAction: {
      actionType: "launch_promotion",
      title: "Run Flash Discount Campaign & Broadcast to Recent Shoppers",
      description: "Launch a targeted weekend promo on top sellers to reactivate buying momentum.",
      requiresApproval: true,
      suggestedParams: { discount_pct: 10, channel: "Telegram & Messenger" },
    },
    warnings: quality.warnings,
    templateExplanation: {
      whyItMatters: `Your store experienced a ${dropPct}% dip in net sales compared to the prior period, leaving an estimated ${revenueDiff.toLocaleString()} MMK in unrealized weekly turnover.`,
      actionRationale: "A short-window promotional campaign on your most popular items will lower checkout friction and recover transaction velocity.",
      expectedOutcome: `Targeting a recovery of ${Math.round(revenueDiff * 0.6).toLocaleString()} MMK in weekly volume within 7 days.`,
      limitations: "Based on 14-day trailing order logs.",
    },
  };
}

/**
 * 2. Stock Risk Detector
 */
function detectStockRisks(
  products: Product[],
  metrics: BusinessMetrics,
  quality: DataQualityCheckResult
): OpportunityCandidate[] {
  const candidates: OpportunityCandidate[] = [];

  products.forEach((p) => {
    // Only check active products with positive or zero stock
    const velocity =
      (metrics.current.productVelocities[p.id]?.unitsSold ||
        metrics.current.productVelocities[p.name]?.unitsSold) || 0;
    const dailyVelocity = velocity / 7; // Units per day
    const leadTime = p.lead_time_days || 3;
    const safetyStock = p.safety_stock_threshold || 5;

    let isRisk = false;
    let daysRunway = 999;
    let riskDescription = "";

    if (p.stock === 0) {
      isRisk = true;
      daysRunway = 0;
      riskDescription = `${p.name} is completely out of stock. Customers cannot complete orders.`;
    } else if (dailyVelocity > 0) {
      daysRunway = Number((p.stock / dailyVelocity).toFixed(1));
      if (daysRunway <= leadTime * 1.5) {
        isRisk = true;
        riskDescription = `${p.name} has only ${daysRunway} days of stock remaining (${p.stock} units left at ${dailyVelocity.toFixed(1)} units/day).`;
      }
    } else if (p.stock <= safetyStock) {
      isRisk = true;
      daysRunway = Math.max(1, p.stock);
      riskDescription = `${p.name} has only ${p.stock} unit(s) remaining, below the safety threshold of ${safetyStock}.`;
    }

    if (isRisk) {
      const estimatedLoss = (p.price || 0) * Math.max(5, Math.round(dailyVelocity * leadTime));
      const urgencyScore = daysRunway <= 1 ? 95 : daysRunway <= 3 ? 85 : 70;
      const impactScore = Math.min(90, Math.max(50, Math.round((estimatedLoss / 10000) * 5)));

      candidates.push({
        key: `stock_risk_${p.id}`,
        type: "stock_risk",
        title: daysRunway === 0 ? `Stockout Alert: ${p.name}` : `Restock Needed: ${p.name} (${daysRunway} Days Runway)`,
        problemDescription: riskDescription,
        impactScore,
        evidenceScore: 90,
        urgencyScore,
        actionabilityScore: 90,
        confidence: "high",
        evidenceSnapshot: {
          metrics: {
            current_stock: p.stock,
            daily_sales_velocity: Number(dailyVelocity.toFixed(2)),
            days_of_coverage: daysRunway,
            supplier_lead_time_days: leadTime,
            safety_threshold: safetyStock,
            retail_price_mmk: p.price,
          },
          analysisPeriod: "Current 7 Days",
          sourceRecords: "Product Catalog & 7-Day Line-item Sales",
        },
        expectedImpact: {
          revenueAtRiskMmk: estimatedLoss,
          unitsImpacted: Math.max(1, p.stock),
          assumptions: `Preventing stockout loss during the ${leadTime}-day restocking window.`,
        },
        recommendedAction: {
          actionType: "reorder_stock",
          title: `Reorder ${Math.max(10, safetyStock * 3)} Units from Supplier`,
          description: `Place an inventory replenishment order immediately to avoid missed sales.`,
          requiresApproval: true,
          suggestedParams: { productId: p.id, recommendedUnits: Math.max(10, safetyStock * 3) },
        },
        warnings: quality.warnings,
        templateExplanation: {
          whyItMatters: `${p.name} is running low. At your current pace, inventory will deplete before a supplier shipment arrives, resulting in lost sales.`,
          actionRationale: `Ordering replenishment now ensures buffer stock remains intact during the ${leadTime}-day delivery window.`,
          expectedOutcome: `Protects an estimated ${estimatedLoss.toLocaleString()} MMK in customer transactions.`,
          limitations: "Assumes consistent sales pace over the next week.",
        },
      });
    }
  });

  return candidates.slice(0, 3); // Max 3 most critical stock risks
}

/**
 * 3. Cancellation Risk Detector
 */
function detectCancellationRisk(
  metrics: BusinessMetrics,
  orders: Order[],
  quality: DataQualityCheckResult
): OpportunityCandidate | null {
  const { current } = metrics;

  if (current.totalOrders < 3) return null;

  const cancellationRatePct = Math.round(current.cancellationRate * 100);

  // Trigger if cancellation rate >= 20%
  if (cancellationRatePct < 20) return null;

  const cancelledOrders = orders.filter((o) => o.status === "cancelled");
  const codCancelled = cancelledOrders.filter((o) => o.paymentMethod === "cod").length;
  const prepayCancelled = cancelledOrders.length - codCancelled;

  const impactScore = Math.min(90, Math.max(45, cancellationRatePct * 1.6));
  const urgencyScore = cancellationRatePct >= 35 ? 90 : 75;
  const evidenceScore = 85;
  const actionabilityScore = 85;

  return {
    key: `cancellation_rate_spike`,
    type: "cancellation_risk",
    title: `High Cancellation Rate (${cancellationRatePct}% of Orders Cancelled)`,
    problemDescription: `${cancelledOrders.length} out of ${current.totalOrders} recent orders were cancelled, eroding fulfillment efficiency.`,
    impactScore,
    evidenceScore,
    urgencyScore,
    actionabilityScore,
    confidence: "high",
    evidenceSnapshot: {
      metrics: {
        total_orders: current.totalOrders,
        cancelled_orders: cancelledOrders.length,
        cancellation_rate_pct: cancellationRatePct,
        cod_cancellations: codCancelled,
        prepay_cancellations: prepayCancelled,
      },
      analysisPeriod: "Current 7 Days",
      sourceRecords: `${current.totalOrders} order records analyzed`,
    },
    expectedImpact: {
      revenueAtRiskMmk: cancelledOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      assumptions: "Preventing repetitive cancellations and courier return shipping expenses.",
    },
    recommendedAction: {
      actionType: "tighten_payment_rules",
      title: "Require Mobile Wallet Slip Verification for First-Time Orders",
      description: "Ask new customers to verify via KPay or WavePay prepayment to reduce COD return friction.",
      requiresApproval: true,
      suggestedParams: { switch_policy: "prepay_required" },
    },
    warnings: quality.warnings,
    templateExplanation: {
      whyItMatters: `${cancellationRatePct}% of recent orders failed to complete. Unfulfilled orders waste packing labor and distort inventory allocation.`,
      actionRationale: `With ${codCancelled} COD cancellations, requiring phone confirmation or prepayment slips eliminates ghost orders before dispatch.`,
      expectedOutcome: "Expected to lower the cancellation rate below 10% within 14 days.",
      limitations: "Based on recorded order statuses.",
    },
  };
}

/**
 * 4. Margin Opportunity Detector
 */
function detectMarginOpportunities(
  products: Product[],
  metrics: BusinessMetrics,
  quality: DataQualityCheckResult
): OpportunityCandidate[] {
  const candidates: OpportunityCandidate[] = [];

  // Filter products with valid cost price
  const eligibleProducts = products.filter((p) => (p.cost_price || 0) > 0 && p.price > 0);

  eligibleProducts.forEach((p) => {
    const cost = p.cost_price || 0;
    const margin = (p.price - cost) / p.price; // Gross margin percentage
    const volume =
      (metrics.current.productVelocities[p.id]?.unitsSold ||
        metrics.current.productVelocities[p.name]?.unitsSold) || 0;

    // Trigger if margin is thin (< 25%) and product has sales volume
    if (margin < 0.25 && volume >= 2) {
      const marginPct = Math.round(margin * 100);
      const suggestedPrice = Math.round((cost / 0.65) / 500) * 500; // Price for 35% margin, rounded to 500 MMK
      const potentialExtraPerUnit = suggestedPrice - p.price;
      const potentialGainMmk = potentialExtraPerUnit * volume;

      candidates.push({
        key: `margin_opp_${p.id}`,
        type: "margin_opportunity",
        title: `Margin Compression on ${p.name} (Gross Margin: ${marginPct}%)`,
        problemDescription: `${p.name} sells at ${p.price.toLocaleString()} MMK against a wholesale cost of ${cost.toLocaleString()} MMK, leaving an unusually tight ${marginPct}% margin.`,
        impactScore: 75,
        evidenceScore: 90,
        urgencyScore: 60,
        actionabilityScore: 85,
        confidence: "high",
        evidenceSnapshot: {
          metrics: {
            retail_price_mmk: p.price,
            wholesale_cost_mmk: cost,
            gross_margin_pct: marginPct,
            units_sold_7d: volume,
            suggested_price_mmk: suggestedPrice,
          },
          analysisPeriod: "Current 7 Days",
          sourceRecords: "Product Wholesale Cost & 7-Day Order Velocity",
        },
        expectedImpact: {
          potentialGainMmk,
          unitsImpacted: volume,
          assumptions: `Adjusting price to ${suggestedPrice.toLocaleString()} MMK lifts gross margin to ~35%.`,
        },
        recommendedAction: {
          actionType: "reprice_product",
          title: `Adjust Retail Price to ${suggestedPrice.toLocaleString()} MMK`,
          description: `Reprice ${p.name} from ${p.price.toLocaleString()} MMK to ${suggestedPrice.toLocaleString()} MMK to protect net profitability.`,
          requiresApproval: true,
          suggestedParams: { productId: p.id, newPrice: suggestedPrice },
        },
        warnings: quality.warnings,
        templateExplanation: {
          whyItMatters: `High volume with a low ${marginPct}% margin means you are moving inventory with little retained profit after payment fees and overhead.`,
          actionRationale: `Small price adjustments on high-turnover items directly increase store cash flow without dampening demand.`,
          expectedOutcome: `Adds approximately ${potentialGainMmk.toLocaleString()} MMK in weekly gross profit.`,
          limitations: "Assumes demand remains stable at adjusted price point.",
        },
      });
    }
  });

  return candidates.slice(0, 2);
}

/**
 * 5. Repeat Purchase Detector
 */
function detectRepeatPurchaseOpportunity(
  orders: Order[],
  _metrics: BusinessMetrics,
  quality: DataQualityCheckResult
): OpportunityCandidate | null {
  if (orders.length < 5) return null;

  const customerOrders: Record<string, number> = {};
  orders.forEach((o) => {
    const phone = o.customerPhone ? o.customerPhone.trim() : "";
    if (phone && o.status !== "cancelled") {
      customerOrders[phone] = (customerOrders[phone] || 0) + 1;
    }
  });

  const repeatCustomers = Object.values(customerOrders).filter((c) => c >= 2).length;
  const totalUniqueCustomers = Object.keys(customerOrders).length;

  if (totalUniqueCustomers === 0) return null;

  const repeatRatePct = Math.round((repeatCustomers / totalUniqueCustomers) * 100);

  // If repeat rate is low (< 20%) but customer base is growing
  if (repeatRatePct < 20 && totalUniqueCustomers >= 4) {
    return {
      key: `repeat_purchase_activation`,
      type: "repeat_purchase",
      title: `Loyalty Retention Opportunity (${repeatRatePct}% Repeat Rate)`,
      problemDescription: `Only ${repeatCustomers} out of ${totalUniqueCustomers} unique customers have re-ordered, indicating untapped repeat potential.`,
      impactScore: 70,
      evidenceScore: 80,
      urgencyScore: 55,
      actionabilityScore: 85,
      confidence: "high",
      evidenceSnapshot: {
        metrics: {
          total_unique_customers: totalUniqueCustomers,
          repeat_customers: repeatCustomers,
          repeat_rate_pct: repeatRatePct,
        },
        analysisPeriod: "All-Time Order Ledger",
        sourceRecords: `${orders.length} orders analyzed for customer phone linkage`,
      },
      expectedImpact: {
        potentialGainMmk: Math.round(totalUniqueCustomers * 0.2 * 15000),
        assumptions: "Re-activating 20% of one-time buyers with a targeted loyalty follow-up.",
      },
      recommendedAction: {
        actionType: "send_loyalty_broadcast",
        title: "Send 5% Thank-You Reorder Voucher via Telegram",
        description: "Engage previous buyers with a limited-time repeat purchase incentive.",
        requiresApproval: true,
        suggestedParams: { discount_pct: 5 },
      },
      warnings: quality.warnings,
      templateExplanation: {
        whyItMatters: "Acquiring new customers in social commerce costs more than re-engaging past buyers who already trust your shop.",
        actionRationale: "A gentle reorder reminder with an exclusive discount encourages repeat purchases.",
        expectedOutcome: "Aiming to lift repeat purchase rate from current level toward 25%.",
        limitations: "Requires active Telegram or phone contact details.",
      },
    };
  }

  return null;
}

/**
 * 6. Conversion Gap Detector (Triggered only when sessions exist)
 */
function detectConversionGap(
  metrics: BusinessMetrics,
  sessionsCount: number,
  quality: DataQualityCheckResult
): OpportunityCandidate | null {
  const completedOrders = metrics.current.completedOrders;
  if (sessionsCount < 5) return null;

  const conversionRatePct = Math.round((completedOrders / sessionsCount) * 100);

  if (conversionRatePct < 15) {
    return {
      key: `conversion_gap_inquiries`,
      type: "conversion_gap",
      title: `Inquiry Conversion Gap (${conversionRatePct}% Checkout Rate)`,
      problemDescription: `Out of ${sessionsCount} shopper inquiries, only ${completedOrders} resulted in completed orders.`,
      impactScore: 80,
      evidenceScore: 75,
      urgencyScore: 70,
      actionabilityScore: 80,
      confidence: "medium",
      evidenceSnapshot: {
        metrics: {
          total_inquiries: sessionsCount,
          completed_orders: completedOrders,
          conversion_rate_pct: conversionRatePct,
        },
        analysisPeriod: "Current Active Window",
        sourceRecords: "Chat Simulator Sessions & Completed Orders",
      },
      expectedImpact: {
        potentialGainMmk: Math.round(sessionsCount * 0.1 * (metrics.current.aov || 10000)),
        assumptions: "Lifting inquiry-to-checkout conversion by 10 percentage points.",
      },
      recommendedAction: {
        actionType: "optimize_bot_replies",
        title: "Enable Instant Quick-Reply Buttons for Township & Payment",
        description: "Reduce customer drop-off by making township delivery and payment selection 1-tap.",
        requiresApproval: true,
      },
      warnings: quality.warnings,
      templateExplanation: {
        whyItMatters: "Shoppers are chatting with your bot but leaving before providing delivery addresses or payment slips.",
        actionRationale: "Simplifying the checkout sequence with interactive buttons removes mobile chat friction.",
        expectedOutcome: "Expected to double inquiry completion rates.",
        limitations: "Based on active simulated and live chat sessions.",
      },
    };
  }

  return null;
}
