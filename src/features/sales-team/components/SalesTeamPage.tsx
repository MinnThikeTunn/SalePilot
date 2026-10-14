import React from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Bot,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Store,
  LogOut,
  Globe,
  Sliders,
  Database,
  Brain,
  Lock,
} from "lucide-react";
import { TeamRoom } from "./TeamRoom";

interface SalesTeamPageProps {
  shopId: string;
  storeName?: string;
  ownerName?: string;
  onBackToDashboard: () => void;
  onNavigateToInsights?: () => void;
  user?: any;
  lang?: string;
  toggleLang?: () => void;
  t?: (key: string) => string;
  signOut?: () => void;
}

export function SalesTeamPage({
  shopId,
  storeName,
  ownerName,
  onBackToDashboard,
  onNavigateToInsights,
  user,
  lang = "en",
  toggleLang,
  t = (key: string) => key,
  signOut,
}: SalesTeamPageProps) {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0A1B2A] flex flex-col font-sans selection:bg-[#EFF6FF] selection:text-[#0069FF]">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back to Dashboard & Brand Identity */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#475569] hover:text-[#0A1B2A] hover:bg-[#F4F2EC] border border-transparent hover:border-[#E2E8F0] transition-all cursor-pointer"
              title="Return to Store Operations Dashboard"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Store Dashboard</span>
            </button>

            <div className="h-4 w-px bg-[#E2E8F0] hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <span className="font-serif text-lg sm:text-xl font-medium tracking-tight text-[#0A1B2A]">
                {storeName || "Sales Brain AI"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20">
                <Bot size={11} />
                <span>Sales Council</span>
              </span>
            </div>
          </div>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Store Engine Synced Status */}
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#047857] border border-[#10B981]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Store Engine Synced</span>
            </span>

            {/* Language Toggle */}
            {toggleLang && (
              <button
                type="button"
                onClick={toggleLang}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#475569] hover:text-[#0A1B2A] hover:bg-[#F4F2EC] border border-[#E2E8F0] transition-colors cursor-pointer"
                title="Toggle Language"
              >
                <Globe size={13} className="text-[#64748B]" />
                <span className="font-mono text-[11px] uppercase">{lang}</span>
              </button>
            )}

            {/* User / Sign Out */}
            {signOut && (
              <button
                type="button"
                onClick={signOut}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold text-[#64748B] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Sign Out"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <TeamRoom
            shopId={shopId}
            storeName={storeName}
            onNavigateToInsights={onNavigateToInsights}
          />
        </motion.div>
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-[#E2E8F0] py-6 px-4 sm:px-8 text-center text-xs text-[#64748B] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Sales Brain AI • Autonomous Commerce Council for Independent Merchants</p>
          <p className="text-[11px] font-mono text-[#64748B]">
            All agent proposals require explicit merchant authorization before execution
          </p>
        </div>
      </footer>
    </div>
  );
}
