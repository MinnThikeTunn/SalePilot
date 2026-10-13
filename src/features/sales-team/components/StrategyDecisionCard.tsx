import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Lock,
  Layers,
  FileText,
  Send,
} from "lucide-react";
import type {
  TeamDecision,
  TeamProposal,
  TeamDebate,
  TeamEvidence,
} from "../types/sales-team";

interface StrategyDecisionCardProps {
  decision: TeamDecision;
  proposals: TeamProposal[];
  debates: TeamDebate[];
  evidence: TeamEvidence[];
  onActionClick?: (action: any) => void;
}

export function StrategyDecisionCard({
  decision,
  proposals,
  debates,
  evidence,
  onActionClick,
}: StrategyDecisionCardProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>("actions");
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isConsensus = debates.length > 0 && debates[debates.length - 1].resolution === "consensus";

  return (
    <div className="p-6 sm:p-8 bg-white border border-stone-200/90 rounded-[32px] shadow-sm space-y-6 animate-in fade-in duration-300">
      {/* 1. Header with Opportunity Score & ICE breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-900 text-stone-100">
              Strategy Decision Card
            </span>
            {isConsensus ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={11} /> Council Consensus
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <AlertTriangle size={11} /> Escalated for Review
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {decision.title}
          </h2>
        </div>

        {/* ICE Opportunity Score Pill */}
        <div className="p-3 bg-[#FAF8F5] border border-stone-200 rounded-2xl flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-mono text-stone-500 uppercase font-bold">
              ICE Opportunity Score
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-stone-900 font-mono">
                {decision.opportunity_score}
              </span>
              <span className="text-[10px] font-mono text-stone-400">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 border-l border-stone-200 pl-3 text-[10px] font-mono">
            <span className="text-stone-600">
              Impact: <strong>{decision.score_breakdown.impact}</strong>
            </span>
            <span className="text-stone-600">
              Confidence: <strong>{decision.score_breakdown.confidence}</strong>
            </span>
            <span className="text-stone-600">
              Ease: <strong>{decision.score_breakdown.feasibility}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Executive Summary */}
      <div className="p-5 bg-[#FAF8F5] border border-stone-200/80 rounded-2xl space-y-2">
        <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Award size={14} className="text-rose-600" />
          <span>Executive Synthesis</span>
        </h4>
        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
          {decision.executive_summary}
        </p>
      </div>

      {/* 3. Council Debate Record */}
      <div className="space-y-3">
        <div
          onClick={() => toggleSection("debates")}
          className="flex items-center justify-between cursor-pointer py-1 group"
        >
          <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-amber-600" />
            <span>Council Debate &amp; Challenge Record ({debates.length})</span>
          </h4>
          <span className="text-stone-400 group-hover:text-stone-700">
            {expandedSection === "debates" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {expandedSection === "debates" && (
          <div className="space-y-2.5 animate-in fade-in duration-200">
            {debates.map((deb) => (
              <div
                key={deb.id}
                className="p-4 bg-white border border-stone-200/90 rounded-2xl text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-stone-900 text-white uppercase">
                      {deb.challenger}
                    </span>
                    <span className="font-bold text-stone-800">
                      Revision Round #{deb.revision_attempt}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      deb.resolution === "consensus"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {deb.resolution.toUpperCase()}
                  </span>
                </div>
                <p className="text-stone-600 text-[11px] leading-relaxed mt-1">
                  {deb.notes}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Action Drafts (Requires Owner Approval) */}
      <div className="space-y-3">
        <div
          onClick={() => toggleSection("actions")}
          className="flex items-center justify-between cursor-pointer py-1 group"
        >
          <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-600" />
            <span>Recommended Next Actions ({decision.next_actions.length})</span>
          </h4>
          <span className="text-stone-400 group-hover:text-stone-700">
            {expandedSection === "actions" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {expandedSection === "actions" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            {decision.next_actions.map((act, idx) => (
              <div
                key={idx}
                className="p-5 bg-[#FAF8F5] border border-stone-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800 uppercase">
                      {act.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80">
                      Requires Owner Approval
                    </span>
                  </div>
                  <p className="text-xs text-stone-800 font-bold">{act.description}</p>
                  {act.payload && (
                    <p className="text-[10px] font-mono text-stone-500">
                      Payload: {JSON.stringify(act.payload)}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onActionClick && onActionClick(act)}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Submit for Approval</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. Strategic Alternatives */}
      {decision.alternatives.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-stone-100">
          <div
            onClick={() => toggleSection("alternatives")}
            className="flex items-center justify-between cursor-pointer py-1 group"
          >
            <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers size={14} className="text-blue-600" />
              <span>Deliberated Alternatives &amp; Trade-offs</span>
            </h4>
            <span className="text-stone-400 group-hover:text-stone-700">
              {expandedSection === "alternatives" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </div>

          {expandedSection === "alternatives" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-200">
              {decision.alternatives.map((alt, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-stone-50 border border-stone-200/80 rounded-2xl text-xs space-y-2"
                >
                  <p className="font-bold text-stone-800 text-[11px]">{alt.reason}</p>
                  <ul className="text-[10px] text-stone-500 space-y-1">
                    {alt.tradeoffs.map((t, tidx) => (
                      <li key={tidx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. Verifiable Evidence Citations */}
      <div className="space-y-3 pt-2 border-t border-stone-100">
        <div
          onClick={() => toggleSection("evidence")}
          className="flex items-center justify-between cursor-pointer py-1 group"
        >
          <h4 className="text-xs font-black text-stone-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Database size={14} className="text-emerald-600" />
            <span>Underlying Evidence Citations ({evidence.length})</span>
          </h4>
          <span className="text-stone-400 group-hover:text-stone-700">
            {expandedSection === "evidence" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {expandedSection === "evidence" && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            {evidence.slice(0, 5).map((ev) => {
              const isExpanded = expandedEvidenceId === ev.id;
              return (
                <div
                  key={ev.id}
                  className="bg-[#FAF8F5] border border-stone-200/80 rounded-xl overflow-hidden text-[11px]"
                >
                  <div
                    onClick={() => setExpandedEvidenceId(isExpanded ? null : ev.id)}
                    className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                        {ev.source_type.toUpperCase()}
                      </span>
                      <span className="font-bold text-stone-800">{ev.metric_key}</span>
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
                      <p className="text-stone-400 font-bold">Observable Snapshot:</p>
                      <pre className="whitespace-pre-wrap overflow-x-auto text-amber-300">
                        {JSON.stringify(ev.snapshot, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
