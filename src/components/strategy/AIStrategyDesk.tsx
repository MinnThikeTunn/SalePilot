import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  CreditCard,
  Box,
  Truck,
  Percent,
  ShoppingBag,
} from "lucide-react";
import type {
  Product,
  Order,
  SalesOpportunity,
  AnalyticsRun,
  OpportunityOutcome,
  LifecycleStatus,
} from "../../types";
import { runStrategyAnalysis, updateOpportunityStatus, recordOpportunityOutcome } from "../../services/strategy/strategyService";
import { DataQualityBanner } from "./DataQualityBanner";
import { OpportunityCard } from "./OpportunityCard";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { OutcomeModal } from "./OutcomeModal";
import { CustomChart } from "../CustomChart";
import { UnitEconomicsView } from "./UnitEconomicsView";
import { ChannelRiskView } from "./ChannelRiskView";
import { InventoryRunwayView } from "./InventoryRunwayView";

type AnalyticsTab = "decisions" | "economics" | "channels" | "inventory";

interface AIStrategyDeskProps {
  shopId: string;
  ownerId: string;
  products: Product[];
  orders: Order[];
  sessionsCount?: number;
  geminiApiKey?: string;
  weekdaysChartData: { label: string; value: number }[];
  onExportCsv?: () => void;
}

