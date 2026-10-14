import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Award,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Database,
  Layers,
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="p-6 sm:p-8 bg-white border border-[#E2E8F0] rounded-[32px] shadow-xs space-y-6"
    >
      {/* 1. Header with Opportunity Score & ICE breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20">
              Strategy Decision Card
            </span>
            {isConsensus ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30 flex items-center gap-1.5">
                <CheckCircle2 size={12} /> Council Consensus
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle size={12} /> Escalated for Review
              </span>
            )}
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#0A1B2A] tracking-tight">
            {decision.title}
          </h2>
        </div>

        {/* ICE Opportunity Score Pill */}
        <div className="p-4 bg-[#FAF8F5] border border-[#E2E8F0] rounded-2xl flex items-center gap-5 shrink-0">
          <div className="text-right">
            <p className="text-xs font-mono text-[#64748B] uppercase font-bold tracking-wider">
              ICE Opportunity Score
            </p>
            <div className="flex items-baseline gap-1 mt-0.5 justify-end">
              <span className="text-2xl font-bold text-[#0A1B2A] font-mono">
                {decision.opportunity_score}
              </span>
              <span className="text-xs font-mono text-[#64748B]">/ 100</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 border-l border-[#E2E8F0] pl-4 text-xs font-mono">
            <span className="text-[#475569]">
              Impact: <strong className="text-[#0A1B2A]">{decision.score_breakdown.impact}</strong>
            </span>
            <span className="text-[#475569]">
              Confidence: <strong className="text-[#0A1B2A]">{decision.score_breakdown.confidence}</strong>
            </span>
            <span className="text-[#475569]">
              Ease: <strong className="text-[#0A1B2A]">{decision.score_breakdown.feasibility}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Executive Synthesis */}
      <div className="p-5 sm:p-6 bg-[#FAF8F5] border border-[#E2E8F0] rounded-2xl space-y-2">
        <h3 className="text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Award size={14} className="text-[#0069FF]" />
          <span>Executive Synthesis</span>
        </h3>
        <p className="text-sm text-[#475569] leading-relaxed font-normal">
          {decision.executive_summary}
        </p>
      </div>

      {/* 3. Recommended Next Actions (Requires Owner Approval) */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => toggleSection("actions")}
          className="w-full flex items-center justify-between py-1 group text-left cursor-pointer"
        >
          <h3 className="text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#0069FF]" />
            <span>Recommended Next Actions ({decision.next_actions.length})</span>
          </h3>
          <span className="text-[#64748B] group-hover:text-[#0A1B2A] transition-colors">
            {expandedSection === "actions" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        <AnimatePresence>
          {expandedSection === "actions" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {decision.next_actions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0069FF]/30 transition-all shadow-xs"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F4F2EC] text-[#0A1B2A] uppercase tracking-wide">
                        {act.type.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Requires Owner Approval
                      </span>
                    </div>
                    <p className="text-sm text-[#0A1B2A] font-semibold">{act.description}</p>
                    {act.payload && (
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        {act.payload.proposedDiscountPct !== undefined && (
                          <span className="text-xs text-[#0069FF] font-medium bg-[#EFF6FF] px-2 py-0.5 rounded">
                            Proposed Discount: {act.payload.proposedDiscountPct}%
                          </span>
                        )}
                        {act.payload.description && (
                          <span className="text-xs text-[#475569]">
                            {act.payload.description}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onActionClick && onActionClick(act)}
                    className="px-5 py-2.5 rounded-xl bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-[0.98]"
                  >
                    <span>Queue for Approval</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Council Debate Record */}
      <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("debates")}
          className="w-full flex items-center justify-between py-1 group text-left cursor-pointer"
        >
          <h3 className="text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-amber-600" />
            <span>Council Debate &amp; Challenge Record ({debates.length})</span>
          </h3>
          <span className="text-[#64748B] group-hover:text-[#0A1B2A] transition-colors">
            {expandedSection === "debates" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        <AnimatePresence>
          {expandedSection === "debates" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2.5"
            >
              {debates.map((deb) => (
                <div
                  key={deb.id}
                  className="p-4 bg-[#FAF8F5] border border-[#E2E8F0] rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0A1B2A] text-white uppercase">
                        {deb.challenger}
                      </span>
                      <span className="font-semibold text-[#0A1B2A]">
                        Revision Round #{deb.revision_attempt}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                        deb.resolution === "consensus"
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {deb.resolution.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[#475569] text-xs leading-relaxed mt-1">
                    {deb.notes}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Strategic Alternatives */}
      {decision.alternatives.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
          <button
            type="button"
            onClick={() => toggleSection("alternatives")}
            className="w-full flex items-center justify-between py-1 group text-left cursor-pointer"
          >
            <h3 className="text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers size={14} className="text-[#0069FF]" />
              <span>Deliberated Alternatives &amp; Trade-offs</span>
            </h3>
            <span className="text-[#64748B] group-hover:text-[#0A1B2A] transition-colors">
              {expandedSection === "alternatives" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </button>

          <AnimatePresence>
            {expandedSection === "alternatives" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {decision.alternatives.map((alt, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#FAF8F5] border border-[#E2E8F0] rounded-xl text-xs space-y-1.5"
                  >
                    <p className="font-semibold text-[#0A1B2A] text-xs">{alt.reason}</p>
                    <ul className="text-xs text-[#64748B] space-y-1">
                      {alt.tradeoffs.map((t, tidx) => (
                        <li key={tidx}>• {t}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 6. Verifiable Evidence Citations */}
      <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
        <button
          type="button"
          onClick={() => toggleSection("evidence")}
          className="w-full flex items-center justify-between py-1 group text-left cursor-pointer"
        >
          <h3 className="text-xs font-semibold text-[#0A1B2A] uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Database size={14} className="text-[#10B981]" />
            <span>Underlying Evidence Citations ({evidence.length})</span>
          </h3>
          <span className="text-[#64748B] group-hover:text-[#0A1B2A] transition-colors">
            {expandedSection === "evidence" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>

        <AnimatePresence>
          {expandedSection === "evidence" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              {evidence.slice(0, 5).map((ev) => {
                const isExpanded = expandedEvidenceId === ev.id;
                return (
                  <div
                    key={ev.id}
                    className="bg-[#FAF8F5] border border-[#E2E8F0] rounded-xl overflow-hidden text-xs"
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedEvidenceId(isExpanded ? null : ev.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setExpandedEvidenceId(isExpanded ? null : ev.id);
                        }
                      }}
                      className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#F4F2EC] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[#0069FF] bg-[#EFF6FF] px-2 py-0.5 rounded">
                          {ev.source_type.toUpperCase()}
                        </span>
                        <span className="font-semibold text-[#0A1B2A]">{ev.metric_key}</span>
                        <span className="text-[#64748B] font-mono">
                          = {String(ev.value)} {ev.unit}
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={14} className="text-[#64748B]" />
                      ) : (
                        <ChevronDown size={14} className="text-[#64748B]" />
                      )}
                    </div>

                    {isExpanded && ev.snapshot && (
                      <div className="p-3.5 bg-[#0A1B2A] text-slate-200 font-mono text-xs border-t border-[#E2E8F0] space-y-1">
                        <p className="text-slate-400 font-bold">Observable Snapshot:</p>
                        <pre className="whitespace-pre-wrap overflow-x-auto text-sky-300">
                          {JSON.stringify(ev.snapshot, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
