import React from "react";
import {
  TrendingDown,
  AlertTriangle,
  Percent,
  ShieldAlert,
  Users,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Check,
  Play,
  XCircle,
  RotateCcw,
  Layers,
} from "lucide-react";
import type { SalesOpportunity, LifecycleStatus } from "../../types";

interface OpportunityCardProps {
  opportunity: SalesOpportunity;
  onUpdateStatus: (id: string, status: LifecycleStatus, reason?: string) => Promise<void>;
  onOpenEvidence: (opp: SalesOpportunity) => void;
  onOpenCompleteModal: (opp: SalesOpportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  onUpdateStatus,
  onOpenEvidence,
  onOpenCompleteModal,
}) => {
  const {
    id,
    opportunity_type,
    title,
    problem_description,
    priority_score,
    score_breakdown,
    evidence_confidence,
    ai_explanation,
    recommended_action,
    expected_impact,
    status,
  } = opportunity;

  // Render contextual type icon
  const renderTypeIcon = () => {
    switch (opportunity_type) {
      case "sales_decline":
        return <TrendingDown size={15} className="text-rose-600" />;
      case "stock_risk":
        return <AlertTriangle size={15} className="text-amber-600" />;
      case "cancellation_risk":
        return <ShieldAlert size={15} className="text-rose-600" />;
      case "margin_opportunity":
        return <Percent size={15} className="text-emerald-600" />;
      case "repeat_purchase":
        return <Users size={15} className="text-indigo-600" />;
      case "conversion_gap":
        return <MessageSquare size={15} className="text-sky-600" />;
      default:
        return <Sparkles size={15} className="text-[#0069FF]" />;
    }
  };

  // Status badge styling
  const getStatusBadge = () => {
    switch (status) {
      case "in_progress":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            In Progress
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
            <Check size={11} />
            Completed
          </span>
        );
      case "accepted":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[11px] font-semibold">
            Accepted
          </span>
        );
      case "dismissed":
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-semibold">
            Dismissed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-medium">
            Open
          </span>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all p-5 space-y-4 shadow-xs ${
        status === "dismissed"
          ? "opacity-60 border-slate-200"
          : "border-slate-200/90 hover:border-[#0069FF]/50"
      }`}
    >
      {/* Top bar: Type, Status, Priority Score */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
            {renderTypeIcon()}
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            {opportunity_type.replace(/_/g, " ")}
          </span>
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2">
          {/* Priority Score badge */}
          <div
            title={`Impact: ${score_breakdown.impact} | Evidence: ${score_breakdown.evidence} | Urgency: ${score_breakdown.urgency} | Action: ${score_breakdown.actionability}`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-slate-200 text-slate-800 cursor-help"
          >
            <Layers size={12} className="text-[#0069FF]" />
            <span className="font-mono font-bold text-xs">{priority_score}</span>
            <span className="text-[11px] text-slate-400 font-sans">/ 100</span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-semibold uppercase ${
              evidence_confidence === "high"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {evidence_confidence} conf
          </span>
        </div>
      </div>

      {/* Main Title & Problem Statement */}
      <div className="space-y-1">
        <h4 className="font-bold text-base text-[#0A1B2A] leading-snug">{title}</h4>
        <p className="text-xs text-slate-600 leading-relaxed">{problem_description}</p>
      </div>

      {/* Verified AI Explanation Box */}
      <div className="bg-[#FAF8F5] border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
          <Sparkles size={13} className="text-[#0069FF]" />
          <span>Why this matters</span>
        </div>
        <p className="text-slate-700 leading-relaxed text-xs">{ai_explanation.why_it_matters}</p>

        <div className="pt-2 border-t border-slate-200/60 text-slate-700 text-xs">
          <span className="font-semibold text-slate-800">Action: </span>
          <span>{ai_explanation.action_rationale}</span>
        </div>
      </div>

      {/* Impact & Recommended Action Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        {expected_impact.revenue_at_risk_mmk ? (
          <span className="text-[11px] font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            At Risk: {expected_impact.revenue_at_risk_mmk.toLocaleString()} MMK
          </span>
        ) : expected_impact.potential_gain_mmk ? (
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Upside: +{expected_impact.potential_gain_mmk.toLocaleString()} MMK
          </span>
        ) : null}

        <button
          onClick={() => onOpenEvidence(opportunity)}
          className="text-[11px] font-semibold text-slate-600 hover:text-[#0069FF] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Audit Evidence Numbers</span>
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-[11px] text-slate-500 font-medium">
          Target: <strong className="text-slate-700">{recommended_action.title}</strong>
        </div>

        <div className="flex items-center gap-1.5">
          {status === "open" && (
            <>
              <button
                onClick={() => onUpdateStatus(id, "accepted")}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer transition-all"
              >
                Accept
              </button>
              <button
                onClick={() => onUpdateStatus(id, "in_progress")}
                className="px-3.5 py-1.5 rounded-lg bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
              >
                <Play size={12} />
                Start Action
              </button>
              <button
                onClick={() => onUpdateStatus(id, "dismissed", "Dismissed by owner")}
                title="Dismiss recommendation"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <XCircle size={15} />
              </button>
            </>
          )}

          {status === "accepted" && (
            <>
              <button
                onClick={() => onUpdateStatus(id, "in_progress")}
                className="px-3 py-1.5 rounded-lg bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play size={12} />
                Start Action
              </button>
              <button
                onClick={() => onOpenCompleteModal(opportunity)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Check size={13} />
                Complete
              </button>
            </>
          )}

          {status === "in_progress" && (
            <button
              onClick={() => onOpenCompleteModal(opportunity)}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check size={13} />
              Complete Action
            </button>
          )}

          {status === "dismissed" && (
            <button
              onClick={() => onUpdateStatus(id, "open")}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              Restore
            </button>
          )}

          {status === "completed" && (
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
              <Check size={13} /> Outcome recorded
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
