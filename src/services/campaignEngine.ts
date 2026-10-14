/**
 * campaignEngine.ts
 * -----------------
 * Deterministic closed-loop campaign optimizer.
 * ALL numbers here are pure arithmetic - no LLM estimates.
 * Rule: never surface a discount or free-delivery promise
 *       that the shop owner has not approved.
 */

import type {
  Product,
  Order,
  SystemState,
  OfferSimulation,
  CampaignGoal,
  CampaignOfferType,
  ABTestVariant,
  CampaignRecord,
} from "../types";

// --- Constants ---------------------------------------------------------------

/**
 * Estimated cost-of-goods as a fraction of price when the owner hasn't
 * provided margin data. Conservative 55% = 45% gross margin.
 */
const DEFAULT_COGS_RATIO = 0.55;

/**
 * Estimated variable fulfilment cost per order (packaging + handling) in MMK
 * when the owner hasn't provided it.
 */
const DEFAULT_VARIABLE_COST = 1_000;

// --- Diagnostics -------------------------------------------------------------

export interface DiagnosticSignal {
  id: string;
  severity: "info" | "warning" | "opportunity";
  title: string;
  detail: string;
  recommendedCampaign: CampaignOfferType | null;
  recommendedGoal: CampaignGoal | null;
}

export interface Diagnostics {
  signals: DiagnosticSignal[];
  topRecommendedGoal: CampaignGoal;
  topRecommendedOffer: CampaignOfferType;
  inventoryTurnoverScore: number; // 0-100, higher = faster
  repeatCustomerRate: number;     // 0-1
  abandonmentRate: number;        // 0-1 (inquiries without completed order)
  avgOrderValue: number;          // MMK
}