export const AIStrategyDesk: React.FC<AIStrategyDeskProps> = ({
  shopId,
  ownerId,
  products,
  orders,
  sessionsCount = 0,
  geminiApiKey,
  weekdaysChartData,
  onExportCsv,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("decisions");
  const [analyticsRun, setAnalyticsRun] = useState<AnalyticsRun | null>(null);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [topPriority, setTopPriority] = useState<SalesOpportunity | null>(null);
  const [outcomes, setOutcomes] = useState<OpportunityOutcome[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | LifecycleStatus>("all");
  const [selectedEvidenceOpp, setSelectedEvidenceOpp] = useState<SalesOpportunity | null>(null);
  const [completeModalOpp, setCompleteModalOpp] = useState<SalesOpportunity | null>(null);

  // 1. Daily completed order counts matching weekdays (Mon..Sun)
  const weekdayOrdersChartData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };
    orders
      .filter((o) => o.status === "confirmed" || o.status === "completed")
      .forEach((o) => {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          const dayIdx = (d.getDay() + 6) % 7;
          counts[days[dayIdx]] = (counts[days[dayIdx]] || 0) + 1;
        }
      });
    return days.map((label) => ({ label, value: counts[label] || 0 }));
  }, [orders]);

  // 2. Payment Channel Share & Risk breakdown
  const paymentChannelStats = useMemo(() => {
    const stats: Record<string, { total: number; volume: number; cancelled: number }> = {};
    let totalVol = 0;
    orders.forEach((o) => {
      const raw = (o.paymentMethod || "cod").toLowerCase();
      const method = raw.includes("kpay") || raw.includes("kbz")
        ? "KBZPay"
        : raw.includes("wave")
        ? "WavePay"
        : raw.includes("aya")
        ? "AYA Pay"
        : raw.includes("cb")
        ? "CBPay"
        : raw.includes("prepay")
        ? "Prepay Mobile"
        : "Cash on Delivery";
      if (!stats[method]) {
        stats[method] = { total: 0, volume: 0, cancelled: 0 };
      }
      stats[method].total += 1;
      if (o.status !== "cancelled") {
        const net = Math.max(0, o.totalAmount - (o.deliveryFee || 0));
        stats[method].volume += net;
        totalVol += net;
      } else {
        stats[method].cancelled += 1;
      }
    });

    const channels = Object.entries(stats).map(([name, data]) => ({
      name,
      ...data,
      pctOfVolume: totalVol > 0 ? Math.round((data.volume / totalVol) * 100) : 0,
      cancellationRate: data.total > 0 ? Math.round((data.cancelled / data.total) * 100) : 0,
    })).sort((a, b) => b.volume - a.volume);

    return { channels, totalVol };
  }, [orders]);

  // 3. Top Product Sales Velocity
  const topProductsStats = useMemo(() => {
    const map: Record<string, { name: string; units: number; revenue: number; stock: number }> = {};
    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const id = item.productId || item.productName;
          if (!map[id]) {
            const prod = products.find((p) => p.id === id || p.name === item.productName);
            map[id] = {
              name: item.productName || prod?.name || "Product",
              units: 0,
              revenue: 0,
              stock: prod?.stock ?? 0,
            };
          }
          const qty = item.quantity || 1;
          map[id].units += qty;
          map[id].revenue += (item.price || 0) * qty;
        });
      });
    const items = Object.values(map).sort((a, b) => b.units - a.units);
    const maxUnits = items[0]?.units || 1;
    return { items: items.slice(0, 4), maxUnits };
  }, [orders, products]);

  // 4. Unit Economics & Contribution Profit
  const economicsStats = useMemo(() => {
    let grossRev = 0;
    let totalCogs = 0;
    orders
      .filter((o) => o.status !== "cancelled")
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
          const qty = item.quantity || 1;
          const price = item.price || prod?.price || 0;
          const cost = prod?.cost_price || Math.round(price * 0.58);
          grossRev += price * qty;
          totalCogs += cost * qty;
        });
      });
    const grossProfit = Math.max(0, grossRev - totalCogs);
    const marginPct = grossRev > 0 ? Math.round((grossProfit / grossRev) * 100) : 0;
    return { grossRev, totalCogs, grossProfit, marginPct };
  }, [orders, products]);

  // 5. Township Logistics & Geographic Concentration
  const townshipStats = useMemo(() => {
    const map: Record<string, { count: number; volume: number; avgFee: number }> = {};
    let totalCount = 0;
    orders.forEach((o) => {
      const rawTownship = (o.township || "Downtown Yangon").trim();
      if (!map[rawTownship]) {
        map[rawTownship] = { count: 0, volume: 0, avgFee: 0 };
      }
      map[rawTownship].count += 1;
      map[rawTownship].volume += o.totalAmount || 0;
      map[rawTownship].avgFee += o.deliveryFee || 0;
      totalCount += 1;
    });
    const list = Object.entries(map).map(([name, data]) => ({
      name,
      count: data.count,
      volume: data.volume,
      avgFee: Math.round(data.avgFee / (data.count || 1)),
      pctShare: totalCount > 0 ? Math.round((data.count / totalCount) * 100) : 0,
    })).sort((a, b) => b.count - a.count);
    return { list: list.slice(0, 4), totalCount };
  }, [orders]);

  // Run analysis on mount or when orders/products change
  const executeAnalysis = async (isManual = false) => {
    setLoading(true);
    try {
      const result = await runStrategyAnalysis(
        shopId || "default_shop",
        ownerId || "default_owner",
        products,
        orders,
        sessionsCount,
        geminiApiKey
      );
      setAnalyticsRun(result.run);
      setOpportunities(result.opportunities);
      setTopPriority(result.topPriority);
      setOutcomes(result.outcomes);
    } catch (err) {
      console.error("Failed to run AI Strategy Desk analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeAnalysis();
  }, [shopId, ownerId, orders.length, products.length]);

  // Handle status update
  const handleUpdateStatus = async (id: string, status: LifecycleStatus, reason?: string) => {
    const success = await updateOpportunityStatus(id, status, reason);
    if (success) {
      setOpportunities((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status, dismissed_reason: reason } : o))
      );
      if (topPriority?.id === id) {
        setTopPriority((prev) => (prev ? { ...prev, status, dismissed_reason: reason } : null));
      }
    }
  };

  // Handle outcome recording
  const handleRecordOutcome = async (
    opportunity: SalesOpportunity,
    notes: string,
    observationDays: number
  ) => {
    const recorded = await recordOpportunityOutcome(opportunity, notes, observationDays);
    if (recorded) {
      setOutcomes((prev) => [recorded, ...prev]);
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opportunity.id ? { ...o, status: "completed" } : o))
      );
      if (topPriority?.id === opportunity.id) {
        setTopPriority((prev) => (prev ? { ...prev, status: "completed" } : null));
      }
    }
  };

  // Filter opportunities by tab
  const filteredOpportunities = opportunities.filter((o) => {
    if (statusFilter === "all") return true;
    return o.status === statusFilter;
  });

  const currentMetrics = analyticsRun?.metrics_summary.current_period;
  const changes = analyticsRun?.metrics_summary.changes;

  return (
    <div className="space-y-8 animate-fadeIn text-[#0A1B2A]">
      {/* 1. Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h2 className="font-black text-2xl tracking-tight text-[#0A1B2A]">AI Strategy Desk</h2>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic business intelligence and evidence-backed decision support.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {analyticsRun && (
            <span className="text-[11px] font-mono text-slate-500 hidden md:inline-flex items-center gap-1">
              <Calendar size={12} />
              {new Date(analyticsRun.source_watermark).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <button
            onClick={() => executeAnalysis(true)}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#FAF8F5] hover:bg-slate-100 text-[#0A1B2A] border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
          >
            <RefreshCw size={12} className={loading ? "animate-spin text-[#0069FF]" : "text-slate-500"} />
            <span>{loading ? "Re-evaluating..." : "Re-evaluate Strategy"}</span>
          </button>
        </div>
      </div>

      {/* 2. Data Health & Completeness Banner */}
      {analyticsRun && (
        <DataQualityBanner
          status={analyticsRun.data_quality_status}
          completenessScore={analyticsRun.data_quality_summary.completeness_score}
          missingData={analyticsRun.data_quality_summary.missing_data}
          warnings={analyticsRun.data_quality_summary.warnings}
          freshnessTimestamp={analyticsRun.data_quality_summary.freshness_timestamp}
        />
      )}

      {/* 2.5 Segmented Workspace Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#FAF8F5] border border-slate-200/90 rounded-2xl overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab("decisions")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "decisions"
              ? "bg-[#0A1B2A] text-white shadow-xs font-bold"
              : "text-slate-600 hover:text-[#0A1B2A] hover:bg-white/60"
          }`}
        >
          <Layers size={14} className={activeTab === "decisions" ? "text-white" : "text-slate-400"} />
          <span>Strategic Decisions</span>
          {opportunities.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full font-mono text-[11px] font-bold ${
                activeTab === "decisions"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200/70 text-slate-700"
              }`}
            >
              {opportunities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("economics")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "economics"
              ? "bg-[#0A1B2A] text-white shadow-xs font-bold"
              : "text-slate-600 hover:text-[#0A1B2A] hover:bg-white/60"
          }`}
        >
          <TrendingUp size={14} className={activeTab === "economics" ? "text-emerald-400" : "text-slate-400"} />
          <span>Unit Economics & Margins</span>
        </button>

        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "channels"
              ? "bg-[#0A1B2A] text-white shadow-xs font-bold"
              : "text-slate-600 hover:text-[#0A1B2A] hover:bg-white/60"
          }`}
        >
          <CreditCard size={14} className={activeTab === "channels" ? "text-sky-400" : "text-slate-400"} />
          <span>Channel & Payment Risk</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "inventory"
              ? "bg-[#0A1B2A] text-white shadow-xs font-bold"
              : "text-slate-600 hover:text-[#0A1B2A] hover:bg-white/60"
          }`}
        >
          <Box size={14} className={activeTab === "inventory" ? "text-amber-400" : "text-slate-400"} />
          <span>Inventory Runway</span>
        </button>
      </div>

      {/* Tab Content Viewport */}
      {activeTab === "decisions" && (
        <div className="space-y-8 animate-fadeIn">
          {/* 3. Top Priority Opportunity Spotlight Container (rounded-[32px]) */}
          {topPriority && topPriority.status !== "dismissed" && topPriority.status !== "completed" && (
            <div className="bg-gradient-to-b from-[#FAF8F5] to-white border border-slate-200/90 rounded-[32px] p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-[#0069FF] text-white font-mono text-[11px] font-bold flex items-center gap-1.5">
              <Award size={13} />
              Top Business Priority
            </span>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#0A1B2A]">
                Priority Score: {topPriority.priority_score} / 100
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="font-black text-xl text-[#0A1B2A] leading-snug">{topPriority.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {topPriority.problem_description}
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Sparkles size={14} className="text-[#0069FF]" />
              <span>Why this matters right now</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-xs">
              {topPriority.ai_explanation.why_it_matters}
            </p>
            <p className="text-slate-600 text-xs pt-1 border-t border-slate-100">
              <strong className="text-slate-800">Action:</strong> {topPriority.ai_explanation.action_rationale}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setSelectedEvidenceOpp(topPriority)}
              className="text-xs font-semibold text-[#0069FF] hover:underline cursor-pointer flex items-center gap-1"
            >
              Audit supporting metrics & formulas →
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateStatus(topPriority.id, "accepted")}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => handleUpdateStatus(topPriority.id, "in_progress")}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0A1B2A] hover:bg-slate-800 text-white cursor-pointer transition-all shadow-xs"
              >
                Start Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Business Performance Overview & Charts */}
      <div className="space-y-4">
        <h3 className="font-black text-lg tracking-tight text-[#0A1B2A]">Business Performance Overview</h3>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Revenue */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Net Revenue</span>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="font-mono font-bold text-lg text-[#0A1B2A]">
                {currentMetrics ? currentMetrics.revenue.toLocaleString() : "0"} MMK
              </span>
              {changes?.revenue_pct !== null && changes?.revenue_pct !== undefined && (
                <span
                  className={`text-[11px] font-mono font-semibold flex items-center ${
                    changes.revenue_pct >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {changes.revenue_pct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(changes.revenue_pct)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">7-day trailing net sales</p>
          </div>

          {/* Orders */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completed Orders</span>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="font-mono font-bold text-lg text-[#0A1B2A]">
                {currentMetrics ? currentMetrics.completed_orders : "0"} orders
              </span>
              {changes?.orders_pct !== null && changes?.orders_pct !== undefined && (
                <span
                  className={`text-[11px] font-mono font-semibold flex items-center ${
                    changes.orders_pct >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {changes.orders_pct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(changes.orders_pct)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Paid & confirmed orders</p>
          </div>

          {/* Average Order Value (AOV) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Average Basket (AOV)</span>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="font-mono font-bold text-lg text-[#0A1B2A]">
                {currentMetrics ? currentMetrics.aov.toLocaleString() : "0"} MMK
              </span>
              {changes?.aov_pct !== null && changes?.aov_pct !== undefined && (
                <span
                  className={`text-[11px] font-mono font-semibold flex items-center ${
                    changes.aov_pct >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {changes.aov_pct >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(changes.aov_pct)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Revenue per completed order</p>
          </div>

          {/* Cancellation Rate */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cancellation Rate</span>
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <span className="font-mono font-bold text-lg text-[#0A1B2A]">
                {currentMetrics ? Math.round(currentMetrics.cancellation_rate * 100) : "0"}%
              </span>
              {changes?.cancellation_rate_pct !== null && changes?.cancellation_rate_pct !== undefined && (
                <span
                  className={`text-[11px] font-mono font-semibold flex items-center ${
                    changes.cancellation_rate_pct <= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {changes.cancellation_rate_pct <= 0 ? <ArrowDownRight size={13} /> : <ArrowUpRight size={13} />}
                  {Math.abs(changes.cancellation_rate_pct)}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Unfulfilled or rejected orders</p>
          </div>
        </div>

        {/* Row 1: Dual High-Resolution Time-Series SVG Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Dashboard 1: Revenue Matrix */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0069FF] flex items-center justify-center font-bold text-xs">
                    <TrendingUp size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0A1B2A]">Weekly Revenue Matrix</h4>
                    <span className="text-[11px] text-slate-400">Trailing 7-day net store sales</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#0069FF] font-mono text-[11px] font-bold border border-blue-200/70">
                  {currentMetrics ? currentMetrics.revenue.toLocaleString() : "0"} MMK
                </span>
              </div>
              <CustomChart data={weekdaysChartData} color="#0069FF" title="Net Sales Trajectory" unit="MMK" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block font-sans">Avg Run-Rate</span>
                <strong className="font-mono text-slate-800">
                  {Math.round((currentMetrics?.revenue || 0) / 7).toLocaleString()} MMK/d
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Peak Volume</span>
                <strong className="font-mono text-slate-800">
                  {Math.max(...weekdaysChartData.map((d) => d.value), 0).toLocaleString()} MMK
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-sans">Trajectory</span>
                <strong className={`font-mono ${changes?.revenue_pct !== null && changes?.revenue_pct !== undefined && changes.revenue_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {changes?.revenue_pct !== null && changes?.revenue_pct !== undefined ? `${changes.revenue_pct > 0 ? "+" : ""}${changes.revenue_pct}%` : "Stable"}
                </strong>
              </div>
            </div>
          </div>

          {/* Dashboard 2: Order Fulfillment Velocity */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <ShoppingBag size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0A1B2A]">Order Fulfillment Velocity</h4>
                    <span className="text-[11px] text-slate-400">Daily confirmed orders completed</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-bold border border-emerald-200/70">
                  {currentMetrics ? currentMetrics.completed_orders : "0"} orders
                </span>
              </div>
              <CustomChart data={weekdayOrdersChartData} color="#10B981" title="Order Volume Velocity" unit="Orders" />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block font-sans">Daily Average</span>
                <strong className="font-mono text-slate-800">
                  {(Math.round(((currentMetrics?.completed_orders || 0) / 7) * 10) / 10).toFixed(1)} orders/d
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-sans">Peak Daily Orders</span>
                <strong className="font-mono text-slate-800">
                  {Math.max(...weekdayOrdersChartData.map((d) => d.value), 0)} orders
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-sans">Fulfillment Rate</span>
                <strong className="font-mono text-emerald-700">
                  {orders.length > 0
                    ? Math.round((orders.filter((o) => o.status === "confirmed" || o.status === "completed").length / orders.length) * 100)
                    : 100}
                  %
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Three In-Depth Analytic Matrix Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Dashboard 3: Payment Channel & Settlement Risk */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    <CreditCard size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0A1B2A]">Payment Channel Share</h4>
                    <span className="text-[11px] text-slate-400">Settlement volume & risk</span>
                  </div>
                </div>
              </div>

              {/* Stacked Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
                {paymentChannelStats.channels.map((ch, idx) => {
                  const colors = ["bg-[#0069FF]", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-slate-400"];
                  return (
                    <div
                      key={ch.name}
                      style={{ width: `${Math.max(ch.pctOfVolume, 3)}%` }}
                      className={`${colors[idx % colors.length]} h-full transition-all`}
                      title={`${ch.name}: ${ch.pctOfVolume}%`}
                    />
                  );
                })}
              </div>

              {/* Channels List */}
              <div className="space-y-2.5 pt-1 text-xs">
                {paymentChannelStats.channels.slice(0, 3).map((ch) => (
                  <div key={ch.name} className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div>
                      <span className="font-medium text-slate-800 text-xs block">{ch.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {ch.total} orders • {ch.cancellationRate}% cancel
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-xs block">
                        {ch.volume.toLocaleString()} MMK
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-indigo-700">
                        {ch.pctOfVolume}% share
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab("channels")}
              className="text-[11px] text-[#0069FF] font-semibold hover:underline pt-3 cursor-pointer text-left block"
            >
              Explore complete channel & risk breakdown →
            </button>
          </div>

          {/* Dashboard 4: SKU Demand Velocity Matrix */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
                    <Box size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0A1B2A]">Top Product Demand</h4>
                    <span className="text-[11px] text-slate-400">Unit sales & depletion</span>
                  </div>
                </div>
              </div>

              {/* Product items */}
              <div className="space-y-2.5 pt-1 text-xs">
                {topProductsStats.items.map((prod) => (
                  <div key={prod.name} className="space-y-1 border-b border-slate-50 pb-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 text-xs truncate max-w-[130px]">{prod.name}</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {prod.units} sold
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((prod.units / topProductsStats.maxUnits) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
                      <span>{prod.revenue.toLocaleString()} MMK</span>
                      <span className={prod.stock <= 5 ? "text-rose-600 font-bold" : "text-slate-500"}>
                        {prod.stock} in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActiveTab("inventory")}
              className="text-[11px] text-amber-700 font-semibold hover:underline pt-3 cursor-pointer text-left block"
            >
              Audit inventory runway & reorder days →
            </button>
          </div>

          {/* Dashboard 5: Unit Economics & Gross Profit Breakdown */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <Percent size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#0A1B2A]">Unit Economics</h4>
                    <span className="text-[11px] text-slate-400">Gross profit & wholesale COGS</span>
                  </div>
                </div>
              </div>

              {/* Big Gross Margin Stat */}
              <div className="bg-[#FAF8F5] border border-slate-200/60 rounded-xl p-3 text-center space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Store Gross Margin</span>
                <div className="font-mono font-black text-2xl text-emerald-700">
                  {economicsStats.marginPct}%
                </div>
                <span className="text-[11px] text-slate-500 font-mono block">
                  Contribution: <strong className="text-slate-800">{economicsStats.grossProfit.toLocaleString()} MMK</strong>
                </span>
              </div>

              {/* Breakdown details */}
              <div className="space-y-2 text-xs font-mono pt-1">
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <span className="text-slate-500 font-sans">Gross Product Sales</span>
                  <span className="text-slate-800 font-bold">{economicsStats.grossRev.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <span className="text-slate-500 font-sans">Wholesale COGS</span>
                  <span className="text-rose-600 font-bold">-{economicsStats.totalCogs.toLocaleString()} MMK</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-1.5">
                  <span className="text-slate-500 font-sans">Net Store Margin</span>
                  <span className="text-emerald-700 font-bold">+{economicsStats.grossProfit.toLocaleString()} MMK</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("economics")}
              className="text-[11px] text-emerald-700 font-semibold hover:underline pt-3 cursor-pointer text-left block"
            >
              View product margin leaderboard →
            </button>
          </div>
        </div>

        {/* Row 3: Township Logistics Heatmap & Order Ledger Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
          {/* Dashboard 6: Township Logistics (7 cols) */}
          <div className="md:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">
                    <Truck size={15} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#0A1B2A]">Regional Township Demand</h4>
                    <span className="text-[11px] text-slate-400">Order concentration & delivery averages</span>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {townshipStats.totalCount} orders total
                </span>
              </div>

              <div className="space-y-2.5 pt-2 text-xs">
                {townshipStats.list.map((town) => (
                  <div key={town.name} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800 text-xs">{town.name}</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {town.count} orders ({town.pctShare}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(town.pctShare, 5)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Vol: {town.volume.toLocaleString()} MMK</span>
                      <span>Avg Courier Fee: {town.avgFee.toLocaleString()} MMK</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between items-center">
              <span>Delivery logistics optimized for Yangon metropolitan routes</span>
              <span className="font-mono text-sky-700 font-semibold">Active Matrix</span>
            </div>
          </div>

          {/* Dashboard 7: Order Ledger & Settlement Summary (5 cols) */}
          <div className="md:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0A1B2A]">Order Ledger Summary</h4>
                  <span className="text-[11px] text-slate-400">Verification & settlement status</span>
                </div>
              </div>

              <div className="space-y-2.5 text-xs font-mono pt-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-sans">Total Recorded</span>
                  <strong className="text-slate-800">{orders.length} orders</strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-sans">Confirmed & Fulfilled</span>
                  <strong className="text-emerald-700">
                    {orders.filter((o) => o.status === "confirmed" || o.status === "completed").length} orders
                  </strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-sans">Verifying Prepayment</span>
                  <strong className="text-amber-700">
                    {orders.filter((o) => o.status === "verifying").length} orders
                  </strong>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-sans">Cancelled / Rejected</span>
                  <strong className="text-rose-600">
                    {orders.filter((o) => o.status === "cancelled").length} orders
                  </strong>
                </div>
              </div>
            </div>

            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="w-full bg-[#0A1B2A] hover:bg-slate-800 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Download size={13} />
                Export Ledger CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Opportunity Queue with Filter Tabs */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-[#0069FF]" />
            <h3 className="font-black text-lg text-[#0A1B2A]">Detected Opportunities</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-bold">
              {opportunities.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {(["all", "open", "in_progress", "completed", "dismissed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-full font-medium cursor-pointer transition-all capitalize shrink-0 ${
                  statusFilter === tab
                    ? "bg-[#0A1B2A] text-white font-semibold"
                    : "bg-[#FAF8F5] text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.replace("_", " ")}
                <span className="ml-1.5 font-mono text-[11px] opacity-70">
                  (
                  {tab === "all"
                    ? opportunities.length
                    : opportunities.filter((o) => o.status === tab).length}
                  )
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Opportunity Card List */}
        {filteredOpportunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOpportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onUpdateStatus={handleUpdateStatus}
                onOpenEvidence={(o) => setSelectedEvidenceOpp(o)}
                onOpenCompleteModal={(o) => setCompleteModalOpp(o)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-semibold">No opportunities in this view.</p>
            <p className="text-[11px] text-slate-400">
              {statusFilter === "all"
                ? "Your shop is performing within normal statistical variance."
                : `No items marked as "${statusFilter.replace("_", " ")}".`}
            </p>
          </div>
        )}
      </div>

      {/* 6. Measured Outcomes History */}
      {outcomes.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-xs">
          <h4 className="font-bold text-sm text-[#0A1B2A] flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Measured Action Outcomes
          </h4>
          <p className="text-xs text-slate-500">
            Historical record of owner actions and post-implementation observation windows.
          </p>

          <div className="divide-y divide-slate-100 pt-2 text-xs">
            {outcomes.map((outc) => (
              <div key={outc.id} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-semibold text-slate-800 capitalize">
                    {outc.action_type.replace(/_/g, " ")}
                  </span>
                  {outc.notes && <p className="text-slate-600 text-xs">{outc.notes}</p>}
                  <span className="text-[11px] text-slate-400 font-mono block">
                    Observed for {outc.observation_period_days} days • Recorded on{" "}
                    {new Date(outc.completed_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[11px] font-semibold border border-emerald-200 shrink-0">
                  {outc.outcome_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
        </div>
      )}

      {activeTab === "economics" && (
        <UnitEconomicsView products={products} orders={orders} />
      )}

      {activeTab === "channels" && (
        <ChannelRiskView orders={orders} />
      )}

      {activeTab === "inventory" && (
        <InventoryRunwayView products={products} orders={orders} />
      )}

      {/* Evidence Drawer Modal */}
      <EvidenceDrawer
        opportunity={selectedEvidenceOpp}
        onClose={() => setSelectedEvidenceOpp(null)}
      />

      {/* Outcome Complete Modal */}
      <OutcomeModal
        opportunity={completeModalOpp}
        isOpen={Boolean(completeModalOpp)}
        onClose={() => setCompleteModalOpp(null)}
        onRecord={handleRecordOutcome}
      />
    </div>
  );
};
