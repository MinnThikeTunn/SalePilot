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
import { SingleAgentChatbotDrawer } from "./SingleAgentChatbotDrawer";
import { CouncilTelegramRoom } from "./CouncilTelegramRoom";
import { StrategyDecisionCard } from "./StrategyDecisionCard";
import { ActionCenterDrawer } from "./ActionCenterDrawer";
import { EvidenceExplorerDrawer } from "./EvidenceExplorerDrawer";
import { BusinessMemoryDrawer } from "./BusinessMemoryDrawer";
import {
  runCouncilDeliberation,
  type CouncilDeliberationResult,
} from "../services/councilOrchestrator";
import {
  resolveStoreName,
  resolveStoreNameSync,
} from "../services/geminiSalesTeamService";

interface TeamRoomProps {
  shopId?: string;
  storeName?: string;
  onNavigateToInsights?: () => void;
}

function SpecialistAvatar({ agent, icon }: { agent: AgentRosterInfo; icon: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#F4F2EC] border border-[#E2E8F0] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
      {!hasError && agent.avatarUrl ? (
        <img
          src={agent.avatarUrl}
          alt={agent.name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {icon}
        </div>
      )}
    </div>
  );
}

export function TeamRoom({ shopId = "default_shop", storeName, onNavigateToInsights }: TeamRoomProps) {
  const [currentStoreName, setCurrentStoreName] = useState<string>(() =>
    resolveStoreNameSync(shopId, storeName)
  );

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
    resolveStoreName(shopId, storeName).then(setCurrentStoreName);
  }, [shopId, storeName]);

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
    const result = runCouncilDeliberation({
      shopId,
      goal: councilGoal,
    });
    setCouncilResult(result);
    refreshTelemetry();
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
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

            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#0A1B2A] tracking-tight leading-tight whitespace-normal">
              Merchant Council Chamber
            </h1>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed font-normal whitespace-normal">
              Five coordinated AI specialists investigating real inventory, customer friction, and profit margin rules for <strong className="text-[#0A1B2A]">{currentStoreName}</strong> under strict merchant governance.
            </p>
          </div>
        </div>

        {/* 4 Control & Governance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* 1. Pending Approvals Card */}
          <button
            type="button"
            onClick={() => setActionCenterOpen(true)}
            className="p-4 bg-[#FAF8F5] hover:bg-white border border-[#E2E8F0] hover:border-[#0069FF]/40 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
            title="View pending merchant approvals"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#0069FF]/20 flex items-center justify-center text-[#0069FF] group-hover:bg-[#0069FF] group-hover:text-white transition-colors">
                <Lock size={15} />
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20">
                Action Required
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Pending Approvals</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#0A1B2A] tracking-tight">
                  {pendingApprovalsCount}
                </span>
                <span className="text-xs text-[#64748B]">proposals</span>
              </div>
            </div>
          </button>

          {/* 2. Shop Guardrails Card */}
          <button
            type="button"
            onClick={() => setPoliciesOpen(true)}
            className="p-4 bg-[#FAF8F5] hover:bg-white border border-[#E2E8F0] hover:border-[#0069FF]/40 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
            title="Configure shop safety guardrails"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] group-hover:border-[#0069FF]/30 group-hover:text-[#0069FF] transition-colors">
                <Sliders size={15} />
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold bg-white text-[#475569] border border-[#E2E8F0]">
                Policy Active
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Shop Guardrails</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#0069FF] tracking-tight">
                  {policies.min_contribution_margin_pct}%
                </span>
                <span className="text-xs text-[#64748B]">Min Margin</span>
              </div>
            </div>
          </button>

          {/* 3. Business Memory Card */}
          <button
            type="button"
            onClick={() => setMemoryDrawerOpen(true)}
            className="p-4 bg-[#FAF8F5] hover:bg-white border border-[#E2E8F0] hover:border-purple-300 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
            title="Inspect merchant learned memories"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Brain size={15} />
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                Persistent
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Business Memory</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#0A1B2A] tracking-tight">
                  {memoryCount}
                </span>
                <span className="text-xs text-[#64748B]">rules learned</span>
              </div>
            </div>
          </button>

          {/* 4. Evidence Ledger Card */}
          <button
            type="button"
            onClick={() => setEvidenceExplorerOpen(true)}
            className="p-4 bg-[#FAF8F5] hover:bg-white border border-[#E2E8F0] hover:border-emerald-300 rounded-2xl text-left transition-all group cursor-pointer shadow-2xs hover:shadow-xs"
            title="Explore telemetry audit evidence"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#10B981]/20 flex items-center justify-center text-[#047857] group-hover:bg-[#10B981] group-hover:text-white transition-colors">
                <Database size={15} />
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#ECFDF5] text-[#047857] border border-[#10B981]/20">
                Audited
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-[#64748B] block">Evidence Ledger</span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-[#0A1B2A] tracking-tight">
                  {(councilResult?.evidence || []).length}
                </span>
                <span className="text-xs text-[#64748B]">records</span>
              </div>
            </div>
          </button>
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
            <h2 className="font-serif text-2xl font-normal text-[#0A1B2A] tracking-tight text-balance">
              Council Specialists
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] text-balance">
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
                  <SpecialistAvatar agent={agent} icon={getAgentIcon(agent.key)} />
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

      {/* 3. Council Deliberation Workspace (Telegram-Style Chamber) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Telegram Group Chamber */}
        <div className="lg:col-span-2">
          <CouncilTelegramRoom
            shopId={shopId}
            storeName={currentStoreName}
            goal={councilGoal}
            onGoalChange={(newGoal) => setCouncilGoal(newGoal)}
            onDeliberationFinished={(result) => {
              setCouncilResult(result);
              refreshTelemetry();
            }}
          />
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
              <h2 className="font-serif text-2xl font-normal text-[#0A1B2A] tracking-tight text-balance">
                Synthesized Strategy Decision
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30">
                <CheckCircle2 size={12} />
                <span>Deliberation Consensus</span>
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

      <SingleAgentChatbotDrawer
        isOpen={inquiryDrawerOpen}
        agent={selectedAgent}
        shopId={shopId}
        storeName={currentStoreName}
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
