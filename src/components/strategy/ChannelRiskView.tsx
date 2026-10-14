import React from "react";
import { CreditCard, Truck, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import type { Order } from "../../types";

interface ChannelRiskViewProps {
  orders: Order[];
}

export const ChannelRiskView: React.FC<ChannelRiskViewProps> = ({ orders }) => {
  // Aggregate payment methods
  const paymentStats: Record<string, { total: number; completed: number; cancelled: number; volume: number }> = {};
  const townshipStats: Record<string, { count: number; volume: number; deliveryFees: number }> = {};

  let totalCodOrders = 0;
  let cancelledCodOrders = 0;
  let totalPrepayOrders = 0;
  let cancelledPrepayOrders = 0;

  orders.forEach((o) => {
    // Payment method grouping
    const method =
      o.paymentDetails?.method || (o.paymentMethod === "cod" ? "CoD" : "Prepay");
    if (!paymentStats[method]) {
      paymentStats[method] = { total: 0, completed: 0, cancelled: 0, volume: 0 };
    }
    paymentStats[method].total += 1;
    paymentStats[method].volume += o.totalAmount || 0;

    if (o.status === "cancelled") {
      paymentStats[method].cancelled += 1;
    } else {
      paymentStats[method].completed += 1;
    }

    if (o.paymentMethod === "cod") {
      totalCodOrders += 1;
      if (o.status === "cancelled") cancelledCodOrders += 1;
    } else {
      totalPrepayOrders += 1;
      if (o.status === "cancelled") cancelledPrepayOrders += 1;
    }

    // Township grouping
    const township = o.township || "Yangon (General)";
    if (!townshipStats[township]) {
      townshipStats[township] = { count: 0, volume: 0, deliveryFees: 0 };
    }
    townshipStats[township].count += 1;
    townshipStats[township].volume += o.totalAmount || 0;
    townshipStats[township].deliveryFees += o.deliveryFee || 0;
  });

  const codCancellationRate =
    totalCodOrders > 0 ? Math.round((cancelledCodOrders / totalCodOrders) * 100) : 0;
  const prepayCancellationRate =
    totalPrepayOrders > 0 ? Math.round((cancelledPrepayOrders / totalPrepayOrders) * 100) : 0;

  const sortedTownships = Object.entries(townshipStats)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 text-[#0A1B2A] animate-fadeIn">
      {/* 1. Payment Method Risk Comparison Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COD Risk Card */}
        <div className="bg-white border border-rose-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-rose-600" />
              Cash on Delivery (COD) Risk
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {codCancellationRate}% cancelled
            </span>
          </div>
          <p className="font-mono font-bold text-xl text-[#0A1B2A]">
            {cancelledCodOrders} of {totalCodOrders} orders cancelled
          </p>
          <p className="text-[11px] text-slate-500">
            Unverified delivery dispatch results in higher return courier fees and uncollected items.
          </p>
        </div>

        {/* Prepayment Verification Card */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              Mobile Wallet Prepayment
            </span>
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {prepayCancellationRate}% cancelled
            </span>
          </div>
          <p className="font-mono font-bold text-xl text-emerald-900">
            {cancelledPrepayOrders} of {totalPrepayOrders} orders cancelled
          </p>
          <p className="text-[11px] text-slate-500">
            Orders backed by KPay, WavePay, or AYA Pay slip verification convert with near-zero friction.
          </p>
        </div>
      </div>

      {/* 2. Payment Channel Volume Breakdown */}
      <div className="bg-white border border-[#E2E8F0] rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h4 className="font-black text-base text-[#0A1B2A]">Payment Channel Distribution</h4>
            <p className="text-xs text-[#64748B] mt-0.5">
              Breakdown of transaction volume and success rates by payment provider.
            </p>
          </div>
          <CreditCard size={17} className="text-[#0069FF]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(paymentStats).map(([method, data]) => {
            const successRate =
              data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

            return (
              <div key={method} className="bg-[#FAF8F5] border border-slate-200/70 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase">{method}</span>
                <p className="font-mono font-bold text-lg text-[#0A1B2A]">{data.total} orders</p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Success: {successRate}%</span>
                  <span className="text-[#0A1B2A] font-semibold">{data.volume.toLocaleString()} MMK</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Township Logistics & Delivery Demand Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[32px] p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h4 className="font-black text-base text-[#0A1B2A]">Township Logistics & Geographic Demand</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Courier destination concentration across Yangon and regional delivery zones.
            </p>
          </div>
          <Truck size={17} className="text-slate-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Township</th>
                <th className="py-2.5 px-3 text-right">Orders</th>
                <th className="py-2.5 px-3 text-right">Total Net Sales</th>
                <th className="py-2.5 px-3 text-right">Avg Delivery Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTownships.map((township) => {
                const avgFee = township.count > 0 ? Math.round(township.deliveryFees / township.count) : 0;

                return (
                  <tr key={township.name} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0069FF]"></span>
                      {township.name}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {township.count} orders
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[#0A1B2A]">
                      {township.volume.toLocaleString()} MMK
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {avgFee.toLocaleString()} MMK
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
