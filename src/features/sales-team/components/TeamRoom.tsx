import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Award,
  Sliders,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Database,
  Bot,
  Loader2,
  RotateCcw,
  Lock,
  AlertTriangle,
  Brain,
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
import { getBusinessMemories } from "../services/businessMemoryService";
import { ShopPoliciesDrawer } from "./ShopPoliciesDrawer";
import { SingleAgentInquiryDrawer } from "./SingleAgentInquiryDrawer";
import { StrategyDecisionCard } from "./StrategyDecisionCard";
import { ActionCenterDrawer } from "./ActionCenterDrawer";
import { EvidenceExplorerDrawer } from "./EvidenceExplorerDrawer";
import { BusinessMemoryDrawer } from "./BusinessMemoryDrawer";
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
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState<boolean>(false);
  const [memoryCount, setMemoryCount] = useState<number>(0);

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
    setMemoryCount(getBusinessMemories(shopId).length);
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

    // Sequential stepper animation for calm UX feedback
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
        }, 450);
      }, 450);
    }, 500);
  };

  const getAgentIcon = (key: string) => {
    switch (key) {
      case "scout":
        return <Search size={18} className="text-[#0069FF]" />;
      case "guardian":
        return <ShieldCheck size={18} className="text-amber-600" />;
      case "muse":
        return <Sparkles size={18} className="text-purple-600" />;
      case "echo":
        return <MessageCircle size={18} className="text-emerald-600" />;
      case "commander":
        return <Award size={18} className="text-[#0A1B2A]" />;
      default:
        return <Bot size={18} className="text-[#64748B]" />;
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Command Header & Telemetry Strip */}
      <div className="p-6 sm:p-10 bg-white border border-[#E2E8F0] rounded-[32px] shadow-xs space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20">
                <Bot size={12} />
                <span>Sales Intelligence Council</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Store Engine Connected</span>
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#0A1B2A] tracking-tight leading-tight">
              Merchant Council Chamber
            </h1>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-normal">
              Five coordinated AI specialists investigating real inventory, customer friction, and profit margin rules under strict merchant governance.
            </p>
          </div>

          {/* Action pills toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Pending Approvals Pill */}
            <button
              type="button"
              onClick={() => setActionCenterOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EFF6FF] hover:bg-[#0069FF] text-[#0069FF] hover:text-white border border-[#0069FF]/30 text-xs font-semibold cursor-pointer transition-all shadow-xs group"
              title="View pending merchant approvals"
            >
              <Lock size={13} className="text-[#0069FF] group-hover:text-white transition-colors" />
              <span>Pending Approvals</span>
              <span className="font-mono text-xs bg-white text-[#0069FF] px-2 py-0.5 rounded-md font-bold shadow-2xs group-hover:bg-white/20 group-hover:text-white">
                {pendingApprovalsCount}
              </span>
            </button>

            {/* Shop Guardrails Pill */}
            <button
              type="button"
              onClick={() => setPoliciesOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F4F2EC] border border-[#E2E8F0] text-[#0A1B2A] text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Sliders size={13} className="text-[#64748B]" />
              <span>Shop Guardrails</span>
              <span className="font-mono text-[11px] text-[#0069FF] bg-[#EFF6FF] px-2 py-0.5 rounded font-semibold">
                {policies.min_contribution_margin_pct}% Min
              </span>
            </button>

            {/* Business Memory Pill */}
            <button
              type="button"
              onClick={() => setMemoryDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F4F2EC] border border-[#E2E8F0] text-[#0A1B2A] text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Brain size={13} className="text-purple-600" />
              <span>Business Memory</span>
              <span className="font-mono text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
                {memoryCount}
              </span>
            </button>

            {/* Evidence Ledger Pill */}
            <button
              type="button"
              onClick={() => setEvidenceExplorerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F4F2EC] border border-[#E2E8F0] text-[#0A1B2A] text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              <Database size={13} className="text-[#10B981]" />
              <span>Evidence Ledger</span>
              <span className="font-mono text-[11px] bg-[#ECFDF5] text-[#047857] px-2 py-0.5 rounded font-semibold">
                {(councilResult?.evidence || []).length}
              </span>
            </button>
          </div>
        </div>

        {/* Low-Data Warning Notice */}
        {scarcity.status === "insufficient_evidence" && (
          <div className="p-6 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl space-y-3.5 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                <h2 className="text-sm font-semibold text-amber-950">
                  Data Coverage Notice: Empirical Forecasting Paused
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-amber-200 text-amber-900 uppercase">
                Baseline Needed
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-normal">
              Your store has recorded fewer than 5 completed orders or uncosted items. To protect profit accuracy and prevent speculative errors, financial forecasts remain paused until baseline data coverage improves.
            </p>

            {/* Guided Completion Tasks */}
            <div className="pt-2 border-t border-amber-200/80 space-y-2">
              <p className="text-xs font-mono uppercase font-bold text-amber-900">
                Recommended Actions to Calibrate Council:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {scarcity.guidedTasks.map((t) => (
                  <div key={t.id} className="p-3.5 bg-white border border-amber-200 rounded-xl text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0A1B2A]">{t.title}</span>
                      <span className="text-xs font-mono text-amber-900 font-semibold bg-amber-100 px-2 py-0.5 rounded">
                        {t.actionLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569]">{t.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Strip - Clean, quiet metric columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#E2E8F0]">
          <div className="space-y-1">
            <span className="text-xs font-medium text-[#64748B]">Catalog Coverage</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#0A1B2A]">
                {freshness?.totalProducts || 0}
              </span>
              <span className="text-xs text-[#64748B]">
                ({freshness?.costedProducts || 0} costed)
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-[#64748B]">Verified Orders</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#0A1B2A]">
                {freshness?.completedOrders || 0}
              </span>
              <span className="text-xs text-[#64748B]">transactions</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-[#64748B]">Contribution Margin Floor</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#0069FF]">
                {policies.min_contribution_margin_pct}%
              </span>
              <span className="text-xs text-[#64748B]">minimum</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-[#64748B]">Maximum Discount Cap</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#0A1B2A]">
                {policies.max_discount_pct}%
              </span>
              <span className="text-xs text-[#64748B]">ceiling</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Agent Roster */}
      <div className="space-y-5">
        <div className="flex items-end justify-between px-1">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-normal text-[#0A1B2A] tracking-tight">
              Council Specialists
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Consult individual domain specialists or inspect their active hypotheses.
            </p>
          </div>
          <span className="text-xs font-mono text-[#64748B] hidden sm:inline">
            5 Active Specialists
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {roster.map((agent) => (
            <motion.div
              key={agent.key}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleAgentClick(agent)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4 bg-white shadow-xs ${
                selectedAgent?.key === agent.key
                  ? "border-[#0069FF] ring-2 ring-[#0069FF]/15 shadow-sm"
                  : "border-[#E2E8F0] hover:border-[#0069FF]/40 hover:shadow-sm"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#F4F2EC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Ready
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#0A1B2A] group-hover:text-[#0069FF] transition-colors">
                    {agent.name}
                  </h3>
                  <p className="text-xs font-medium text-[#64748B]">
                    {agent.title}
                  </p>
                  <p className="text-xs font-medium text-amber-700 mt-1 line-clamp-1">
                    {agent.persona}
                  </p>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">
                  {agent.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <span className="font-mono text-xs text-[#64748B]">{agent.specialty}</span>
                <span className="font-semibold text-[#0069FF] group-hover:text-[#0052CC] flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
                  Consult <ArrowRight size={11} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 3. Council Deliberation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deliberation Launch & Flow */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-[32px] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-2xl font-normal text-[#0A1B2A] tracking-tight">
                Council Deliberation Theater
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Debate store inventory, buyer hesitation, and discount economics across all 5 specialists.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20 self-start sm:self-auto">
              2-Revision Cap
            </span>
          </div>

          {/* Goal Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0A1B2A]">
              Council Strategic Objective:
            </label>
            <input
              type="text"
              value={councilGoal}
              onChange={(e) => setCouncilGoal(e.target.value)}
              disabled={isDeliberating}
              placeholder="e.g. Maximize revenue for upcoming festival without sacrificing contribution margin..."
              className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E2E8F0] text-xs sm:text-sm text-[#0A1B2A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/10 transition-all"
            />
          </div>

          {/* 5-Phase Loop Visualization - Serene, quiet progress rail */}
          <div className="grid grid-cols-5 gap-1 py-4 px-2 bg-[#FAF8F5] border border-[#E2E8F0] rounded-2xl text-center text-xs">
            <div className={`space-y-1 py-1 transition-colors ${deliberationStep === "investigating" ? "text-[#0069FF] font-semibold" : "text-[#64748B]"}`}>
              <p className="font-mono text-xs text-[#94A3B8]">01</p>
              <p className="font-semibold text-xs text-[#0A1B2A]">Investigate</p>
              <p className="text-xs text-[#64748B]">Scout &amp; Echo</p>
            </div>
            <div className="space-y-1 py-1 border-l border-[#E2E8F0] text-[#64748B]">
              <p className="font-mono text-xs text-[#94A3B8]">02</p>
              <p className="font-semibold text-xs text-[#0A1B2A]">Floor Rules</p>
              <p className="text-xs text-[#64748B]">Guardian</p>
            </div>
            <div className="space-y-1 py-1 border-l border-[#E2E8F0] text-[#64748B]">
              <p className="font-mono text-xs text-[#94A3B8]">03</p>
              <p className="font-semibold text-xs text-[#0A1B2A]">Draft Offers</p>
              <p className="text-xs text-[#64748B]">Muse</p>
            </div>
            <div className={`space-y-1 py-1 border-l border-[#E2E8F0] transition-colors ${deliberationStep === "debating" ? "text-amber-600 font-semibold" : "text-[#64748B]"}`}>
              <p className="font-mono text-xs text-[#94A3B8]">04</p>
              <p className="font-semibold text-xs text-[#0A1B2A]">Profit Audit</p>
              <p className="text-xs text-[#64748B]">Margin Veto</p>
            </div>
            <div className={`space-y-1 py-1 border-l border-[#E2E8F0] transition-colors ${deliberationStep === "synthesizing" ? "text-[#0069FF] font-semibold" : "text-[#64748B]"}`}>
              <p className="font-mono text-xs text-[#94A3B8]">05</p>
              <p className="font-semibold text-xs text-[#0A1B2A]">Decision Card</p>
              <p className="text-xs text-[#64748B]">Commander</p>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-[#64748B] leading-relaxed">
              {isDeliberating
                ? "Council deliberating: Analyzing store inventory, drop-offs, and margin rules..."
                : "Ready to run multi-agent debate and synthesize a Strategy Decision Card."}
            </p>
            <button
              type="button"
              onClick={handleConveneCouncil}
              disabled={isDeliberating}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0069FF] hover:bg-[#0052CC] text-white flex items-center justify-center gap-2.5 cursor-pointer shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 shrink-0"
            >
              {isDeliberating ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>Deliberating ({deliberationStep})...</span>
                </>
              ) : (
                <>
                  <Bot size={16} />
                  <span>Convene Full Sales Council</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Active Policy Protections */}
        <div className="p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-[32px] shadow-xs space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#0A1B2A] text-sm font-semibold">
              <ShieldCheck size={18} className="text-[#0069FF]" />
              <span>Active Policy Protections</span>
            </div>
            <ul className="text-xs text-[#475569] space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Minimum Contribution Margin locked at <strong>{policies.min_contribution_margin_pct}%</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Discount ceilings restricted to <strong>{policies.max_discount_pct}%</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Courier return rate factored at <strong>{policies.max_cod_return_allowance_pct}%</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-[#10B981] shrink-0 mt-0.5" />
                <span>Cryptographically verified &amp; sealed by store owner</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onNavigateToInsights}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#F4F2EC] border border-[#E2E8F0] text-[#0A1B2A] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <TrendingUp size={14} className="text-[#64748B]" />
              <span>View Quick Strategy Desk</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Synthesized Strategy Decision Card */}
      {councilResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <h2 className="font-serif text-2xl font-normal text-[#0A1B2A] tracking-tight">
                Synthesized Strategy Decision
              </h2>
              <span className="text-xs font-mono text-[#64748B]">
                Session {councilResult.session.id}
              </span>
            </div>
            <button
              type="button"
              onClick={handleConveneCouncil}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-[#F4F2EC] border border-[#E2E8F0] text-[#0A1B2A] flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <RotateCcw size={13} className="text-[#64748B]" />
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

      <BusinessMemoryDrawer
        isOpen={memoryDrawerOpen}
        shopId={shopId}
        onClose={() => {
          setMemoryDrawerOpen(false);
          refreshTelemetry();
        }}
      />
    </div>
  );
}
