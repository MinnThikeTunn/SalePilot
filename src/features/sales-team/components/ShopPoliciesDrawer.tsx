import React, { useState } from "react";
import { X, ShieldCheck, Check, RotateCcw } from "lucide-react";
import type { ShopBusinessPolicy } from "../types/sales-team";

interface ShopPoliciesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  policy: ShopBusinessPolicy;
  onSave: (policy: Partial<ShopBusinessPolicy>) => void;
}

export function ShopPoliciesDrawer({
  isOpen,
  onClose,
  policy,
  onSave,
}: ShopPoliciesDrawerProps) {
  const [minMargin, setMinMargin] = useState(policy.min_contribution_margin_pct);
  const [maxDiscount, setMaxDiscount] = useState(policy.max_discount_pct);
  const [requireDelivery, setRequireDelivery] = useState(policy.require_delivery_fee_coverage);
  const [returnAllowance, setReturnAllowance] = useState(policy.max_cod_return_allowance_pct);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      min_contribution_margin_pct: Number(minMargin),
      max_discount_pct: Number(maxDiscount),
      require_delivery_fee_coverage: Boolean(requireDelivery),
      max_cod_return_allowance_pct: Number(returnAllowance),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleReset = () => {
    setMinMargin(15);
    setMaxDiscount(20);
    setRequireDelivery(true);
    setReturnAllowance(10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-stone-200 rounded-[32px] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900 tracking-tight">
                Guardian Shop Guardrails
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                Deterministic profit policies enforced on every council proposal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close dialog"
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0A1B2A] hover:bg-[#F4F2EC] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0069FF]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sliders & Controls */}
        <div className="space-y-5">
          {/* Minimum Contribution Margin */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">
                Minimum Contribution Margin Floor
              </span>
              <span className="font-mono font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md text-[11px]">
                {minMargin}%
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Guardian automatically vetoes any campaign or bundle with contribution margin lower than this threshold.
            </p>
            <input
              type="range"
              min={5}
              max={40}
              step={1}
              value={minMargin}
              onChange={(e) => setMinMargin(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>5% (Aggressive)</span>
              <span>15% (Recommended)</span>
              <span>40% (Ultra-safe)</span>
            </div>
          </div>

          {/* Maximum Discount Ceiling */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">
                Maximum Promotional Discount Ceiling
              </span>
              <span className="font-mono font-black text-stone-800 bg-stone-200/80 px-2 py-0.5 rounded-md text-[11px]">
                {maxDiscount}%
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Muse is restricted from offering price cuts exceeding this percentage.
            </p>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-mono">
              <span>5%</span>
              <span>20% (Standard)</span>
              <span>50% (Clearance)</span>
            </div>
          </div>

          {/* COD Return Rate Allowance */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-stone-800">
                Courier COD Return Risk Allowance
              </span>
              <span className="font-mono font-black text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md text-[11px]">
                {returnAllowance}%
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Estimated percentage of COD parcels rejected at doorstep in Myanmar commerce deducted from gross margin.
            </p>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={returnAllowance}
              onChange={(e) => setReturnAllowance(Number(e.target.value))}
              className="w-full accent-stone-900 cursor-pointer"
            />
          </div>

          {/* Require Delivery Coverage Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80">
            <div>
              <p className="text-xs font-bold text-stone-800">
                Enforce Delivery Fee Protection
              </p>
              <p className="text-[11px] text-stone-500">
                Disallow free delivery promotions unless net order value exceeds 25,000 MMK
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequireDelivery(!requireDelivery)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                requireDelivery ? "bg-stone-900" : "bg-stone-300"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  requireDelivery ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Restore Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-stone-900 hover:bg-stone-800 text-white flex items-center gap-2 cursor-pointer shadow-sm transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>Policies Saved</span>
                </>
              ) : (
                <span>Save Guardrails</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
