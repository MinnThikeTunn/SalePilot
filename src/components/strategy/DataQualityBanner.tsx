import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { DataQualityStatus } from "../../types";

interface DataQualityBannerProps {
  status: DataQualityStatus;
  completenessScore: number;
  missingData: string[];
  warnings: string[];
  freshnessTimestamp: string;
}

export const DataQualityBanner: React.FC<DataQualityBannerProps> = ({
  status,
  completenessScore,
  missingData,
  warnings,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  if (status === "good" && warnings.length === 0) {
    return (
      <div className="bg-[#FAF8F5] border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between text-xs text-[#0A1B2A]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <ShieldCheck size={16} />
          </div>
          <div>
            <span className="font-semibold text-emerald-800">High Data Reliability</span>
            <p className="text-slate-600 text-[11px] mt-0.5">
              100% of order, inventory, and cost metrics verified. Strategy recommendations are fully authoritative.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 font-mono text-[11px] font-medium shrink-0">
          Health: {completenessScore}%
        </span>
      </div>
    );
  }

  const isInsufficient = status === "insufficient";
  const borderColor = isInsufficient ? "border-rose-200" : "border-amber-200";
  const bgBadge = isInsufficient ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className={`bg-white border ${borderColor} rounded-2xl p-4.5 space-y-3 shadow-xs`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${bgBadge} flex items-center justify-center shrink-0 border`}>
            {isInsufficient ? <AlertCircle size={16} /> : <AlertTriangle size={16} />}
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0A1B2A]">
              {isInsufficient ? "Insufficient Business Data" : "Limited Data Coverage"}
            </h4>
            <p className="text-slate-600 text-[11px] mt-0.5">
              {isInsufficient
                ? "Key historical records are missing. Some opportunity types are withheld to avoid ungrounded conclusions."
                : "Certain metrics are based on trailing estimates or partial records."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-medium border ${bgBadge}`}>
            Health: {completenessScore}%
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-semibold text-[#0069FF] hover:underline cursor-pointer"
          >
            {expanded ? "Hide details" : "Review details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
          {missingData.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Missing Information:
              </span>
              <ul className="mt-1 space-y-1 list-disc list-inside text-slate-700 text-[11px]">
                {missingData.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Audited Caveats:
              </span>
              <ul className="mt-1 space-y-1 list-disc list-inside text-slate-600 text-[11px]">
                {warnings.map((warn, idx) => (
                  <li key={idx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
