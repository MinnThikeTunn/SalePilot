import React from "react";
import { TrendingUp, DollarSign, Percent } from "lucide-react";
import type { Product, Order } from "../../types";

interface UnitEconomicsViewProps {
  products: Product[];
  orders: Order[];
}

export const UnitEconomicsView: React.FC<UnitEconomicsViewProps> = ({ products, orders }) => {
  // Compute unit sales per product from completed/confirmed orders
  const productSalesMap: Record<string, { unitsSold: number; totalRevenue: number }> = {};
  let totalGrossRevenue = 0;
  let totalCogs = 0;

  orders.forEach((o) => {
    if (o.status !== "cancelled") {
      (o.items || []).forEach((item) => {
        const id = item.productId || item.productName;
        if (!productSalesMap[id]) {
          productSalesMap[id] = { unitsSold: 0, totalRevenue: 0 };
        }
        const qty = item.quantity || 1;
        const rev = (item.price || 0) * qty;
        productSalesMap[id].unitsSold += qty;
        productSalesMap[id].totalRevenue += rev;
      });
    }
  });

  // Calculate profitability metrics per product
  const productEconomics = products.map((p) => {
    const cost = p.cost_price || 0;
    const price = p.price || 0;
    const unitMarginMmk = price - cost;
    const grossMarginPct = price > 0 ? Math.round((unitMarginMmk / price) * 100) : 0;
    const sales = productSalesMap[p.id] || { unitsSold: 0, totalRevenue: 0 };
    const totalProfitGenerated = sales.unitsSold * unitMarginMmk;

    if (sales.unitsSold > 0) {
      totalGrossRevenue += sales.totalRevenue;
      totalCogs += sales.unitsSold * cost;
    }

    return {
      product: p,
      cost,
      price,
      unitMarginMmk,
      grossMarginPct,
      unitsSold: sales.unitsSold,
      totalRevenue: sales.totalRevenue,
      totalProfitGenerated,
    };
  });

  // Sort by total profit generated descending
  productEconomics.sort((a, b) => b.totalProfitGenerated - a.totalProfitGenerated);

  const storewideMarginPct =
    totalGrossRevenue > 0
      ? Math.round(((totalGrossRevenue - totalCogs) / totalGrossRevenue) * 100)
      : 0;

  const totalStoreProfit = totalGrossRevenue - totalCogs;

  return (
    <div className="space-y-6 text-[#0A1B2A] animate-fadeIn">
      {/* 1. Header & Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weighted Store Gross Margin */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Store Gross Margin</span>
            <Percent size={15} className="text-[#0069FF]" />
          </div>
          <p className="font-mono font-bold text-2xl text-[#0A1B2A]">{storewideMarginPct}%</p>
          <p className="text-[11px] text-slate-400">Weighted across completed orders</p>
        </div>

        {/* Total Net Contribution Profit */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Contribution Profit</span>
            <DollarSign size={15} className="text-emerald-600" />
          </div>
          <p className="font-mono font-bold text-2xl text-emerald-800">
            {totalStoreProfit.toLocaleString()} MMK
          </p>
          <p className="text-[11px] text-slate-400">Total gross earnings after wholesale COGS</p>
        </div>

        {/* COGS Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Wholesale Cost Total</span>
            <TrendingUp size={15} className="text-slate-500" />
          </div>
          <p className="font-mono font-bold text-2xl text-[#0A1B2A]">{totalCogs.toLocaleString()} MMK</p>
          <p className="text-[11px] text-slate-400">Direct purchasing/manufacturing cost</p>
        </div>
      </div>

      {/* 2. Product Margin & Profitability Matrix Table */}
      <div className="bg-white border border-slate-200/80 rounded-[28px] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h4 className="font-black text-base text-[#0A1B2A]">Product Unit Margin Leaderboard</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual product economics ranked by contribution profit generated.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">
            {products.length} catalog items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Product</th>
                <th className="py-2.5 px-3 text-right">Retail Price</th>
                <th className="py-2.5 px-3 text-right">Unit COGS</th>
                <th className="py-2.5 px-3 text-right">Unit Margin</th>
                <th className="py-2.5 px-3 text-center">Gross Margin %</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-right">Total Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productEconomics.map((item) => {
                const p = item.product;
                const marginColor =
                  item.grossMarginPct >= 35
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : item.grossMarginPct >= 20
                    ? "bg-slate-100 text-slate-700 border-slate-200"
                    : "bg-rose-50 text-rose-700 border-rose-200";

                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-bold text-slate-400">
                            {p.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <span className="block font-medium text-slate-900">{p.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {p.category || "General"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {item.price.toLocaleString()} MMK
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {item.cost > 0 ? `${item.cost.toLocaleString()} MMK` : "Not set"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {item.unitMarginMmk.toLocaleString()} MMK
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold border ${marginColor}`}
                      >
                        {item.grossMarginPct}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {item.unitsSold} units
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                      {item.totalProfitGenerated.toLocaleString()} MMK
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