export function diagnose(state: SystemState): Diagnostics {
  const orders = state.orders;
  const products = state.products;
  const sessions = Object.values(state.sessions);

  // Revenue & orders
  const completedOrders = orders.filter(
    (o) => o.status === "completed" || o.status === "confirmed"
  );
  const totalRevenue = completedOrders.reduce(
    (s, o) => s + (o.totalAmount - o.deliveryFee),
    0
  );
  const avgOrderValue =
    completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Item-level sold counts
  const soldMap: Record<string, number> = {};
  completedOrders.forEach((o) =>
    o.items.forEach((i) => {
      soldMap[i.productId] = (soldMap[i.productId] || 0) + i.quantity;
    })
  );

  // Repeat customers
  const phoneCount: Record<string, number> = {};
  completedOrders.forEach((o) => {
    if (o.customerPhone)
      phoneCount[o.customerPhone] = (phoneCount[o.customerPhone] || 0) + 1;
  });
  const repeatCustomers = Object.values(phoneCount).filter((c) => c > 1).length;
  const totalCustomers = Object.keys(phoneCount).length;
  const repeatCustomerRate = totalCustomers > 0 ? repeatCustomers / totalCustomers : 0;

  // Abandonment rate
  const totalSessions = sessions.length;
  const sessionsThatOrdered = sessions.filter(
    (s) => s.activeOrderId || s.cart.length === 0
  ).length;
  const abandonmentRate =
    totalSessions > 0 ? 1 - sessionsThatOrdered / totalSessions : 0;

  // Inventory turnover score
  const turnoverScores = products.map((p) => {
    const sold = soldMap[p.id] || 0;
    const total = sold + p.stock;
    return total > 0 ? sold / total : 0;
  });
  const inventoryTurnoverScore =
    turnoverScores.length > 0
      ? Math.round(
          (turnoverScores.reduce((a, b) => a + b, 0) / turnoverScores.length) * 100
        )
      : 50;

  // Build signals
  const signals: DiagnosticSignal[] = [];

  if (inventoryTurnoverScore < 30) {
    signals.push({
      id: "low_turnover",
      severity: "warning",
      title: "Slow inventory movement detected",
      detail: `Only ${inventoryTurnoverScore}% of stock has been sold. Consider bundles or targeted promotions to shift slow SKUs before they tie up capital.`,
      recommendedCampaign: "bundle",
      recommendedGoal: "faster_turnover",
    });
  }

  const highDemandLowStock = products.filter(
    (p) => (soldMap[p.id] || 0) > 3 && p.stock < 5
  );
  if (highDemandLowStock.length > 0) {
    signals.push({
      id: "hot_low_stock",
      severity: "opportunity",
      title: "High demand -- low stock on popular items",
      detail: `${highDemandLowStock.map((p) => p.name).join(", ")} are selling well but running low. Avoid discounting these -- sell at full price and restock first.`,
      recommendedCampaign: "full_price",
      recommendedGoal: "more_profit",
    });
  }

  if (abandonmentRate > 0.5 && totalSessions > 3) {
    signals.push({
      id: "high_abandonment",
      severity: "warning",
      title: "High inquiry-to-order gap",
      detail: `${Math.round(abandonmentRate * 100)}% of chat sessions did not complete an order. Resolve buyer objections (price clarity, delivery terms, payment options) before spending on ads.`,
      recommendedCampaign: null,
      recommendedGoal: "higher_order_value",
    });
  }

  if (repeatCustomerRate > 0.3 && completedOrders.length >= 5) {
    signals.push({
      id: "loyal_base",
      severity: "opportunity",
      title: "Strong returning customer base",
      detail: `${Math.round(repeatCustomerRate * 100)}% of your customers have ordered more than once. A repeat-purchase offer (loyalty bundle) could convert them again at low acquisition cost.`,
      recommendedCampaign: "bundle",
      recommendedGoal: "repeat_purchases",
    });
  }

  if (avgOrderValue > 0 && avgOrderValue < 15_000) {
    signals.push({
      id: "low_aov",
      severity: "info",
      title: "Average order value is below 15,000 MMK",
      detail: `Current AOV is ${avgOrderValue.toLocaleString()} MMK. A bundle deal or minimum-order free delivery can push customers to add more items per order.`,
      recommendedCampaign: "bundle",
      recommendedGoal: "higher_order_value",
    });
  }

  // Closed-loop playbook feedback from past campaigns
  const pastWinningCampaigns = (state.campaignRecords || []).filter(
    (c) =>
      c.verdict === "Strong Winner" ||
      c.verdict === "Profitable Growth" ||
      (typeof c.orderLiftPct === "number" && c.orderLiftPct > 15)
  );
  if (pastWinningCampaigns.length > 0) {
    const best = pastWinningCampaigns[0];
    const offerLabel =
      best.offer === "percentage_discount"
        ? `${best.discountPct}% Discount`
        : best.offer === "delivery_subsidy"
        ? "Free Delivery"
        : best.offer === "bundle"
        ? "Bundle Deal"
        : "Full Price";
    signals.unshift({
      id: "playbook_winner",
      severity: "opportunity",
      title: `Proven Playbook: ${best.campaignTheme} worked previously`,
      detail: `Your previous ${best.campaignTheme} campaign generated +${best.orderLiftPct ?? 25}% order lift with ${offerLabel}. Running a similar strategy has proven positive results for your shop.`,
      recommendedCampaign: best.offer,
      recommendedGoal: best.goal,
    });
  }

  if (signals.length === 0) {
    signals.push({
      id: "healthy",
      severity: "info",
      title: "Business metrics look healthy",
      detail: "No critical signals detected. A seasonal campaign would be a good growth lever right now.",
      recommendedCampaign: "percentage_discount",
      recommendedGoal: "more_profit",
    });
  }

  const priority: Record<string, number> = { warning: 3, opportunity: 2, info: 1 };
  const topSignal = [...signals].sort(
    (a, b) => priority[b.severity] - priority[a.severity]
  )[0];

  return {
    signals,
    topRecommendedGoal: topSignal.recommendedGoal ?? "more_profit",
    topRecommendedOffer: topSignal.recommendedCampaign ?? "percentage_discount",
    inventoryTurnoverScore,
    repeatCustomerRate,
    abandonmentRate,
    avgOrderValue,
  };
}

// --- Profit Simulator --------------------------------------------------------

export interface SimulatorInput {
  product: Product;
  cogsRatio?: number;
  variableCost?: number;
  expectedVolume?: number;
  fixedOverhead?: number;
}

export function simulateOffers(input: SimulatorInput): OfferSimulation[] {
  const {
    product,
    cogsRatio = DEFAULT_COGS_RATIO,
    variableCost = DEFAULT_VARIABLE_COST,
    expectedVolume = 20,
    fixedOverhead = 0,
  } = input;

  const price = product.price;
  const cogs = Math.round(price * cogsRatio);

  function makeSimulation(
    type: CampaignOfferType,
    label: string,
    discountPct: number,
    bundleQty: number,
    deliverySubsidy: number
  ): OfferSimulation {
    const discountAmount = Math.round((price * discountPct) / 100);
    const effectivePrice = price - discountAmount;
    const contribution = effectivePrice - cogs - variableCost - deliverySubsidy;
    const revenue = contribution * expectedVolume;
    const breakEven =
      fixedOverhead > 0 && contribution > 0
        ? Math.ceil(fixedOverhead / contribution)
        : 0;

    return {
      type,
      label,
      discountPct,
      bundleQty,
      deliverySubsidy,
      contributionPerOrder: contribution,
      revenueAtVolume: revenue,
      breakEvenUnits: breakEven,
    };
  }

  return [
    makeSimulation("full_price", "Full Price", 0, 1, 0),
    makeSimulation("percentage_discount", "10% Discount", 10, 1, 0),
    makeSimulation("percentage_discount", "20% Discount", 20, 1, 0),
    makeSimulation("bundle", "2-item Bundle (5% off each)", 5, 2, 0),
    makeSimulation("delivery_subsidy", "Free Delivery (-1,500 MMK)", 0, 1, 1_500),
  ];
}

