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
  Loader2,
  RotateCcw,
  Lock,
  AlertTriangle,
} from "lucide-react";
import {
  getAgentRoster,
  getDataFreshnessStatus,
  getShopBusinessPolicies,
  updateShopBusinessPolicies,
  type AgentRosterInfo,
  type DataFreshnessStatus,
} from "../services/salesTeamApi";
import {
  getPendingApprovals,
  createPendingApproval,
} from "../services/approvalService";
import {
  evaluateDataScarcity,
  type DataScarcityEvaluation,
} from "../services/dataScarcityService";
import { ShopPoliciesDrawer } from "./ShopPoliciesDrawer";
import { SingleAgentInquiryDrawer } from "./SingleAgentInquiryDrawer";
import { StrategyDecisionCard } from "./StrategyDecisionCard";
import { ActionCenterDrawer } from "./ActionCenterDrawer";
import { EvidenceExplorerDrawer } from "./EvidenceExplorerDrawer";
import {
  runCouncilDeliberation,
  type CouncilDeliberationResult,
} from "../services/councilOrchestrator";

interface TeamRoomProps {
  shopId?: string;
  onNavigateToInsights?: () => void;
}

export function TeamRoom({ shopId = "default_shop", onNavigateToInsights }: TeamRoomProps) {
  const [roster, setRoster] = useState<AgentRosterInfo[]>([]);
  const [freshness, setFreshness] = useState<DataFreshnessStatus | null>(null);
  const [scarcity, setScarcity] = useState<DataScarcityEvaluation>(() => evaluateDataScarcity(shopId));
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [policiesOpen, setPoliciesOpen] = useState<boolean>(false);
  const [policies, setPolicies] = useState(() => getShopBusinessPolicies(shopId));
  const [selectedAgent, setSelectedAgent] = useState<AgentRosterInfo | null>(null);
  const [inquiryDrawerOpen, setInquiryDrawerOpen] = useState<boolean>(false);
  const [actionCenterOpen, setActionCenterOpen] = useState<boolean>(false);
  const [evidenceExplorerOpen, setEvidenceExplorerOpen] = useState<boolean>(false);

  // Council Deliberation State
  const [isDeliberating, setIsDeliberating] = useState<boolean>(false);
  const [deliberationStep, setDeliberationStep] = useState<string>("idle");
  const [councilResult, setCouncilResult] = useState<CouncilDeliberationResult | null>(null);
  const [councilGoal, setCouncilGoal] = useState<string>(
    "Maximize revenue for upcoming Thadingyut Lighting Festival without sacrificing contribution margin"
  );

  const refreshTelemetry = () => {
    setPendingApprovalsCount(getPendingApprovals(shopId).length);
    setScarcity(evaluateDataScarcity(shopId));
    setFreshness(getDataFreshnessStatus(shopId));
  };

  useEffect(() => {
    setRoster(getAgentRoster());
    refreshTelemetry();
  }, [shopId]);

  const handleSavePolicies = (newPolicies: any) => {
    const updated = updateShopBusinessPolicies(shopId, newPolicies);
    setPolicies(updated);
  };

  const handleAgentClick = (agent: AgentRosterInfo) => {
    setSelectedAgent(agent);
    setInquiryDrawerOpen(true);
  };

  const handleActionSubmit = (action: any) => {
    createPendingApproval({
      shopId,
      decisionId: councilResult?.decision.id || "decision_default",
      actionType: action.type,
      payload: {
        ...(action.payload || {}),
        description: action.description,
      },
    });
    refreshTelemetry();
    setActionCenterOpen(true);
  };

  const handleConveneCouncil = () => {
    setIsDeliberating(true);
    setDeliberationStep("investigating");

    // Sequential stepper animation for UX feedback
    setTimeout(() => {
      setDeliberationStep("debating");
      setTimeout(() => {
        setDeliberationStep("synthesizing");
        setTimeout(() => {
          const result = runCouncilDeliberation({
            shopId,
            goal: councilGoal,
          });
          setCouncilResult(result);
          setIsDeliberating(false);
          setDeliberationStep("completed");
          refreshTelemetry();
        }, 400);
      }, 400);
    }, 450);
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
            {/* Evidence Ledger Button */}
            <button
              type="button"
              onClick={() => setEvidenceExplorerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Database size={14} className="text-emerald-600" />
              <span>Evidence Ledger</span>
              <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                {(councilResult?.evidence || []).length}
              </span>
            </button>

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

            {/* Pending Approvals Badge (Clickable to open Action Center) */}
            <button
              type="button"
              onClick={() => setActionCenterOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200/80 text-xs font-bold text-stone-800 cursor-pointer transition-colors shadow-2xs"
            >
              <Lock size={13} className="text-amber-600" />
              <span>Pending Approvals:</span>
              <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-stone-300 text-stone-900">
                {pendingApprovalsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Low-Data Warning Banner (ADR-0003) */}
        {scarcity.status === "insufficient_evidence" && (
          <div className="p-5 bg-amber-50/90 border border-amber-200/90 rounded-[28px] space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-black text-amber-900 tracking-tight">
                  ADR-0003 Data Scarcity Notice: Speculative Forecasting Suppressed
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-200 text-amber-900 uppercase">
                Insufficient Evidence
              </span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Your store currently has fewer than 5 completed transactions or uncosted inventory items. To prevent financial hallucinations and preserve margin integrity, speculative forecasts are suppressed until data coverage improves.
            </p>

            {/* Guided Completion Tasks */}
            <div className="pt-2 border-t border-amber-200/60 space-y-2">
              <p className="text-[10px] font-mono uppercase font-bold text-amber-900">
                Guided Tasks to Unlock Full Intelligence:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scarcity.guidedTasks.map((t) => (
                  <div key={t.id} className="p-3 bg-white/95 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{t.title}</span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                        {t.actionLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100 text-xs">
          <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase font-bold">Catalog Coverage</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-stone-900 font-mono">
                {freshness?.totalProducts || 0}
              </span>
              <span className="text-[10px] text-stone-500">
                ({freshness?.costedProducts || 0} costed)
              </span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase font-bold">Verified Orders</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-stone-900 font-mono">
                {freshness?.completedOrders || 0}
              </span>
              <span className="text-[10px] text-stone-500">transactions</span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase font-bold">Floor Margin</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-amber-700 font-mono">
                {policies.min_contribution_margin_pct}%
              </span>
              <span className="text-[10px] text-stone-500">contribution</span>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-stone-200/60">
            <span className="text-[10px] font-mono text-stone-400 uppercase font-bold">Discount Ceiling</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-black text-stone-900 font-mono">
                {policies.max_discount_pct}%
              </span>
              <span className="text-[10px] text-stone-500">max cap</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Agent Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight">
              Agent Roster &amp; Single-Agent Inquiries
            </h2>
            <p className="text-xs text-stone-500">
              Click any agent to interrogate specific domain hypotheses or request focused analysis.
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

      {/* 3. Main War Room Action Deck & Deliberation Trigger */}
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

          {/* Goal Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-stone-700 uppercase font-mono">
              Council Objective / Seasonal Focus:
            </label>
            <input
              type="text"
              value={councilGoal}
              onChange={(e) => setCouncilGoal(e.target.value)}
              disabled={isDeliberating}
              placeholder="e.g. Maximize revenue for upcoming festival without sacrificing contribution margin..."
              className="w-full px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
            />
          </div>

          {/* 5-Phase Loop Visualization */}
          <div className="grid grid-cols-5 gap-2 text-center text-[10px] py-4 bg-[#FAF8F5] border border-stone-200/70 rounded-2xl">
            <div className={`space-y-1 px-1 transition-colors ${deliberationStep === "investigating" ? "text-blue-600 font-bold" : ""}`}>
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
            <div className={`space-y-1 px-1 border-l border-stone-200 transition-colors ${deliberationStep === "debating" ? "text-amber-600 font-bold" : ""}`}>
              <span className="font-mono font-bold text-stone-400">04</span>
              <p className="font-bold text-stone-900">Profit Audit</p>
              <p className="text-[9px] text-stone-500">Guardian Veto</p>
            </div>
            <div className={`space-y-1 px-1 border-l border-stone-200 transition-colors ${deliberationStep === "synthesizing" ? "text-rose-600 font-bold" : ""}`}>
              <span className="font-mono font-bold text-stone-400">05</span>
              <p className="font-bold text-stone-900">Decision Card</p>
              <p className="text-[9px] text-stone-500">Commander</p>
            </div>
          </div>

          {/* Primary Convene Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-stone-500">
              {isDeliberating
                ? "Council in session: Synthesizing real catalog stock, customer friction, and margin floors..."
                : "Ready to evaluate store data and synthesize an empirical Strategy Decision Card."}
            </div>
            <button
              type="button"
              onClick={handleConveneCouncil}
              disabled={isDeliberating}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full text-xs font-black bg-stone-900 hover:bg-stone-800 text-white flex items-center justify-center gap-2.5 cursor-pointer shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isDeliberating ? (
                <>
                  <Loader2 size={15} className="animate-spin text-amber-400" />
                  <span>Deliberating ({deliberationStep})...</span>
                </>
              ) : (
                <>
                  <Bot size={15} className="text-amber-400" />
                  <span>Convene Full Sales Council</span>
                </>
              )}
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

      {/* 4. Synthesized Strategy Decision Card (When Deliberation Completes) */}
      {councilResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-stone-900 tracking-tight">
                Synthesized Strategy Decision
              </h3>
              <span className="text-xs font-mono text-stone-400">
                Session {councilResult.session.id}
              </span>
            </div>
            <button
              type="button"
              onClick={handleConveneCouncil}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Re-run Deliberation</span>
            </button>
          </div>

          <StrategyDecisionCard
            decision={councilResult.decision}
            proposals={councilResult.proposals}
            debates={councilResult.debates}
            evidence={councilResult.evidence}
            onActionClick={handleActionSubmit}
          />
        </div>
      )}

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

      <ActionCenterDrawer
        isOpen={actionCenterOpen}
        shopId={shopId}
        onClose={() => {
          setActionCenterOpen(false);
          refreshTelemetry();
        }}
        onActionExecuted={() => {
          refreshTelemetry();
        }}
      />

      <EvidenceExplorerDrawer
        isOpen={evidenceExplorerOpen}
        evidence={councilResult?.evidence || []}
        onClose={() => setEvidenceExplorerOpen(false)}
      />
    </div>
  );
}
