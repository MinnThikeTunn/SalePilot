import React, { useState, useEffect } from "react";
import {
  X,
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Filter,
} from "lucide-react";
import type { BusinessMemory } from "../types/sales-team";
import {
  getBusinessMemories,
  saveBusinessMemory,
  deleteBusinessMemory,
} from "../services/businessMemoryService";

interface BusinessMemoryDrawerProps {
  isOpen: boolean;
  shopId: string;
  onClose: () => void;
}

export function BusinessMemoryDrawer({
  isOpen,
  shopId,
  onClose,
}: BusinessMemoryDrawerProps) {
  const [memories, setMemories] = useState<BusinessMemory[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newType, setNewType] = useState<BusinessMemory["memory_type"]>("owner_correction");
  const [newContent, setNewContent] = useState<string>("");

  const reload = () => {
    setMemories(getBusinessMemories(shopId));
  };

  useEffect(() => {
    if (isOpen) {
      reload();
    }
  }, [isOpen, shopId]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    saveBusinessMemory({
      shopId,
      memoryType: newType,
      content: newContent.trim(),
      sourceRefs: ["manual_owner_rule"],
      confidence: "high",
    });

    setNewContent("");
    setIsAdding(false);
    reload();
  };

  const handleDelete = (id: string) => {
    deleteBusinessMemory(id, shopId);
    reload();
  };

  const filtered = memories.filter((m) => {
    if (filterType === "all") return true;
    return m.memory_type === filterType;
  });

  const getMemoryBadge = (type: BusinessMemory["memory_type"]) => {
    switch (type) {
      case "owner_correction":
        return "bg-rose-100 text-rose-800 border-rose-300";
      case "policy":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "verified_fact":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "experiment_result":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-stone-900/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl h-full max-h-[94vh] bg-white border border-stone-200 rounded-[32px] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 1. Header */}
        <div className="p-6 border-b border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
                <Brain size={18} className="text-purple-600" />
                <span>Business Memory &amp; Feedback Ledger</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-stone-900 text-stone-100">
                Persistent Voice
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              Verified lessons, owner corrections, and past decision outcomes injected into Council deliberation.
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

        {/* 2. Sub-bar Filter & Add button */}
        <div className="px-6 py-3 border-b border-stone-100 bg-white flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {(["all", "owner_correction", "policy", "verified_fact", "experiment_result"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterType(tab)}
                className={`px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer whitespace-nowrap ${
                  filterType === tab
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus size={13} />
            <span>Add Rule</span>
          </button>
        </div>

        {/* 3. Add Custom Rule Form */}
        {isAdding && (
          <form
            onSubmit={handleCreate}
            className="p-5 border-b border-stone-100 bg-purple-50/40 space-y-3 shrink-0 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">Define Verified Merchant Rule:</span>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="text-xs font-bold px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-stone-800"
              >
                <option value="owner_correction">Owner Correction</option>
                <option value="policy">Policy Rule</option>
                <option value="verified_fact">Verified Fact</option>
              </select>
            </div>

            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="e.g. Always offer free tasting cups instead of price discounts on Shan tea..."
              className="w-full p-3 rounded-xl bg-white border border-stone-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-stone-900/10"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Memory Rule
              </button>
            </div>
          </form>
        )}

        {/* 4. Memories List */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-stone-400 space-y-2">
              <Brain size={32} className="mx-auto opacity-30" />
              <p className="text-xs font-bold text-stone-600">No memories stored in this category</p>
              <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                Rejections in the Action Center and confirmed store policies are automatically remembered here to prevent repeating rejected strategies.
              </p>
            </div>
          ) : (
            filtered.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-2xl border border-stone-200/90 bg-[#FAF8F5] space-y-2.5 shadow-2xs group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${getMemoryBadge(
                        mem.memory_type
                      )}`}
                    >
                      {mem.memory_type.replace("_", " ")}
                    </span>
                    <span className="font-mono text-[9px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                      Confidence: {mem.confidence}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(mem.id)}
                    className="text-stone-300 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                    title="Delete Memory"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-xs text-stone-800 font-medium leading-relaxed">
                  "{mem.content}"
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-stone-400 pt-1 border-t border-stone-200/50">
                  <span>Sources: {mem.source_refs.join(", ") || "owner"}</span>
                  <span>Stored: {new Date(mem.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 5. Footer */}
        <div className="p-4 border-t border-stone-100 bg-[#FAF8F5]/80 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>Active feedback ledger continuously injected into deliberations</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 text-stone-800 font-bold hover:bg-stone-300 transition-colors cursor-pointer"
          >
            Close Memory Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
