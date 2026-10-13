import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Send,
  Sliders,
  Copy,
  Check,
  Eye,
  FileCode,
  Zap,
} from "lucide-react";
import type { TeamApproval } from "../types/sales-team";
import {
  getApprovalsForShop,
  approveAction,
  rejectAction,
  verifyAndExecuteAction,
  canonicalStringify,
} from "../services/approvalService";

interface ActionCenterDrawerProps {
  isOpen: boolean;
  shopId: string;
  onClose: () => void;
  onActionExecuted?: () => void;
}

export function ActionCenterDrawer({
  isOpen,
  shopId,
  onClose,
  onActionExecuted,
}: ActionCenterDrawerProps) {
  const [approvals, setApprovals] = useState<TeamApproval[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "executed" | "invalidated">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inspectPayloadId, setInspectPayloadId] = useState<string | null>(null);
  const [executionNotice, setExecutionNotice] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const reload = () => {
    setApprovals(getApprovalsForShop(shopId));
  };

  useEffect(() => {
    if (isOpen) {
      reload();
    }
  }, [isOpen, shopId]);

  if (!isOpen) return null;

  const handleApprove = (id: string) => {
    approveAction(id, "store_owner");
    reload();
  };

  const handleReject = (id: string) => {
    rejectAction(id, "Rejected by store owner");
    reload();
  };

  const handleExecute = (id: string) => {
    const result = verifyAndExecuteAction(id);
    if (result.success) {
      setExecutionNotice({
        id,
        success: true,
        message: "Action successfully executed! Telegram campaign dispatched.",
      });
      if (onActionExecuted) onActionExecuted();
    } else {
      setExecutionNotice({
        id,
        success: false,
        message: result.reason || "Action failed execution verification.",
      });
    }
    reload();
  };

  const handleCopyHash = (id: string, hash: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(hash);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const filteredApprovals = approvals.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const getStatusBadge = (status: TeamApproval["status"]) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "approved":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "executed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "invalidated":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "rejected":
        return "bg-stone-200 text-stone-700 border-stone-300";
      default:
        return "bg-stone-100 text-stone-600 border-stone-200";
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
                <Lock size={16} className="text-amber-600" />
                <span>Action Center &amp; Cryptographic Approvals</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-stone-900 text-stone-100">
                SHA-256 Sealed
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Review, approve, or execute council-drafted actions with immutable pre-execution safety.
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

        {/* 2. Sub-nav Filters */}
        <div className="px-6 py-3 border-b border-stone-100 bg-white flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {(["all", "pending", "approved", "executed", "invalidated"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-stone-400">
            {filteredApprovals.length} item(s)
          </span>
        </div>

        {/* 3. List of Action Approvals */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {filteredApprovals.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Lock size={32} className="mx-auto opacity-30" />
              <p className="text-xs font-bold text-stone-600">No actions in this category</p>
              <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                Actions drafted by the Sales Council during deliberation appear here for owner review.
              </p>
            </div>
          ) : (
            filteredApprovals.map((appr) => {
              const isInspect = inspectPayloadId === appr.id;
              const notice = executionNotice?.id === appr.id ? executionNotice : null;

              return (
                <div
                  key={appr.id}
                  className="p-5 rounded-2xl border border-stone-200/90 bg-[#FAF8F5] space-y-3.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800 uppercase">
                        {appr.action_type.replace("_", " ")}
                      </span>
                      <span
                        className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase ${getStatusBadge(
                          appr.status
                        )}`}
                      >
                        {appr.status}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-stone-400">
                      Created: {new Date(appr.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Execution Notice */}
                  {notice && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                        notice.success
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : "bg-rose-50 text-rose-900 border-rose-200"
                      }`}
                    >
                      {notice.success ? (
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <span>{notice.message}</span>
                    </div>
                  )}

                  {/* Invalidated warning */}
                  {appr.status === "invalidated" && !notice && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                      <AlertTriangle size={14} className="text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[11px]">ADR-0003 Pre-execution Guard Triggered:</p>
                        <p className="text-[11px] mt-0.5">
                          Underlying product stock or pricing was modified in the store after this action was approved. This approval was automatically invalidated to protect business integrity.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Payload Summary */}
                  <div className="p-3.5 bg-white border border-stone-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-stone-900 text-[11px]">Action Parameters:</p>
                    <div className="font-mono text-[10px] text-stone-600 space-y-0.5">
                      {Object.entries(appr.approved_payload).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="text-stone-400">{k}:</span>
                          <span className="text-stone-800 font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SHA-256 Hash Seal */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-stone-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Lock size={11} className="text-amber-600" />
                      <span>SHA-256:</span>
                      <span className="text-stone-800 font-bold bg-stone-100 px-1.5 py-0.5 rounded">
                        {appr.approved_payload_hash.slice(0, 20)}...
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(appr.id, appr.approved_payload_hash)}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer p-0.5"
                        title="Copy full 64-char hash"
                      >
                        {copiedId === appr.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectPayloadId(isInspect ? null : appr.id)}
                      className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <FileCode size={11} />
                      <span>{isInspect ? "Hide JSON" : "Inspect Canonical JSON"}</span>
                    </button>
                  </div>

                  {isInspect && (
                    <div className="p-3 bg-stone-900 text-stone-200 rounded-xl font-mono text-[10px] space-y-1">
                      <p className="text-stone-400 font-bold">Canonical Payload for Hashing:</p>
                      <pre className="whitespace-pre-wrap text-amber-300">
                        {canonicalStringify(appr.approved_payload)}
                      </pre>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200/60">
                    {appr.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReject(appr.id)}
                          className="px-3 py-1.5 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-100 text-xs font-bold cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(appr.id)}
                          className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <Lock size={12} />
                          <span>Approve &amp; Seal Hash</span>
                        </button>
                      </>
                    )}

                    {appr.status === "approved" && (
                      <button
                        type="button"
                        onClick={() => handleExecute(appr.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Zap size={12} />
                        <span>Execute Action Now</span>
                      </button>
                    )}

                    {appr.status === "executed" && (
                      <span className="text-emerald-700 font-mono text-[10px] font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Executed &amp; Dispatched
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Immutable SHA-256 Action Ledger</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold hover:bg-stone-300 transition-colors cursor-pointer"
          >
            Close Action Center
          </button>
        </div>
      </div>
    </div>
  );
}
