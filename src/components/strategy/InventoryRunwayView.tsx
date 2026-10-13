import React from "react";
import { AlertTriangle, Clock, CheckCircle2, Box, ArrowRight } from "lucide-react";
import type { Product, Order } from "../../types";

interface InventoryRunwayViewProps {
  products: Product[];
  orders: Order[];
}

export const InventoryRunwayView: React.FC<InventoryRunwayViewProps> = ({ products, orders }) => {
  // Compute recent 7-day velocity per product
  const productVelocityMap: Record<string, number> = {};

  orders.forEach((o) => {
    if (o.status !== "cancelled") {
      (o.items || []).forEach((item) => {
        const id = item.productId || item.productName;
        productVelocityMap[id] = (productVelocityMap[id] || 0) + (item.quantity || 1);
      });
    }
  });

  const runwayData = products.map((p) => {
    const unitsSold7d = productVelocityMap[p.id] || 0;
    const dailyVelocity = unitsSold7d / 7;
    const leadTime = p.lead_time_days || 3;
    const safetyThreshold = p.safety_stock_threshold || 5;

    let runwayDays = 999;
    let urgency: "critical" | "warning" | "healthy" = "healthy";

    if (p.stock <= 0) {
      runwayDays = 0;
      urgency = "critical";
    } else if (dailyVelocity > 0) {
      runwayDays = Number((p.stock / dailyVelocity).toFixed(1));
      if (runwayDays <= leadTime * 1.5) {
        urgency = "critical";
      } else if (runwayDays <= leadTime * 3) {
        urgency = "warning";
      }
    } else if (p.stock <= safetyThreshold) {
      urgency = "warning";
      runwayDays = p.stock;
    }

    const recommendedReorder = Math.max(15, safetyThreshold * 3);

    return {
      product: p,
      stock: p.stock,
      dailyVelocity: Number(dailyVelocity.toFixed(1)),
      runwayDays,
      urgency,
      leadTime,
      safetyThreshold,
      recommendedReorder,
    };
  });

  // Sort critical first, then warning, then healthy
  runwayData.sort((a, b) => a.runwayDays - b.runwayDays);

  const criticalCount = runwayData.filter((r) => r.urgency === "critical").length;
  const warningCount = runwayData.filter((r) => r.urgency === "warning").length;
  const healthyCount = runwayData.filter((r) => r.urgency === "healthy").length;

  return (
    <div className="space-y-6 text-[#0A1B2A] animate-fadeIn">
      {/* 1. Inventory Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Critical Stockout Risk */}
        <div className="bg-white border border-rose-200/90 rounded-2xl p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-600" />
              Critical Stockout Risk
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {criticalCount} items
            </span>
          </div>
          <p className="font-mono font-bold text-2xl text-rose-900">{criticalCount} SKU(s)</p>
          <p className="text-[11px] text-slate-500">Stock runway lower than supplier replenishment window</p>
        </div>

        {/* Reorder Warning */}
        <div className="bg-white border border-amber-200/90 rounded-2xl p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={14} className="text-amber-600" />
              Reorder Attention
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {warningCount} items
            </span>
          </div>
          <p className="font-mono font-bold text-2xl text-amber-900">{warningCount} SKU(s)</p>
          <p className="text-[11px] text-slate-500">Runway between 3 and 7 days</p>
        </div>

        {/* Healthy Buffer */}
        <div className="bg-white border border-emerald-200/90 rounded-2xl p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Adequately Stocked
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {healthyCount} items
            </span>
          </div>
          <p className="font-mono font-bold text-2xl text-emerald-900">{healthyCount} SKU(s)</p>
          <p className="text-[11px] text-slate-500">Inventory coverage exceeds 7 days</p>
        </div>
      </div>

      {/* 2. Product Runway Depletion Grid */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h4 className="font-black text-base text-[#0A1B2A]">Product Stockout Countdown & Runway</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time days of inventory remaining based on trailing daily order pace.
            </p>
          </div>
          <Box size={17} className="text-[#0069FF]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {runwayData.map((item) => {
            const p = item.product;
            const badgeClass =
              item.urgency === "critical"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : item.urgency === "warning"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200";

            return (
              <div
                key={p.id}
                className="bg-[#FAF8F5] border border-slate-200/80 rounded-2xl p-4.5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{p.name}</h5>
                      <span className="text-[11px] font-mono text-slate-400">
                        {p.price?.toLocaleString()} MMK
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border ${badgeClass}`}>
                    {item.runwayDays === 0
                      ? "OUT OF STOCK"
                      : item.runwayDays > 100
                      ? "Stable"
                      : `${item.runwayDays} Days Runway`}
                  </span>
                </div>

                {/* Stock progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-500">
                    <span>Stock: {item.stock} units</span>
                    <span>Burn Rate: {item.dailyVelocity} units/day</span>
                  </div>
                  <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.urgency === "critical"
                          ? "bg-rose-500"
                          : item.urgency === "warning"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(5, (item.stock / (item.safetyThreshold * 4)) * 100))}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                  <span>Lead Time: {item.leadTime} days</span>
                  <span className="font-semibold text-slate-800">
                    Recommended Reorder: {item.recommendedReorder} units
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
