import React, { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import type { SalesOpportunity } from "../../types";

interface OutcomeModalProps {
  opportunity: SalesOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onRecord: (opportunity: SalesOpportunity, notes: string, observationDays: number) => Promise<void>;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onRecord,
}) => {
  const [notes, setNotes] = useState("");
  const [periodDays, setPeriodDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !opportunity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRecord(opportunity, notes, periodDays);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-[28px] max-w-lg w-full shadow-xl p-6 space-y-5 text-[#0A1B2A]">
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-[#0A1B2A]">Record Completed Action</h3>
            <p className="text-xs text-slate-500 mt-0.5">{opportunity.title}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Action Notes & Implementation Details
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Launched weekend 10% promo on top items; announced in Telegram channel."
              rows={3}
              className="w-full bg-[#FAF8F5] border border-slate-200 rounded-xl p-3 text-xs text-[#0A1B2A] focus:outline-none focus:border-[#0069FF]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Post-Action Observation Window
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setPeriodDays(days)}
                  className={`py-2 rounded-xl font-mono font-semibold cursor-pointer border text-center transition-all ${
                    periodDays === days
                      ? "bg-[#0A1B2A] text-white border-[#0A1B2A]"
                      : "bg-[#FAF8F5] text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              The Strategy Desk will track subsequent sales and compare them against this baseline.
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
            >
              <CheckCircle2 size={14} />
              {submitting ? "Recording..." : "Save & Complete"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
