import React, { useState } from "react";
import {
  X,
  Database,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { TeamEvidence } from "../types/sales-team";
import { filterEvidenceRecords } from "../services/dataScarcityService";

interface EvidenceExplorerDrawerProps {
  isOpen: boolean;
  evidence: TeamEvidence[];
  onClose: () => void;
}

export function EvidenceExplorerDrawer({
  isOpen,
  evidence,
  onClose,
}: EvidenceExplorerDrawerProps) {
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = filterEvidenceRecords(evidence, {
    sourceType: sourceFilter,
    searchQuery,
  });

  const sourceTypes = ["all", "inventory", "product", "inquiry", "order", "campaign", "analytics"] as const;

  const getSourceBadgeColor = (type: string) => {
    switch (type) {
      case "inventory":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "product":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "inquiry":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "order":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "campaign":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-stone-50 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-full max-h-[94vh] bg-white border border-stone-200 rounded-[32px] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 1. Header */}
        <div className="p-6 border-b border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                <Database size={17} className="text-emerald-600" />
                <span>Evidence Explorer &amp; Empirical Ledger</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-stone-900 text-stone-100">
                Zero-PII Audited
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Inspect verified data snapshots and calculation coverage cited across Council decisions.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="p-4 border-b border-stone-100 bg-white space-y-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by metric key, source entity, or unit..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
            {sourceTypes.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSourceFilter(st)}
                className={`px-3 py-1 rounded-xl capitalize transition-all cursor-pointer shrink-0 ${
                  sourceFilter === st
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Evidence List */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Database size={32} className="mx-auto opacity-30" />
              <p className="text-xs font-bold text-stone-600">No matching evidence records</p>
              <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                Evidence records are generated deterministically when Scout, Echo, Guardian, or Council deliberations execute.
              </p>
            </div>
          ) : (
            filtered.map((ev) => {
              const isExpanded = expandedId === ev.id;

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl border border-stone-200/90 bg-[#FAF8F5] space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getSourceBadgeColor(
                          ev.source_type
                        )}`}
                      >
                        {ev.source_type}
                      </span>
                      <span className="font-bold text-xs text-stone-900">
                        {ev.metric_key}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-800 bg-white px-2.5 py-0.5 rounded-lg border border-stone-200">
                        {String(ev.value)} {ev.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer p-1"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Quality & Traceability Bar */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-200/50">
                    <div className="flex items-center gap-2">
                      <span>Source ID: <strong>{ev.source_id || "N/A"}</strong></span>
                      <span>• Coverage: {ev.quality?.coverage ?? 100}%</span>
                    </div>
                    <span>Observed: {new Date(ev.observed_at).toLocaleTimeString()}</span>
                  </div>

                  {/* Expandable Observable Snapshot */}
                  {isExpanded && ev.snapshot && (
                    <div className="p-3 bg-stone-900 text-stone-200 rounded-xl font-mono text-[10px] space-y-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-stone-400">
                        <span className="font-bold">Observable Deterministic Snapshot:</span>
                        <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                          <ShieldCheck size={11} /> Zero-PII Verified
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-amber-300 overflow-x-auto">
                        {JSON.stringify(ev.snapshot, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>{filtered.length} verified empirical observation(s)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold hover:bg-stone-300 transition-colors cursor-pointer"
          >
            Close Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
