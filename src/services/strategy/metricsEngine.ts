import type { Order, Product } from "../../types";
import type { BusinessMetrics, PeriodSlice } from "./types";

/**
 * Deterministically computes period-based store metrics without LLM interference.
 * Complies with Section FR-01 and FR-04 of docs/AI_Strategy_Feature.md.
 */
export function calculateBusinessMetrics(
  orders: Order[],
  _products: Product[],
  windowDays: number = 7,
  referenceDate: Date = new Date()
): BusinessMetrics {
  const currentEnd = new Date(referenceDate);
  const currentStart = new Date(referenceDate);
  currentStart.setDate(currentStart.getDate() - windowDays);

  const previousEnd = new Date(currentStart);
  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - windowDays);

  const currentSlice = slicePeriod(orders, currentStart, currentEnd);
  const previousSlice = slicePeriod(orders, previousStart, previousEnd);

  // If historical period has zero orders but we have enough total orders,
  // split available orders into two halves to allow meaningful comparison
  if (previousSlice.totalOrders === 0 && orders.length >= 4) {
    const sorted = [...orders].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const mid = Math.ceil(sorted.length / 2);
    const recentOrders = sorted.slice(0, mid);
    const olderOrders = sorted.slice(mid);

    const adjustedCurrent = computeSliceMetrics(
      recentOrders,
      currentStart,
      currentEnd
    );
    const adjustedPrevious = computeSliceMetrics(
      olderOrders,
      previousStart,
      previousEnd
    );

    return {
      current: adjustedCurrent,
      previous: adjustedPrevious,
      changes: computeChanges(adjustedCurrent, adjustedPrevious),
    };
  }

  return {
    current: currentSlice,
    previous: previousSlice,
    changes: computeChanges(currentSlice, previousSlice),
  };
}

function slicePeriod(orders: Order[], start: Date, end: Date): PeriodSlice {
  const matching = orders.filter((o) => {
    const d = new Date(o.createdAt || Date.now());
    return d >= start && d <= end;
  });

  return computeSliceMetrics(matching, start, end);
}

function computeSliceMetrics(orders: Order[], start: Date, end: Date): PeriodSlice {
  let revenue = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let totalUnitsSold = 0;
  const productVelocities: Record<string, { unitsSold: number; revenue: number }> = {};

  orders.forEach((o) => {
    if (o.status === "cancelled") {
      cancelledOrders += 1;
    } else {
      completedOrders += 1;
      const netAmount = Math.max(0, (o.totalAmount || 0) - (o.deliveryFee || 0));
      revenue += netAmount;

      (o.items || []).forEach((item) => {
        totalUnitsSold += item.quantity || 1;
        const key = item.productId || item.productName;
        if (!productVelocities[key]) {
          productVelocities[key] = { unitsSold: 0, revenue: 0 };
        }
        productVelocities[key].unitsSold += item.quantity || 1;
        productVelocities[key].revenue += (item.price || 0) * (item.quantity || 1);
      });
    }
  });

  const totalOrders = orders.length;
  const aov = completedOrders > 0 ? Math.round(revenue / completedOrders) : 0;
  const cancellationRate = totalOrders > 0 ? cancelledOrders / totalOrders : 0;

  return {
    startDate: start,
    endDate: end,
    orders,
    revenue,
    completedOrders,
    cancelledOrders,
    totalOrders,
    aov,
    cancellationRate,
    totalUnitsSold,
    productVelocities,
  };
}

function computeChanges(curr: PeriodSlice, prev: PeriodSlice) {
  return {
    revenuePct:
      prev.revenue > 0
        ? Number((((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1))
        : null,
    ordersPct:
      prev.completedOrders > 0
        ? Number(
            (
              ((curr.completedOrders - prev.completedOrders) /
                prev.completedOrders) *
              100
            ).toFixed(1)
          )
        : null,
    aovPct:
      prev.aov > 0
        ? Number((((curr.aov - prev.aov) / prev.aov) * 100).toFixed(1))
        : null,
    cancellationRatePct:
      prev.cancellationRate > 0
        ? Number(
            (
              ((curr.cancellationRate - prev.cancellationRate) /
                prev.cancellationRate) *
              100
            ).toFixed(1)
          )
        : curr.cancellationRate > 0
        ? 100
        : 0,
  };
}
