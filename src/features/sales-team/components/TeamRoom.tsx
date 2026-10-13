import React, { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Award,
  Sliders,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Database,
  Coins,
  Bot,
  Zap,
} from "lucide-react";
import {
  getAgentRoster,
  getDataFreshnessStatus,
  getShopBusinessPolicies,
  updateShopBusinessPolicies,
  getPendingApprovalsCount,
  type AgentRosterInfo,
  type DataFreshnessStatus,
} from "../services/salesTeamApi";
import { ShopPoliciesDrawer } from "./ShopPoliciesDrawer";
import { SingleAgentInquiryDrawer } from "./SingleAgentInquiryDrawer";

interface TeamRoomProps {
  shopId?: string;
  onNavigateToInsights?: () => void;
}

export function TeamRoom({ shopId = "default_shop", onNavigateToInsights }: TeamRoomProps) {
  const [roster, setRoster] = useState<AgentRosterInfo[]>([]);
  const [freshness, setFreshness] = useState<DataFreshnessStatus | null>(null);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [policiesOpen, setPoliciesOpen] = useState<boolean>(false);
  const [policies, setPolicies] = useState(() => getShopBusinessPolicies(shopId));
  const [selectedAgent, setSelectedAgent] = useState<AgentRosterInfo | null>(null);
  const [inquiryDrawerOpen, setInquiryDrawerOpen] = useState<boolean>(false);
  const [inquiryNotice, setInquiryNotice] = useState<string | null>(null);

  useEffect(() => {
    setRoster(getAgentRoster());
    setFreshness(getDataFreshnessStatus(shopId));
    setPendingApprovalsCount(getPendingApprovalsCount(shopId));
  }, [shopId]);

  const handleSavePolicies = (newPolicies: any) => {
    const updated = updateShopBusinessPolicies(shopId, newPolicies);
    setPolicies(updated);
  };

  const handleAgentClick = (agent: AgentRosterInfo) => {
    setSelectedAgent(agent);
    setInquiryDrawerOpen(true);
  };


  const getAgentIcon = (key: string) => {
    switch (key) {
      case "scout":
        return <Search size={18} className="text-blue-600" />;
      case "guardian":
        return <ShieldCheck size={18} className="text-amber-600" />;
      case "muse":
        return <Sparkles size={18} className="text-purple-600" />;
      case "echo":
        return <MessageCircle size={18} className="text-emerald-600" />;
      case "commander":
        return <Award size={18} className="text-rose-600" />;
      default:
        return <Bot size={18} className="text-stone-600" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* 1. Header & Live Telemetry Strip */}
      <div className="p-6 sm:p-8 bg-white border border-stone-200/90 rounded-[32px] shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-900 text-stone-100">
                AI Orchestration
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Store Engine Synced
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Sale Brain Team Room
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-medium max-w-2xl leading-relaxed">
              Five coordinated AI specialists investigating real inventory, customer friction, and profit margins under strict owner-in-the-loop governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Policies Button */}
            <button
              type="button"
              onClick={() => setPoliciesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Sliders size={14} className="text-stone-500" />
              <span>Shop Guardrails</span>
              <span className="font-mono text-[10px] text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
                {policies.min_contribution_margin_pct}% Min
              </span>
            </button>

            {/* Pending Approvals Badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 border border-stone-200/80 text-xs font-bold text-stone-800">
              <span className="w-2 h-2 rounded-full bg-stone-900" />
              <span>Pending Approvals:</span>
              <span className="font-mono font-black text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-300">
                {pendingApprovalsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Data Quality & Coverage Banner */}
        {freshness && (
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
              freshness.dataCoverageStatus === "good"
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : freshness.dataCoverageStatus === "limited"
                ? "bg-amber-50/80 border-amber-200 text-amber-950"
                : "bg-rose-50/80 border-rose-200 text-rose-950"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  freshness.dataCoverageStatus === "good"
                    ? "bg-emerald-600 text-white"
                    : freshness.dataCoverageStatus === "limited"
                    ? "bg-amber-600 text-white"
                    : "bg-rose-600 text-white"
                }`}
              >
                {freshness.dataCoverageStatus === "good" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
              </div>
              <div>
                <p className="font-bold">
                  Evidence Status:{" "}
                  {freshness.dataCoverageStatus === "good"
                    ? "Verified High Quality"
                    : freshness.dataCoverageStatus === "limited"
                    ? "Limited Evidence Sample"
                    : "Insufficient Evidence (Data Scarcity Mode)"}
                </p>
                <p className="text-[11px] opacity-80">
                  {freshness.limitations.length > 0
                    ? freshness.limitations.join(" • ")
                    : "All calculations backed by complete product costs and order records."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono shrink-0">
              <span>Catalog: <strong>{freshness.totalProducts} items</strong></span>
              <span>Orders: <strong>{freshness.completedOrders} completed</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Notice Banner */}
      {inquiryNotice && (
        <div className="p-4 bg-stone-900 text-white rounded-2xl flex items-center justify-between text-xs font-medium animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            <span>{inquiryNotice}</span>
          </div>
          <span className="text-[10px] font-mono text-stone-400">Targeted Mode</span>
        </div>
      )}

      {/* 2. Interactive Agent Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              Specialist Agent Roster
            </h2>
            <p className="text-xs text-stone-500">
              Click any agent to launch a targeted Single-Agent Inquiry or view specialist persona guardrails
            </p>
          </div>
          <span className="text-[11px] font-mono text-stone-400">
            5 Active Specialists
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {roster.map((agent) => (
            <div
              key={agent.key}
              onClick={() => handleAgentClick(agent)}
              className={`p-5 rounded-[28px] border transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 bg-white shadow-2xs ${
                selectedAgent?.key === agent.key
                  ? "border-stone-900 ring-2 ring-stone-900/10 shadow-md"
                  : "border-stone-200/90 hover:border-stone-400 hover:shadow-xs"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                    <img
                      src={agent.avatarUrl}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {getAgentIcon(agent.key)}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-stone-100 text-stone-700">
                    Ready
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-black text-stone-900 group-hover:text-stone-700 transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-[11px] font-bold text-stone-500">
                    {agent.title}
                  </p>
                  <p className="text-[10px] font-medium text-amber-700 mt-0.5 line-clamp-1">
                    {agent.persona}
                  </p>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed line-clamp-2">
                  {agent.description}
                </p>

              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[10px]">
                <span className="font-mono text-stone-400">{agent.specialty}</span>
                <span className="font-bold text-stone-900 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  Inquire <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Main War Room Action Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deliberation Launch & Flow */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-white border border-stone-200/90 rounded-[32px] shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight">
                Sales Council Deliberation
              </h3>
              <p className="text-xs text-stone-500">
                Orchestrate Scout, Muse, Guardian, Echo, and Commander in a structured debate
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 border border-amber-200 text-amber-800">
              2-Revision Cap Enforced
            </span>
          </div>

          {/* 5-Phase Loop Visualization */}
          <div className="grid grid-cols-5 gap-2 text-center text-[10px] py-4 bg-[#FAF8F5] border border-stone-200/70 rounded-2xl">
            <div className="space-y-1 px-1">
              <span className="font-mono font-bold text-stone-400">01</span>
              <p className="font-bold text-stone-900">Investigate</p>
              <p className="text-[9px] text-stone-500">Scout &amp; Echo</p>
            </div>
            <div className="space-y-1 px-1 border-l border-stone-200">
              <span className="font-mono font-bold text-stone-400">02</span>
              <p className="font-bold text-stone-900">Constraints</p>
              <p className="text-[9px] text-stone-500">Guardian</p>
            </div>
            <div className="space-y-1 px-1 border-l border-stone-200">
              <span className="font-mono font-bold text-stone-400">03</span>
              <p className="font-bold text-stone-900">Draft Offers</p>
              <p className="text-[9px] text-stone-500">Muse</p>
            </div>
            <div className="space-y-1 px-1 border-l border-stone-200">
              <span className="font-mono font-bold text-stone-400">04</span>
              <p className="font-bold text-stone-900">Profit Audit</p>
              <p className="text-[9px] text-stone-500">Guardian Veto</p>
            </div>
            <div className="space-y-1 px-1 border-l border-stone-200">
              <span className="font-mono font-bold text-stone-400">05</span>
              <p className="font-bold text-stone-900">Decision Card</p>
              <p className="text-[9px] text-stone-500">Commander</p>
            </div>
          </div>

          {/* Primary Convene Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-stone-500">
              Ready to evaluate store data over the last 30 days and discover verified opportunities.
            </div>
            <button
              type="button"
              onClick={() => {
                setInquiryNotice("Launching Full Council Deliberation session. Running Scout and Echo evidence discovery...");
                setTimeout(() => setInquiryNotice(null), 3000);
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-black bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-2.5 cursor-pointer shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Bot size={15} className="text-amber-400" />
              <span>Convene Full Sales Council</span>
            </button>
          </div>
        </div>

        {/* Right Col: Persona Spotlight & Quick Rules */}
        <div className="p-6 bg-[#FAF8F5] border border-stone-200/90 rounded-[32px] shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-stone-900 text-xs font-bold">
              <ShieldCheck size={16} className="text-amber-600" />
              <span>Active Council Guardrails</span>
            </div>
            <ul className="text-[11px] text-stone-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Minimum Contribution Margin locked at <strong>{policies.min_contribution_margin_pct}%</strong></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Discount ceilings restricted to <strong>{policies.max_discount_pct}%</strong></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Courier COD return allowance factored at <strong>{policies.max_cod_return_allowance_pct}%</strong></span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>All owner approvals secured with SHA-256 payload hashes</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-stone-200/80">
            <button
              type="button"
              onClick={onNavigateToInsights}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <TrendingUp size={13} />
              <span>View Quick Strategy Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawers */}
      <ShopPoliciesDrawer
        isOpen={policiesOpen}
        onClose={() => setPoliciesOpen(false)}
        policy={policies}
        onSave={handleSavePolicies}
      />

      <SingleAgentInquiryDrawer
        isOpen={inquiryDrawerOpen}
        agent={selectedAgent}
        shopId={shopId}
        onClose={() => setInquiryDrawerOpen(false)}
      />
    </div>
  );
}