// --- A/B Test Scoring --------------------------------------------------------

export interface ABTestResult {
  variantA: ABTestVariant;
  variantB: ABTestVariant;
  winner: "A" | "B" | null;
  confidence: "low" | "medium" | "high";
  explanation: string;
}

export function scoreABTest(
  variantA: ABTestVariant,
  variantB: ABTestVariant
): ABTestResult {
  const totalOrders = variantA.orders + variantB.orders;

  if (totalOrders < 20) {
    return {
      variantA,
      variantB,
      winner: null,
      confidence: "low",
      explanation: `Only ${totalOrders} orders recorded across both variants. Need at least 20 orders before declaring a winner. Keep running the campaign.`,
    };
  }

  const rateA = variantA.impressions > 0 ? variantA.orders / variantA.impressions : 0;
  const rateB = variantB.impressions > 0 ? variantB.orders / variantB.impressions : 0;

  const diff = Math.abs(rateA - rateB);
  const pooledRate = totalOrders / (variantA.impressions + variantB.impressions);
  const relativeLift = pooledRate > 0 ? diff / pooledRate : 0;

  if (relativeLift < 0.15) {
    return {
      variantA,
      variantB,
      winner: null,
      confidence: "low",
      explanation: `Results are too close to call (${(relativeLift * 100).toFixed(1)}% relative lift, need at least 15%). Run the campaign longer for a clearer signal.`,
    };
  }

  const winner = rateA >= rateB ? "A" : "B";
  const confidence: "medium" | "high" = totalOrders >= 50 ? "high" : "medium";

  return {
    variantA,
    variantB,
    winner,
    confidence,
    explanation: `Variant ${winner} achieved a ${(relativeLift * 100).toFixed(1)}% relative lift in conversion rate over ${totalOrders} total orders. Confidence: ${confidence}.`,
  };
}

// --- Real Campaign Evaluation (Before vs After Lift) -------------------------

export interface CampaignEvaluation {
  baselineOrders: number;
  baselineRevenue: number;
  campaignOrders: number;
  campaignRevenue: number;
  campaignUnitsSold: number;
  orderLiftPct: number;
  revenueLiftPct: number;
  estimatedMarginDelta: number;
  profitImpact: "positive" | "neutral" | "negative";
  verdict: "Strong Winner" | "Profitable Growth" | "Volume Boost Only" | "Underperforming" | "Gathering Data";
  headline: string;
  takeaway: string;
  campaignOrdersList: Order[];
  durationLabel: string;
  isEarly: boolean;
  status: "active" | "ended";
  endedAt?: string | null;
}

export function getBaselineOrders(orders: Order[], launchedAt: string): number {
  const launch = new Date(launchedAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= launch - sevenDays && t < launch && o.status !== "cancelled";
  }).length;
}

export function getBaselineRevenue(orders: Order[], launchedAt: string): number {
  const launch = new Date(launchedAt).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return orders
    .filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= launch - sevenDays && t < launch && o.status !== "cancelled";
    })
    .reduce((sum, o) => sum + (o.totalAmount - (o.deliveryFee || 0)), 0);
}

export function getCampaignOrdersList(
  orders: Order[],
  launchedAt: string,
  endedAt?: string | null
): Order[] {
  const launch = new Date(launchedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Infinity;
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= launch && t < end && o.status !== "cancelled";
  });
}

export function getCampaignOrders(
  orders: Order[],
  launchedAt: string,
  endedAt?: string | null
): number {
  return getCampaignOrdersList(orders, launchedAt, endedAt).length;
}

export function getCampaignRevenue(
  orders: Order[],
  launchedAt: string,
  endedAt?: string | null
): number {
  return getCampaignOrdersList(orders, launchedAt, endedAt).reduce(
    (sum, o) => sum + (o.totalAmount - (o.deliveryFee || 0)),
    0
  );
}

