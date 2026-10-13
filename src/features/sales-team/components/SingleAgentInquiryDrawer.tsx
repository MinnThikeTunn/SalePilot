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
} from "lucide-react";
import type { AgentRosterInfo } from "../services/salesTeamApi";
import { runScoutInquiry, type ScoutInquiryResult } from "../agents/scoutRunner";
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
  const [inquiryResult, setInquiryResult] = useState<ScoutInquiryResult | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [customQuery, setCustomQuery] = useState("");

  if (!isOpen || !agent) return null;

  const handleRunInquiry = (triggerPreset?: any) => {
    setIsRunning(true);
    // Simulate brief execution loop
    setTimeout(() => {
      if (agent.key === "scout") {
        const result = runScoutInquiry({
          shopId,
          trigger: triggerPreset || "general",
          customPrompt: customQuery,
        });
        setInquiryResult(result);
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

          {/* Custom Query Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder={`Ask ${agent.name} a specific question (e.g. Which products have low margins?)...`}
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

          {/* Results Section */}
          {inquiryResult && (
            <div className="space-y-4 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono">
                    Findings &amp; Opportunities ({inquiryResult.opportunities.length})
                  </h4>
                  <span className="text-[10px] text-stone-400">
                    • {inquiryResult.evidence.length} Evidence Citations
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">
                  {new Date(inquiryResult.executedAt).toLocaleTimeString()}
                </span>
              </div>

              {inquiryResult.opportunities.map((opp) => (
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
                        const ev = inquiryResult.evidence.find((e) => e.id === refId);
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
        </div>

        {/* 3. Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Evidence checked deterministically against store catalog</span>
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
