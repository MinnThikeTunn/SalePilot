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
  const [chartMetric, setChartMetric] = useState<"revenue" | "orders">("revenue");
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
          <h2 className="font-serif font-medium text-2xl sm:text-3xl tracking-tight text-[#0A1B2A]">AI Strategy Desk</h2>
          <p className="text-xs text-slate-500 mt-1">
            Autonomous commercial intelligence and prioritized merchant action plans.
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
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 flex items-center gap-1.5 cursor-pointer transition shadow-2xs active:scale-[0.98]"
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
      <div className="flex items-center gap-1.5 p-1 bg-[#F4F2EC]/80 border border-slate-200/70 rounded-2xl overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab("decisions")}
          className={`px-4 py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "decisions"
              ? "bg-white text-[#0A1B2A] shadow-2xs font-semibold"
              : "text-slate-600 hover:text-[#0A1B2A] font-medium"
          }`}
        >
          <Layers size={13} className={activeTab === "decisions" ? "text-[#0069FF]" : "text-slate-400"} />
          <span>Strategic Priorities</span>
          {opportunities.length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full font-mono text-xs font-semibold ${
                activeTab === "decisions" ? "bg-slate-100 text-slate-800" : "bg-slate-200/60 text-slate-600"
              }`}
            >
              {opportunities.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("economics")}
          className={`px-4 py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "economics"
              ? "bg-white text-[#0A1B2A] shadow-2xs font-semibold"
              : "text-slate-600 hover:text-[#0A1B2A] font-medium"
          }`}
        >
          <TrendingUp size={13} className={activeTab === "economics" ? "text-[#0069FF]" : "text-slate-400"} />
          <span>Unit Economics & Margins</span>
        </button>

        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "channels"
              ? "bg-white text-[#0A1B2A] shadow-2xs font-semibold"
              : "text-slate-600 hover:text-[#0A1B2A] font-medium"
          }`}
        >
          <CreditCard size={13} className={activeTab === "channels" ? "text-[#0069FF]" : "text-slate-400"} />
          <span>Payment Channels & Risk</span>
        </button>

        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-xl text-xs cursor-pointer transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "inventory"
              ? "bg-white text-[#0A1B2A] shadow-2xs font-semibold"
              : "text-slate-600 hover:text-[#0A1B2A] font-medium"
          }`}
        >
          <Box size={13} className={activeTab === "inventory" ? "text-[#0069FF]" : "text-slate-400"} />
          <span>Inventory Runway</span>
        </button>
      </div>

      {/* Tab Content Viewport */}
      {activeTab === "decisions" && (
        <div className="space-y-8 animate-fadeIn">
          {/* 3. Top Priority Opportunity Spotlight Container (rounded-[28px]) */}
          {topPriority && topPriority.status !== "dismissed" && topPriority.status !== "completed" && (
            <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-[#EFF6FF] text-[#0069FF] font-mono text-[11px] font-semibold border border-[#0069FF]/20 flex items-center gap-1.5">
                  <Award size={13} />
                  Top Commercial Priority
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    Priority Score: {topPriority.priority_score} / 100
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#0A1B2A] tracking-tight leading-snug">
                  {topPriority.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                  {topPriority.problem_description}
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-slate-200/70 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Sparkles size={14} className="text-[#0069FF]" />
                  <span>Why this matters right now</span>
                </div>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {topPriority.ai_explanation.why_it_matters}
                </p>
                <p className="text-slate-600 text-xs pt-1.5 border-t border-slate-200/60">
                  <strong className="text-slate-800">Recommended action:</strong> {topPriority.ai_explanation.action_rationale}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setSelectedEvidenceOpp(topPriority)}
                  className="text-xs font-medium text-[#0069FF] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Audit supporting metrics & formulas →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(topPriority.id, "accepted")}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(topPriority.id, "in_progress")}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0A1B2A] hover:bg-slate-800 text-white cursor-pointer transition shadow-xs"
                  >
                    Start Action
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. Business Performance Overview & Charts */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-medium text-xl tracking-tight text-[#0A1B2A]">
                Store Performance Pulse
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Trailing 7 Days</span>
            </div>

            {/* 4 Clean Pulse KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Revenue */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-medium">Net Revenue</span>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#0A1B2A]">
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
                <p className="text-[11px] text-slate-400">7-day confirmed sales</p>
              </div>

              {/* Orders */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-medium">Completed Orders</span>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#0A1B2A]">
                    {currentMetrics ? currentMetrics.completed_orders : "0"}
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
                <p className="text-[11px] text-slate-400">Paid and dispatched</p>
              </div>

              {/* Average Order Value (AOV) */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-medium">Average Basket</span>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#0A1B2A]">
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
                <p className="text-[11px] text-slate-400">Net revenue per order</p>
              </div>

              {/* Cancellation Rate */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs space-y-1">
                <span className="text-[11px] font-mono tracking-wider text-slate-500 uppercase font-medium">Cancellation Rate</span>
                <div className="flex items-baseline justify-between gap-2 mt-1">
                  <span className="font-mono font-bold text-lg sm:text-xl text-[#0A1B2A]">
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
                <p className="text-[11px] text-slate-400">Rejected or abandoned</p>
              </div>
            </div>

            {/* Unified 2-Column Analytics Workspace (Chart + Ledger Audit) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
              {/* Left Canvas: Interactive Chart (8 cols) */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-medium text-sm text-[#0A1B2A]">Weekly Store Volume</h4>
                      <span className="text-[11px] text-slate-500">
                        {chartMetric === "revenue" ? "Daily net sales across trailing 7 days" : "Daily confirmed completed orders"}
                      </span>
                    </div>

                    {/* Quiet Metric Switcher */}
                    <div className="flex items-center gap-1 p-1 bg-[#F4F2EC] rounded-xl text-[11px]">
                      <button
                        onClick={() => setChartMetric("revenue")}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition ${
                          chartMetric === "revenue"
                            ? "bg-white text-[#0A1B2A] shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Revenue (MMK)
                      </button>
                      <button
                        onClick={() => setChartMetric("orders")}
                        className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition ${
                          chartMetric === "orders"
                            ? "bg-white text-[#0A1B2A] shadow-2xs font-semibold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Orders
                      </button>
                    </div>
                  </div>

                  {chartMetric === "revenue" ? (
                    <CustomChart data={weekdaysChartData} color="#0069FF" title="Net Sales (MMK)" unit="MMK" />
                  ) : (
                    <CustomChart data={weekdayOrdersChartData} color="#10B981" title="Completed Orders" unit="Orders" />
                  )}
                </div>

                {/* Quiet Footer Strip */}
                <div className="grid grid-cols-3 gap-3 pt-3 mt-4 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-sans">Daily Run-Rate</span>
                    <strong className="font-mono text-slate-800">
                      {chartMetric === "revenue"
                        ? `${Math.round((currentMetrics?.revenue || 0) / 7).toLocaleString()} MMK/d`
                        : `${(Math.round(((currentMetrics?.completed_orders || 0) / 7) * 10) / 10).toFixed(1)} orders/d`}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Peak Day</span>
                    <strong className="font-mono text-slate-800">
                      {chartMetric === "revenue"
                        ? `${Math.max(...weekdaysChartData.map((d) => d.value), 0).toLocaleString()} MMK`
                        : `${Math.max(...weekdayOrdersChartData.map((d) => d.value), 0)} orders`}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-sans">Trajectory</span>
                    <strong className={`font-mono ${
                      changes?.revenue_pct !== null && changes?.revenue_pct !== undefined && changes.revenue_pct >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}>
                      {changes?.revenue_pct !== null && changes?.revenue_pct !== undefined
                        ? `${changes.revenue_pct > 0 ? "+" : ""}${changes.revenue_pct}%`
                        : "Stable"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Canvas: Store Ledger & Settlement Audit (4 cols) */}
              <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-[#0A1B2A]">Order Ledger & Settlement</h4>
                    <p className="text-[11px] text-slate-500">Verification and payment distribution</p>
                  </div>

                  {/* Status breakdown table */}
                  <div className="space-y-2 text-xs font-mono pt-1">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans">Total Recorded</span>
                      <strong className="text-slate-800">{orders.length} orders</strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans">Confirmed & Dispatched</span>
                      <strong className="text-emerald-700">
                        {orders.filter((o) => o.status === "confirmed" || o.status === "completed").length} orders
                      </strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans">Awaiting Slip Review</span>
                      <strong className="text-amber-700">
                        {orders.filter((o) => o.status === "verifying").length} orders
                      </strong>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-sans">Cancelled</span>
                      <strong className="text-rose-600">
                        {orders.filter((o) => o.status === "cancelled").length} orders
                      </strong>
                    </div>
                  </div>

                  {/* Quiet Channel Summary */}
                  {paymentChannelStats.channels.length > 0 && (
                    <div className="pt-2 space-y-1.5">
                      <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold tracking-wider block">
                        Payment Mix
                      </span>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 flex overflow-hidden">
                        {paymentChannelStats.channels.map((ch, idx) => {
                          const colors = ["bg-[#0069FF]", "bg-slate-700", "bg-emerald-600", "bg-amber-500"];
                          return (
                            <div
                              key={ch.name}
                              style={{ width: `${Math.max(ch.pctOfVolume, 5)}%` }}
                              className={`${colors[idx % colors.length]} h-full`}
                              title={`${ch.name}: ${ch.pctOfVolume}%`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                        <span>{paymentChannelStats.channels[0]?.name} ({paymentChannelStats.channels[0]?.pctOfVolume}%)</span>
                        {paymentChannelStats.channels[1] && (
                          <span>{paymentChannelStats.channels[1]?.name} ({paymentChannelStats.channels[1]?.pctOfVolume}%)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {onExportCsv && (
                    <button
                      onClick={onExportCsv}
                      className="w-full bg-[#0A1B2A] hover:bg-slate-800 text-white py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs"
                    >
                      <Download size={13} />
                      Export Ledger CSV
                    </button>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <button
                      onClick={() => setActiveTab("economics")}
                      className="hover:text-[#0069FF] transition cursor-pointer"
                    >
                      Unit Economics →
                    </button>
                    <button
                      onClick={() => setActiveTab("channels")}
                      className="hover:text-[#0069FF] transition cursor-pointer"
                    >
                      Channel Risk →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

      {/* 5. Opportunity Queue with Filter Tabs */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-[#0069FF]" />
            <h3 className="font-serif font-medium text-xl text-[#0A1B2A] tracking-tight">Prioritized Opportunities</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
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
                    ? "bg-[#0A1B2A] text-white shadow-2xs font-semibold"
                    : "bg-white text-slate-600 hover:text-[#0A1B2A] border border-slate-200/80"
                }`}
              >
                {tab.replace("_", " ")}
                <span className="ml-1.5 font-mono text-[11px] opacity-75">
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
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 size={24} className="mx-auto text-slate-400" />
            <p className="text-xs font-medium text-slate-700">No opportunities in this view.</p>
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
          <h4 className="font-serif font-medium text-base text-[#0A1B2A] flex items-center gap-2">
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