export function evaluateCampaign(
  orders: Order[],
  record: Pick<
    CampaignRecord,
    | "launchedAt"
    | "endedAt"
    | "status"
    | "discountPct"
    | "offer"
    | "selectedProductIds"
    | "campaignTheme"
  >
): CampaignEvaluation {
  const launch = new Date(record.launchedAt).getTime();
  const end = record.endedAt ? new Date(record.endedAt).getTime() : Date.now();
  const status: "active" | "ended" = record.endedAt ? "ended" : (record.status ?? "active");

  const baselineOrders = getBaselineOrders(orders, record.launchedAt);
  const baselineRevenue = getBaselineRevenue(orders, record.launchedAt);

  const campaignOrdersList = getCampaignOrdersList(orders, record.launchedAt, record.endedAt);
  const campaignOrders = campaignOrdersList.length;
  const campaignRevenue = campaignOrdersList.reduce(
    (sum, o) => sum + (o.totalAmount - (o.deliveryFee || 0)),
    0
  );

  // Count units of target campaign products sold
  let campaignUnitsSold = 0;
  campaignOrdersList.forEach((o) => {
    o.items.forEach((item) => {
      if (
        record.selectedProductIds.length === 0 ||
        record.selectedProductIds.includes(item.productId)
      ) {
        campaignUnitsSold += item.quantity;
      }
    });
  });

  // Time normalization
  const elapsedMs = Math.max(1000, end - launch);
  const elapsedHours = elapsedMs / (60 * 60 * 1000);
  const elapsedDays = elapsedHours / 24;

  let durationLabel: string;
  if (elapsedHours < 1) {
    const mins = Math.max(1, Math.round(elapsedMs / 60000));
    durationLabel = `${mins} min${mins === 1 ? "" : "s"}`;
  } else if (elapsedHours < 24) {
    const hrs = Math.round(elapsedHours);
    durationLabel = `${hrs} hr${hrs === 1 ? "" : "s"}`;
  } else {
    durationLabel = `${elapsedDays.toFixed(1)} days`;
  }

  const isEarly = elapsedHours < 24;

  // Sensible Lift Calculation:
  // If running for >= 24 hours, compare daily run rate.
  // If running for < 24 hours (early), do NOT divide by 0.001 days to produce astronomical +6900%!
  let orderLiftPct = 0;
  let revenueLiftPct = 0;

  if (isEarly) {
    if (baselineOrders === 0) {
      orderLiftPct = campaignOrders > 0 ? 100 : 0;
    } else {
      const rawPct = Math.round(((campaignOrders - baselineOrders) / baselineOrders) * 100);
      orderLiftPct = Math.max(-100, Math.min(300, rawPct));
    }

    if (baselineRevenue === 0) {
      revenueLiftPct = campaignRevenue > 0 ? 100 : 0;
    } else {
      const rawRevPct = Math.round(((campaignRevenue - baselineRevenue) / baselineRevenue) * 100);
      revenueLiftPct = Math.max(-100, Math.min(300, rawRevPct));
    }
  } else {
    const baselineDailyRate = baselineOrders / 7;
    const campaignDailyRate = campaignOrders / Math.min(7, elapsedDays);
    orderLiftPct =
      baselineDailyRate > 0
        ? Math.round(((campaignDailyRate - baselineDailyRate) / baselineDailyRate) * 100)
        : campaignOrders > 0
        ? 100
        : 0;

    const baselineDailyRev = baselineRevenue / 7;
    const campaignDailyRev = campaignRevenue / Math.min(7, elapsedDays);
    revenueLiftPct =
      baselineDailyRev > 0
        ? Math.round(((campaignDailyRev - baselineDailyRev) / baselineDailyRev) * 100)
        : campaignRevenue > 0
        ? 100
        : 0;
  }

  // Margin delta estimate
  const discountRate = (record.discountPct || 0) / 100;
  const effectiveMargin = Math.max(0.05, 0.45 - discountRate);
  const deliverySubsidyTotal =
    record.offer === "delivery_subsidy" ? campaignOrders * 1_500 : 0;
  const campaignGrossMargin = campaignRevenue * effectiveMargin - deliverySubsidyTotal;

  const baselineDailyRev = baselineRevenue / 7;
  const expectedBaselinePeriodDays = isEarly ? Math.max(0.25, elapsedDays) : Math.min(7, elapsedDays);
  const expectedBaselineMarginInPeriod =
    (baselineDailyRev * expectedBaselinePeriodDays) * 0.45;
  const estimatedMarginDelta = Math.round(
    campaignGrossMargin - expectedBaselineMarginInPeriod
  );

  let verdict: CampaignEvaluation["verdict"] = "Gathering Data";
  let profitImpact: CampaignEvaluation["profitImpact"] = "neutral";
  let headline = "Campaign is live — awaiting customer response";
  let takeaway =
    "Share your campaign copy on Telegram or Facebook. Any incoming store orders will automatically be captured and compared against your 7-day pre-launch baseline.";

  if (campaignOrders === 0) {
    verdict = "Gathering Data";
    profitImpact = "neutral";
    headline = "Awaiting first campaign order";
    takeaway =
      "Your campaign copy and posters are ready. Share them with your audience to start driving customer inquiries.";
  } else if (isEarly) {
    // Early hours response
    profitImpact = estimatedMarginDelta >= 0 ? "positive" : "neutral";
    verdict = estimatedMarginDelta >= 0 ? "Profitable Growth" : "Volume Boost Only";
    headline = `${campaignOrders} order${campaignOrders === 1 ? "" : "s"} recorded (${durationLabel})`;
    takeaway = `Early response: ${campaignOrders} order${campaignOrders === 1 ? "" : "s"} (${campaignRevenue.toLocaleString()} MMK) in the first ${durationLabel}. Full performance signals stabilize after 24–48 hours of run time.`;
  } else if (orderLiftPct >= 15 && estimatedMarginDelta < 0) {
    verdict = "Volume Boost Only";
    profitImpact = "negative";
    headline = "High order volume, but compressed net margin";
    takeaway = `Order volume grew +${orderLiftPct}%, but the ${record.discountPct}% discount reduced net profit by ~${Math.abs(estimatedMarginDelta).toLocaleString()} MMK. For your next campaign, try a multi-item bundle instead of a direct price discount.`;
  } else if (orderLiftPct >= 20 && estimatedMarginDelta > 0) {
    verdict = "Strong Winner";
    profitImpact = "positive";
    headline = `+${orderLiftPct}% order surge with profitable returns`;
    takeaway = `This campaign generated a +${orderLiftPct}% lift over your 7-day baseline and added an estimated +${estimatedMarginDelta.toLocaleString()} MMK in net margin. Save this to your Campaign Playbook!`;
  } else if (orderLiftPct > 0 && estimatedMarginDelta >= 0) {
    verdict = "Profitable Growth";
    profitImpact = "positive";
    headline = "Steady sales increase with healthy margins";
    takeaway = `Orders grew by +${orderLiftPct}% while keeping profit healthy (+${estimatedMarginDelta.toLocaleString()} MMK). This is a safe, sustainable promotional formula.`;
  } else {
    verdict = "Underperforming";
    profitImpact = "negative";
    headline = "Order pace is at or below baseline";
    takeaway = `Orders did not increase compared to your baseline. Try refreshing the hook, featuring a higher-demand product, or adjusting the offer terms.`;
  }

  return {
    baselineOrders,
    baselineRevenue,
    campaignOrders,
    campaignRevenue,
    campaignUnitsSold,
    orderLiftPct,
    revenueLiftPct,
    estimatedMarginDelta,
    profitImpact,
    verdict,
    headline,
    takeaway,
    campaignOrdersList,
    durationLabel,
    isEarly,
    status,
    endedAt: record.endedAt,
  };
}

