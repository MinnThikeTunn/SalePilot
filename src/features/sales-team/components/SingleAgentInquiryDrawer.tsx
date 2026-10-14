import React, { useState } from "react";
import {
  X,
  Zap,
  ArrowRight,
  Search,
  ShieldAlert,
  Coins,
  ChevronDown,
  ChevronUp,
  Database,
  ExternalLink,
  Bot,
  Sparkles,
  HelpCircle,
  TrendingDown,
  Lightbulb,
  ShieldCheck,
  Lock,
  Percent,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import type { AgentRosterInfo } from "../services/salesTeamApi";
import { runScoutInquiry, type ScoutInquiryResult } from "../agents/scoutRunner";
import { runEchoInquiry, type EchoInquiryResult } from "../agents/echoRunner";
import { runGuardianAudit, type GuardianAuditResult } from "../agents/guardianRunner";
import type { TeamEvidence } from "../types/sales-team";

interface SingleAgentInquiryDrawerProps {
  isOpen: boolean;
  agent: AgentRosterInfo | null;
  shopId: string;
  onClose: () => void;
}

export function SingleAgentInquiryDrawer({
  isOpen,
  agent,
  shopId,
  onClose,
}: SingleAgentInquiryDrawerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [scoutResult, setScoutResult] = useState<ScoutInquiryResult | null>(null);
  const [echoResult, setEchoResult] = useState<EchoInquiryResult | null>(null);
  const [guardianResult, setGuardianResult] = useState<GuardianAuditResult | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");

  if (!isOpen || !agent) return null;

  const handleRunInquiry = (triggerPreset?: any) => {
    setIsRunning(true);
    setTimeout(() => {
      if (agent.key === "scout") {
        const result = runScoutInquiry({
          shopId,
          trigger: triggerPreset || "general",
          customPrompt: customQuery,
        });
        setScoutResult(result);
        setEchoResult(null);
        setGuardianResult(null);
      } else if (agent.key === "echo") {
        const result = runEchoInquiry({
          shopId,
          trigger: triggerPreset || "general",
          customPrompt: customQuery,
        });
        setEchoResult(result);
        setScoutResult(null);
        setGuardianResult(null);
      } else if (agent.key === "guardian") {
        let proposedDiscount = 0;
        let deliveryFee = 2500;
        if (triggerPreset === "simulate_discount") proposedDiscount = 15;
        if (triggerPreset === "stress_test_cod") deliveryFee = 4500;

        const result = runGuardianAudit({
          shopId,
          proposedDiscountPct: proposedDiscount,
          deliveryFee,
          trigger: triggerPreset || "general",
          customPrompt: customQuery,
        });
        setGuardianResult(result);
        setScoutResult(null);
        setEchoResult(null);
      }
      setIsRunning(false);
    }, 450);
  };

  const getUrgencyBadge = (urgency: "high" | "medium" | "low") => {
    switch (urgency) {
      case "high":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-stone-100 text-stone-700 border-stone-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-full max-h-[92vh] bg-white border border-stone-200 rounded-[32px] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 1. Header */}
        <div className="p-6 border-b border-stone-100 bg-[#FAF8F5]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/90 shadow-2xs shrink-0">
              <img
                src={agent.avatarUrl}
                alt={agent.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900 tracking-tight">
                  {agent.name} — Single-Agent Inquiry
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-stone-900 text-stone-100">
                  {agent.specialty}
                </span>
              </div>
              <p className="text-xs text-stone-500 font-medium mt-0.5">
                {agent.persona}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Persona Motto Callout */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs space-y-1">
            <p className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>Persona Motto:</span>
            </p>
            <p className="text-amber-800 italic text-[11px] leading-relaxed">
              "{agent.motto}"
            </p>
          </div>

          {/* Privacy Guarantee Note for Echo */}
          {agent.key === "echo" && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 flex items-center gap-2.5">
              <Lock size={15} className="text-emerald-700 shrink-0" />
              <span>
                <strong>Zero-PII Privacy Guarantee:</strong> Echo inspects anonymized conversation stages and drop-offs. Customer names, phone numbers, and raw chat logs are strictly omitted from analysis.
              </span>
            </div>
          )}

          {/* Preset Investigation Triggers for Scout */}
          {agent.key === "scout" && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                Scout Preset Investigations
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRunInquiry("hunt_stockout_and_sales_risks")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-rose-600">
                    <ShieldAlert size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Stockout Risks</p>
                  <p className="text-[10px] font-normal text-stone-500">Scan buffer thresholds</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunInquiry("scan_slow_moving")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-600">
                    <Coins size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Dead Inventory</p>
                  <p className="text-[10px] font-normal text-stone-500">Find locked working capital</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunInquiry("repeat_cohorts")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-emerald-600">
                    <Sparkles size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Repeat Cohorts</p>
                  <p className="text-[10px] font-normal text-stone-500">Detect VIP loyal buyers</p>
                </button>
              </div>
            </div>
          )}

          {/* Preset Investigation Triggers for Echo */}
          {agent.key === "echo" && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                Echo Customer Friction Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRunInquiry("analyze_customer_objections")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-600">
                    <HelpCircle size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Analyze Objections</p>
                  <p className="text-[10px] font-normal text-stone-500">Find why buyers hesitate</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunInquiry("inspect_funnel_dropoffs")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-rose-600">
                    <TrendingDown size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Funnel Drop-offs</p>
                  <p className="text-[10px] font-normal text-stone-500">Inspect abandonment steps</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunInquiry("suggest_faq_and_scripts")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-blue-600">
                    <Lightbulb size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>FAQ &amp; Script Fixes</p>
                  <p className="text-[10px] font-normal text-stone-500">Optimize bot responses</p>
                </button>
              </div>
            </div>
          )}

          {/* Preset Investigation Triggers for Guardian */}
          {agent.key === "guardian" && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                Guardian Margin &amp; Profit Audits
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRunInquiry("audit_catalog_margins")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-emerald-600">
                    <ShieldCheck size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Audit Catalog Margins</p>
                  <p className="text-[10px] font-normal text-stone-500">Check baseline profitability</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunInquiry("simulate_discount")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-amber-600">
                    <Percent size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Simulate 15% Off</p>
                  <p className="text-[10px] font-normal text-stone-500">Test proposed promotion</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRunInquiry("stress_test_cod")}
                  disabled={isRunning}
                  className="p-3 text-left rounded-2xl bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200/80 transition-all text-xs font-bold text-stone-800 space-y-1 cursor-pointer"
                >
                  <div className="flex items-center justify-between text-rose-600">
                    <Truck size={14} />
                    <ArrowRight size={12} />
                  </div>
                  <p>Stress Test COD</p>
                  <p className="text-[10px] font-normal text-stone-500">Factor courier return loss</p>
                </button>
              </div>
            </div>
          )}

          {/* Custom Query Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder={`Ask ${agent.name} a specific question...`}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
              />
              <button
                type="button"
                onClick={() => handleRunInquiry("custom")}
                disabled={isRunning}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white cursor-pointer shadow-xs transition-all shrink-0"
              >
                {isRunning ? "Investigating..." : "Execute"}
              </button>
            </div>
          </div>

          {/* Scout Results Section */}
          {scoutResult && agent.key === "scout" && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono">
                    Findings &amp; Opportunities ({scoutResult.opportunities.length})
                  </h4>
                  <span className="text-[10px] text-stone-400">
                    • {scoutResult.evidence.length} Evidence Citations
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {new Date(scoutResult.executedAt).toLocaleTimeString()}
                </span>
              </div>

              {scoutResult.opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="p-5 rounded-2xl border border-stone-200/90 bg-[#FAF8F5] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border uppercase ${getUrgencyBadge(
                        opp.urgency
                      )}`}
                    >
                      {opp.urgency} urgency
                    </span>
                    <span className="font-mono font-bold text-xs text-stone-900">
                      Est. Impact: {opp.potentialImpactMmk.toLocaleString()} MMK
                    </span>
                  </div>

                  <div>
                    <h5 className="text-sm font-bold text-stone-900">{opp.title}</h5>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {opp.summary}
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-stone-200/80 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-stone-800 text-[11px]">
                      Recommended Next Step:
                    </p>
                    <p className="text-stone-600 text-[11px]">{opp.recommendedNextStep}</p>
                  </div>

                  {/* Evidence Citations */}
                  <div className="space-y-2 pt-2 border-t border-stone-200/60">
                    <p className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                      Verifiable Evidence Citations:
                    </p>
                    <div className="space-y-1.5">
                      {opp.evidenceRefs.map((refId) => {
                        const ev = scoutResult.evidence.find((e) => e.id === refId);
                        if (!ev) return null;
                        const isExpanded = expandedEvidenceId === ev.id;
                        return (
                          <div
                            key={ev.id}
                            className="bg-white border border-stone-200/90 rounded-xl overflow-hidden text-[11px]"
                          >
                            <div
                              onClick={() =>
                                setExpandedEvidenceId(isExpanded ? null : ev.id)
                              }
                              className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                  {ev.source_type.toUpperCase()}
                                </span>
                                <span className="font-bold text-stone-800">
                                  {ev.metric_key}
                                </span>
                                <span className="text-stone-500 font-mono">
                                  = {String(ev.value)} {ev.unit}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp size={13} className="text-stone-400" />
                              ) : (
                                <ChevronDown size={13} className="text-stone-400" />
                              )}
                            </div>

                            {isExpanded && ev.snapshot && (
                              <div className="p-3 bg-stone-900 text-stone-200 font-mono text-[10px] border-t border-stone-200 space-y-1">
                                <p className="text-stone-400 font-bold">
                                  Snapshot Data (Source ID: {ev.source_id}):
                                </p>
                                <pre className="whitespace-pre-wrap overflow-x-auto text-amber-300">
                                  {JSON.stringify(ev.snapshot, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Echo Results Section */}
          {echoResult && agent.key === "echo" && (
            <div className="space-y-5 pt-2 border-t border-stone-100">
              {/* Funnel Drop-off Overview Card */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono">
                    Telegram Checkout Funnel Health
                  </h4>
                  <span className="font-mono font-bold text-xs text-stone-700">
                    Conversion Rate: {echoResult.funnelAnalysis.conversionRatePct}%
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">Total Sessions</p>
                    <p className="text-lg font-black text-stone-900 mt-1">
                      {echoResult.funnelAnalysis.totalSessions}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <p className="text-[10px] font-mono text-emerald-600 uppercase">Completed</p>
                    <p className="text-lg font-black text-emerald-700 mt-1">
                      {echoResult.funnelAnalysis.completedSessionsCount}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <p className="text-[10px] font-mono text-rose-600 uppercase">Abandoned</p>
                    <p className="text-lg font-black text-rose-700 mt-1">
                      {echoResult.funnelAnalysis.abandonedSessionsCount}
                    </p>
                  </div>
                </div>

                {/* Drop-offs by Stage Pills */}
                {Object.keys(echoResult.funnelAnalysis.dropOffByStep).length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                      Drop-off Stage Distribution:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(echoResult.funnelAnalysis.dropOffByStep).map(([step, count]) => (
                        <span
                          key={step}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-stone-200 text-stone-800"
                        >
                          {step}: {count} drops
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Classified Objections */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono">
                    Classified Customer Objections ({echoResult.objections.length})
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">
                    {echoResult.evidence.length} Verifiable Citations
                  </span>
                </div>

                {echoResult.objections.map((obj) => (
                  <div
                    key={obj.id}
                    className="p-5 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border uppercase ${getUrgencyBadge(
                            obj.severity
                          )}`}
                        >
                          {obj.severity} severity
                        </span>
                        <span className="text-[10px] font-mono text-stone-500">
                          {obj.count} occurrences ({obj.percentageOfDropOffs}% of drop-offs)
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-stone-600">
                        Stage: {obj.dropOffStage}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-sm font-bold text-stone-900">{obj.label}</h5>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {obj.summary}
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-stone-200/80 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-stone-800 text-[11px] flex items-center gap-1.5">
                        <Lightbulb size={12} className="text-amber-600" />
                        <span>Echo's Prescriptive Recommendation:</span>
                      </p>
                      <p className="text-stone-600 text-[11px]">{obj.recommendation}</p>
                    </div>

                    {/* Verifiable Evidence Snapshots */}
                    <div className="space-y-2 pt-2 border-t border-stone-200/60">
                      <p className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                        Zero-PII Evidence Citations:
                      </p>
                      <div className="space-y-1.5">
                        {obj.evidenceRefs.map((refId) => {
                          const ev = echoResult.evidence.find((e) => e.id === refId);
                          if (!ev) return null;
                          const isExpanded = expandedEvidenceId === ev.id;
                          return (
                            <div
                              key={ev.id}
                              className="bg-white border border-stone-200/90 rounded-xl overflow-hidden text-[11px]"
                            >
                              <div
                                onClick={() =>
                                  setExpandedEvidenceId(isExpanded ? null : ev.id)
                                }
                                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {ev.source_type.toUpperCase()}
                                  </span>
                                  <span className="font-bold text-stone-800">
                                    {ev.metric_key}
                                  </span>
                                  <span className="text-stone-500 font-mono">
                                    = {String(ev.value)} {ev.unit}
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp size={13} className="text-stone-400" />
                                ) : (
                                  <ChevronDown size={13} className="text-stone-400" />
                                )}
                              </div>

                              {isExpanded && ev.snapshot && (
                                <div className="p-3 bg-stone-900 text-stone-200 font-mono text-[10px] border-t border-stone-200 space-y-1">
                                  <p className="text-stone-400 font-bold">
                                    Privacy-Preserving Snapshot (Source: {ev.source_id}):
                                  </p>
                                  <pre className="whitespace-pre-wrap overflow-x-auto text-amber-300">
                                    {JSON.stringify(ev.snapshot, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Market Intelligence Persona Context */}
              {echoResult.marketContext && (
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl text-xs space-y-2">
                  <p className="font-bold text-stone-800 uppercase tracking-wider font-mono text-[10px]">
                    Myanmar Market Context (External Benchmarks)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                      <p className="font-bold text-stone-800">Payment Psychology:</p>
                      <p className="mt-0.5">
                        Dominant: COD ~60%, KPay ~28%. Buyers hesitate without verified badges or phone confirmations.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200/70">
                      <p className="font-bold text-stone-800">Return to Origin (RTO):</p>
                      <p className="mt-0.5">
                        Benchmark RTO is 18.5%. Upfront address and payment transparency reduces delivery refusal.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Guardian Results Section */}
          {guardianResult && agent.key === "guardian" && (
            <div className="space-y-5 pt-2 border-t border-stone-100">
              {/* Policy Thresholds Card */}
              <div className="p-5 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Active Financial Policy Guardrails</span>
                  </h4>
                  <span className="text-[10px] font-mono text-stone-500">
                    {guardianResult.vetoCount > 0 ? (
                      <span className="text-rose-600 font-bold">{guardianResult.vetoCount} Policy Veto(es)</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">100% Policy Compliant</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">Min Margin Floor</p>
                    <p className="text-base font-black text-stone-900 mt-0.5">
                      {guardianResult.policySummary.min_contribution_margin_pct}%
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">Max Discount Cap</p>
                    <p className="text-base font-black text-stone-900 mt-0.5">
                      {guardianResult.policySummary.max_discount_pct}%
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-stone-200">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">Max COD Risk</p>
                    <p className="text-base font-black text-stone-900 mt-0.5">
                      {guardianResult.policySummary.max_cod_return_allowance_pct}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Audits */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono">
                    Deterministic Unit Economics Audit ({guardianResult.financialAudits.length})
                  </h4>
                  <span className="text-[10px] font-mono text-stone-400">
                    {guardianResult.evidence.length} Evidence Records
                  </span>
                </div>

                {guardianResult.financialAudits.map((item) => (
                  <div
                    key={item.productId}
                    className="p-5 rounded-2xl border border-stone-200 bg-[#FAF8F5] space-y-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h5 className="text-sm font-bold text-stone-900">{item.productName}</h5>
                        <p className="text-[10px] font-mono text-stone-500">
                          Retail Price: {item.originalPrice.toLocaleString()} MMK • Available Stock: {item.currentStock} units
                        </p>
                      </div>

                      {item.status === "approved" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase flex items-center gap-1">
                          <CheckCircle2 size={11} /> Approved
                        </span>
                      )}
                      {item.status === "vetoed" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase flex items-center gap-1">
                          <AlertTriangle size={11} /> Vetoed
                        </span>
                      )}
                      {item.status === "warning_unverified" && (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase flex items-center gap-1">
                          <AlertTriangle size={11} /> Unverified
                        </span>
                      )}
                    </div>

                    {/* Veto Notice if breached */}
                    {item.isVetoed && item.vetoReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[11px]">Guardian Financial Veto:</p>
                          <p className="text-[11px] mt-0.5">{item.vetoReason}</p>
                        </div>
                      </div>
                    )}

                    {/* Missing Cost Notice */}
                    {item.costMissing && (
                      <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-[11px]">Cost Price Not Recorded:</p>
                          <p className="text-[11px] mt-0.5">
                            Wholesale COGS is unrecorded for this item. Margins cannot be calculated without cost data.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Numbers Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                        <p className="text-[9px] font-mono text-stone-500 uppercase">Net Selling Price</p>
                        <p className="font-mono font-bold text-stone-900 mt-0.5">
                          {item.netPrice.toLocaleString()} MMK
                        </p>
                        {item.discountPct > 0 && (
                          <span className="text-[9px] text-amber-600 font-mono">
                            (-{item.discountPct}%)
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                        <p className="text-[9px] font-mono text-stone-500 uppercase">Product COGS</p>
                        <p className="font-mono font-bold text-stone-900 mt-0.5">
                          {item.costPrice !== null ? `${item.costPrice.toLocaleString()} MMK` : "Unknown"}
                        </p>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                        <p className="text-[9px] font-mono text-stone-500 uppercase">Gross Margin</p>
                        <p className="font-mono font-bold text-stone-900 mt-0.5">
                          {item.grossMarginMmk !== null ? `${item.grossMarginMmk.toLocaleString()} MMK` : "Unknown"}
                        </p>
                        {item.grossMarginPct !== null && (
                          <span className="text-[9px] text-stone-500 font-mono">
                            ({item.grossMarginPct}%)
                          </span>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-stone-200">
                        <p className="text-[9px] font-mono text-stone-500 uppercase">Contribution Margin</p>
                        <p className={`font-mono font-bold mt-0.5 ${item.contributionMmk && item.contributionMmk > 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {item.contributionMmk !== null ? `${item.contributionMmk.toLocaleString()} MMK` : "Unknown"}
                        </p>
                        {item.contributionMarginPct !== null && (
                          <span className={`text-[9px] font-mono font-bold ${item.isVetoed ? "text-rose-600" : "text-emerald-600"}`}>
                            ({item.contributionMarginPct}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-stone-200/80 rounded-xl text-xs space-y-1">
                      <p className="font-bold text-stone-800 text-[11px] flex items-center gap-1.5">
                        <ShieldCheck size={12} className="text-emerald-600" />
                        <span>Guardian Assessment:</span>
                      </p>
                      <p className="text-stone-600 text-[11px]">{item.recommendation}</p>
                    </div>

                    {/* Evidence Citations */}
                    <div className="space-y-2 pt-2 border-t border-stone-200/60">
                      <p className="text-[10px] font-mono text-stone-500 font-bold uppercase">
                        Deterministic Financial Snapshots:
                      </p>
                      <div className="space-y-1.5">
                        {item.evidenceRefs.map((refId) => {
                          const ev = guardianResult.evidence.find((e) => e.id === refId);
                          if (!ev) return null;
                          const isExpanded = expandedEvidenceId === ev.id;
                          return (
                            <div
                              key={ev.id}
                              className="bg-white border border-stone-200/90 rounded-xl overflow-hidden text-[11px]"
                            >
                              <div
                                onClick={() =>
                                  setExpandedEvidenceId(isExpanded ? null : ev.id)
                                }
                                className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                    {ev.source_type.toUpperCase()}
                                  </span>
                                  <span className="font-bold text-stone-800">
                                    {ev.metric_key}
                                  </span>
                                  <span className="text-stone-500 font-mono">
                                    = {String(ev.value)} {ev.unit}
                                  </span>
                                </div>
                                {isExpanded ? (
                                  <ChevronUp size={13} className="text-stone-400" />
                                ) : (
                                  <ChevronDown size={13} className="text-stone-400" />
                                )}
                              </div>

                              {isExpanded && ev.snapshot && (
                                <div className="p-3 bg-stone-900 text-stone-200 font-mono text-[10px] border-t border-stone-200 space-y-1">
                                  <p className="text-stone-400 font-bold">
                                    Financial Math Snapshot (Source: {ev.source_id}):
                                  </p>
                                  <pre className="whitespace-pre-wrap overflow-x-auto text-amber-300">
                                    {JSON.stringify(ev.snapshot, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Deterministic mathematical proof attached to every claim</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold hover:bg-stone-300 transition-colors cursor-pointer"
          >
            Close Inquiry
          </button>
        </div>
      </div>
    </div>
  );
}
