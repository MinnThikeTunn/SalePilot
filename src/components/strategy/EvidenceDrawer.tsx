import React from "react";
import { X, ShieldCheck, Database, Layers, ArrowUpRight } from "lucide-react";
import type { SalesOpportunity } from "../../types";

interface EvidenceDrawerProps {
  opportunity: SalesOpportunity | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ opportunity, onClose }) => {
  if (!opportunity) return null;

  const { score_breakdown, evidence_snapshot, expected_impact, priority_score, title } = opportunity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#E2E8F0] rounded-[32px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-[#0A1B2A]">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20 font-mono text-[11px] font-semibold">
              Deterministic Evidence Audit
            </span>
            <h3 className="font-bold text-lg text-[#0A1B2A] mt-1.5">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-[#F4F2EC] hover:bg-[#E2E8F0] text-[#0A1B2A] flex items-center justify-center cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-[#0069FF]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Priority Score Breakdown */}
        <div className="bg-[#FAF8F5] border border-slate-200/80 rounded-2xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <Layers size={14} className="text-[#0069FF]" /> Authoritative Priority Score
            </span>
            <span className="text-base font-black text-[#0A1B2A] font-mono">{priority_score} / 100</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold">Impact (35%)</span>
              <p className="font-mono font-bold text-sm text-[#0A1B2A] mt-0.5">{score_breakdown.impact}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold">Evidence (25%)</span>
              <p className="font-mono font-bold text-sm text-[#0A1B2A] mt-0.5">{score_breakdown.evidence}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold">Urgency (20%)</span>
              <p className="font-mono font-bold text-sm text-[#0A1B2A] mt-0.5">{score_breakdown.urgency}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 font-semibold">Action (20%)</span>
              <p className="font-mono font-bold text-sm text-[#0A1B2A] mt-0.5">{score_breakdown.actionability}</p>
            </div>
          </div>
        </div>

        {/* Supporting Metrics Table */}
        <div className="space-y-2.5">
          <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
            <Database size={14} className="text-emerald-600" /> Recorded Baseline Metrics
          </h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
            {Object.entries(evidence_snapshot.metrics).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center px-4 py-2.5 bg-white hover:bg-slate-50">
                <span className="text-slate-600 font-mono text-[11px] capitalize">{key.replace(/_/g, " ")}</span>
                <span className="font-mono font-semibold text-[#0A1B2A]">
                  {typeof val === "number" ? val.toLocaleString() : String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Values (if present) */}
        {evidence_snapshot.comparison_values && (
          <div className="space-y-2.5">
            <h4 className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
              <ArrowUpRight size={14} className="text-slate-600" /> Comparison Period Baseline
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {Object.entries(evidence_snapshot.comparison_values).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center px-4 py-2 bg-white">
                  <span className="text-slate-600 font-mono text-[11px] capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {typeof val === "number" ? val.toLocaleString() : String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Business Impact */}
        {expected_impact && (
          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs space-y-1.5">
            <span className="font-semibold text-emerald-900 flex items-center gap-1">
              <ShieldCheck size={14} /> Expected Impact Hypothesis
            </span>
            {expected_impact.revenue_at_risk_mmk !== undefined && (
              <p className="text-emerald-800 font-mono font-semibold">
                Revenue at risk: {expected_impact.revenue_at_risk_mmk.toLocaleString()} MMK
              </p>
            )}
            {expected_impact.potential_gain_mmk !== undefined && (
              <p className="text-emerald-800 font-mono font-semibold">
                Potential gross upside: {expected_impact.potential_gain_mmk.toLocaleString()} MMK
              </p>
            )}
            {expected_impact.assumptions && (
              <p className="text-emerald-700 text-[11px] mt-1">{expected_impact.assumptions}</p>
            )}
          </div>
        )}

        {/* Audit Metadata */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Source: {evidence_snapshot.source_records}</span>
          <span>Window: {evidence_snapshot.analysis_period}</span>
        </div>
      </div>
    </div>
  );
};