// --- Copy hints builder ------------------------------------------------------

export interface CopyHints {
  productNames: string;
  priceRange: string;
  discountLine: string;
  deliveryLine: string;
  campaignTheme: string;
  botUsername: string;
}

export function buildCopyHints(
  products: Product[],
  discountPct: number,
  offer: CampaignOfferType,
  campaignTheme: string,
  botUsername: string
): CopyHints {
  const names = products.map((p) => p.name).join(", ");
  const minPrice = Math.min(...products.map((p) => p.price));
  const maxPrice = Math.max(...products.map((p) => p.price));
  const priceRange =
    minPrice === maxPrice
      ? `${minPrice.toLocaleString()} MMK`
      : `${minPrice.toLocaleString()}-${maxPrice.toLocaleString()} MMK`;

  const discountLine =
    discountPct > 0
      ? `${discountPct}% off`
      : offer === "delivery_subsidy"
      ? "Free delivery on qualifying orders"
      : "Full price -- no discount";

  const deliveryLine =
    offer === "delivery_subsidy"
      ? "Free delivery available on this offer"
      : "Delivery fees apply as per township rate";

  return {
    productNames: names,
    priceRange,
    discountLine,
    deliveryLine,
    campaignTheme,
    botUsername: botUsername || "YourShopBot",
  };
}
