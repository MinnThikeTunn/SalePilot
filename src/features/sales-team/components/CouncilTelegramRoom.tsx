import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Play,
  Pause,
  FastForward,
  RotateCcw,
  Bot,
  Search,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  Award,
  CheckCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Layers,
} from "lucide-react";
import type { AgentRoleKey, CouncilChatMessage } from "../types/sales-team";
import {
  generateCouncilDeliberationDialogue,
} from "../services/geminiSalesTeamService";
import {
  runCouncilDeliberation,
  type CouncilDeliberationResult,
} from "../services/councilOrchestrator";
import { FormattedChatMessage } from "./FormattedChatMessage";

interface CouncilTelegramRoomProps {
  shopId: string;
  storeName?: string;
  goal: string;
  onGoalChange?: (newGoal: string) => void;
  onDeliberationFinished: (result: CouncilDeliberationResult) => void;
}

export function CouncilTelegramRoom({
  shopId,
  storeName,
  goal,
  onGoalChange,
  onDeliberationFinished,
}: CouncilTelegramRoomProps) {
  const [messages, setMessages] = useState<CouncilChatMessage[]>([]);
  const [fullScript, setFullScript] = useState<CouncilChatMessage[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<"1x" | "2x" | "instant">("1x");
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSynthesizing]);

  // Turn-by-turn playback ticker
  useEffect(() => {
    if (!isPlaying || currentStepIndex >= fullScript.length) {
      if (currentStepIndex >= fullScript.length && fullScript.length > 0 && !isCompleted) {
        setIsPlaying(false);
        setIsCompleted(true);
        // Finalize council result
        const finalResult = runCouncilDeliberation({ shopId, goal });
        finalResult.chatMessages = fullScript;
        onDeliberationFinished(finalResult);
      }
      return;
    }

    const intervalMs = speed === "instant" ? 50 : speed === "2x" ? 1200 : 2500;

    timerRef.current = setTimeout(() => {
      const nextMsg = fullScript[currentStepIndex];
      if (nextMsg) {
        setMessages((prev) => [...prev, nextMsg]);
        setCurrentStepIndex((prev) => prev + 1);
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStepIndex, fullScript, speed, isCompleted, shopId, goal]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartDeliberation = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setHasStarted(true);
    setIsSynthesizing(true);
    setMessages([]);
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setErrorMessage(null);

    try {
      // 1. Generate full deliberation turns with Gemini (or rich fallback)
      const script = await generateCouncilDeliberationDialogue({ shopId, storeName, goal });
      if (!script || script.length === 0) {
        throw new Error("Empty deliberation dialogue generated.");
      }
      setFullScript(script);
      setIsSynthesizing(false);
      setIsPlaying(true);
    } catch (e) {
      console.warn("Council dialogue generation fallback engaged:", e);
      try {
        const fallbackResult = runCouncilDeliberation({ shopId, goal });
        if (fallbackResult.chatMessages && fallbackResult.chatMessages.length > 0) {
          setFullScript(fallbackResult.chatMessages);
          setIsSynthesizing(false);
          setIsPlaying(true);
          return;
        }
      } catch (fallbackErr) {
        console.error("Deterministic council fallback failed:", fallbackErr);
      }
      setIsSynthesizing(false);
      setHasStarted(false);
      setErrorMessage("Council deliberation encountered a network timeout. Please retry.");
    }
  };

  const handlePauseResume = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSkipToEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessages(fullScript);
    setCurrentStepIndex(fullScript.length);
    setIsPlaying(false);
    setIsCompleted(true);

    const finalResult = runCouncilDeliberation({ shopId, goal });
    finalResult.chatMessages = fullScript;
    onDeliberationFinished(finalResult);
  };

  const handleReset = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPlaying(false);
    setMessages([]);
    setFullScript([]);
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setHasStarted(false);
  };

  const getAgentColor = (key: AgentRoleKey) => {
    switch (key) {
      case "commander":
        return { text: "text-blue-700", bg: "bg-blue-50 border-blue-200", badge: "bg-blue-600 text-white" };
      case "scout":
        return { text: "text-sky-700", bg: "bg-sky-50 border-sky-200", badge: "bg-sky-600 text-white" };
      case "echo":
        return { text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-600 text-white" };
      case "guardian":
        return { text: "text-amber-700", bg: "bg-amber-50 border-amber-200", badge: "bg-amber-600 text-white" };
      case "muse":
        return { text: "text-purple-700", bg: "bg-purple-50 border-purple-200", badge: "bg-purple-600 text-white" };
      default:
        return { text: "text-slate-700", bg: "bg-slate-50 border-slate-200", badge: "bg-slate-600 text-white" };
    }
  };

  const getAgentAvatar = (key: AgentRoleKey) => {
    switch (key) {
      case "commander":
        return "/avatars/Commander.jpg";
      case "scout":
        return "/avatars/Scout.jpg";
      case "echo":
        return "/avatars/Echo.jpg";
      case "guardian":
        return "/avatars/Guardian.jpg";
      case "muse":
        return "/avatars/Muse.jpg";
      default:
        return "/avatars/Commander.jpg";
    }
  };

  const getAgentName = (key: AgentRoleKey) => {
    switch (key) {
      case "commander":
        return "Commander";
      case "scout":
        return "Scout";
      case "echo":
        return "Echo";
      case "guardian":
        return "Guardian";
      case "muse":
        return "Muse";
      default:
        return key;
    }
  };

  const getAgentTitle = (key: AgentRoleKey) => {
    switch (key) {
      case "commander":
        return "Strategy Lead";
      case "scout":
        return "Opportunity Hunter";
      case "echo":
        return "Customer Advocate";
      case "guardian":
        return "Profit Protector";
      case "muse":
        return "Campaign Creator";
      default:
        return "Specialist";
    }
  };

  const getAgentIcon = (key: AgentRoleKey) => {
    switch (key) {
      case "scout":
        return <Search size={14} className="text-sky-600" />;
      case "guardian":
        return <ShieldCheck size={14} className="text-amber-600" />;
      case "muse":
        return <Sparkles size={14} className="text-purple-600" />;
      case "echo":
        return <MessageCircle size={14} className="text-emerald-600" />;
      case "commander":
      default:
        return <Award size={14} className="text-blue-600" />;
    }
  };

  const activeTurn = fullScript[currentStepIndex];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[32px] shadow-xs overflow-hidden flex flex-col font-sans">
      {/* 1. Telegram Group Chat Header */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Room Identity & Members */}
        <div className="flex items-center gap-3">
          {/* Avatar Stack */}
          <div className="flex -space-x-2 shrink-0">
            {["commander", "scout", "echo", "guardian", "muse"].map((k) => (
              <div
                key={k}
                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-[#F4F2EC] shadow-2xs"
                title={getAgentName(k as AgentRoleKey)}
              >
                <img
                  src={getAgentAvatar(k as AgentRoleKey)}
                  alt={k}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-[#0A1B2A] tracking-tight">
                Sales Council Chamber
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20">
                5 Specialists Active
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Real-time adversarial debate with Gemini AI
            </p>
          </div>
        </div>

        {/* Right: Playback Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {hasStarted && !isCompleted && (
            <>
              {/* Speed Toggle */}
              <button
                type="button"
                onClick={() =>
                  setSpeed((curr) => (curr === "1x" ? "2x" : curr === "2x" ? "instant" : "1x"))
                }
                className="px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-white border border-[#E2E8F0] text-[#0A1B2A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                title="Change playback speed"
              >
                Speed: {speed.toUpperCase()}
              </button>

              {/* Pause / Play */}
              <button
                type="button"
                onClick={handlePauseResume}
                className="p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#0A1B2A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
                title={isPlaying ? "Pause debate" : "Resume debate"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              {/* Skip to Decision */}
              <button
                type="button"
                onClick={handleSkipToEnd}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E2E8F0] text-[#0A1B2A] hover:bg-[#F4F2EC] transition-colors cursor-pointer flex items-center gap-1"
                title="Skip to final decision"
              >
                <span>Fast-forward</span>
                <FastForward size={13} />
              </button>
            </>
          )}

          {hasStarted && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0A1B2A] hover:bg-[#F4F2EC] border border-transparent hover:border-[#E2E8F0] transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Chat Feed with Telegram Wallpaper Pattern */}
      <div
        ref={scrollRef}
        className="h-[460px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#F8F6F2] relative"
        style={{
          backgroundImage: `radial-gradient(#E2E8F0 0.85px, transparent 0.85px)`,
          backgroundSize: "18px 18px",
        }}
      >
        {/* Welcome Banner when not started */}
        {!hasStarted && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center text-[#0069FF]">
              <Layers size={26} />
            </div>

            <div className="space-y-1.5">
              <h4 className="font-serif text-xl font-normal text-[#0A1B2A]">
                Convene the 5-Agent Sales Chamber
              </h4>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                Watch Commander, Scout, Echo, Guardian, and Muse debate live in a Telegram-style war room. Every proposal is cross-examined against real inventory, buyer friction, and strict margin rules.
              </p>
            </div>

            {errorMessage && (
              <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => handleStartDeliberation()}
                  className="px-2.5 py-1 rounded-lg bg-rose-700 text-white font-semibold text-[11px] hover:bg-rose-800 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Strategic Objective Input */}
            <div className="w-full space-y-1 text-left pt-2">
              <label className="text-xs font-semibold text-[#0A1B2A]">
                Deliberation Strategic Objective:
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => onGoalChange?.(e.target.value)}
                placeholder="e.g. Maximize revenue for upcoming festival without sacrificing contribution margin..."
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-xs sm:text-sm text-[#0A1B2A] focus:outline-none focus:border-[#0069FF] shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={handleStartDeliberation}
              className="px-6 py-3 rounded-xl bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
            >
              <Bot size={16} />
              <span>Convene Full Sales Council</span>
            </button>
          </div>
        )}

        {/* Synthesizing Indicator */}
        {isSynthesizing && (
          <div className="flex items-center justify-center h-full">
            <div className="p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-[#0069FF]">
                <Bot size={20} className="animate-pulse" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider">
                  Gemini Council Orchestrator
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Synthesizing multi-agent debate from store inventory and margin policies...
              </p>
            </div>
          </div>
        )}

        {/* Render Chat Messages */}
        <AnimatePresence>
          {messages.map((msg) => {
            const style = getAgentColor(msg.senderKey);
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-2.5 max-w-2xl"
              >
                {/* Agent Avatar */}
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-[#E2E8F0] shadow-2xs shrink-0 flex items-center justify-center mt-1">
                  <img
                    src={getAgentAvatar(msg.senderKey)}
                    alt={msg.senderKey}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                {/* Telegram Message Bubble */}
                <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-xs p-4 shadow-2xs space-y-2 text-xs sm:text-sm text-[#0A1B2A] leading-relaxed">
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs ${style.text}`}>
                        {getAgentName(msg.senderKey)}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        • {getAgentTitle(msg.senderKey)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#94A3B8] font-mono">
                      <span>{msg.timestamp}</span>
                      <CheckCheck size={13} className="text-[#0069FF]" />
                    </div>
                  </div>

                  {/* Body Text */}
                  <FormattedChatMessage content={msg.content} />

                  {/* Embedded Rich Widgets */}
                  {msg.widget && (
                    <div className="mt-2.5 pt-2 border-t border-[#F1F5F9]">
                      {/* 1. Inventory Table Widget */}
                      {msg.widget.type === "inventory_table" && (
                        <div className="bg-[#FAF8F5] border border-[#E2E8F0] rounded-xl p-3 space-y-1.5 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-xs font-semibold text-[#0A1B2A] border-b border-[#E2E8F0] pb-1">
                            <span>📦 Inventory Telemetry</span>
                            <span className="text-[10px] text-[#64748B]">Scout Audit</span>
                          </div>
                          {msg.widget.data.items?.map((it: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between py-0.5">
                              <span className="text-[#0A1B2A]">{it.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[#64748B]">{it.stock} units</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    it.velocity.includes("Dead")
                                      ? "bg-rose-100 text-rose-800"
                                      : it.velocity.includes("Low")
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {it.velocity}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 2. Margin Calculator Widget */}
                      {msg.widget.type === "margin_calc" && (
                        <div
                          className={`rounded-xl p-3 space-y-1.5 font-mono text-[11px] border ${
                            msg.widget.data.status === "veto"
                              ? "bg-rose-50/70 border-rose-200 text-rose-950"
                              : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold border-b border-black/10 pb-1">
                            <span>
                              {msg.widget.data.status === "veto" ? "🛑 Margin Veto" : "✅ Margin Verified"}
                            </span>
                            <span>Guardian CFO Audit</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Proposed Discount:</span>
                            <span className="font-bold">{msg.widget.data.discountProposed}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Contribution Margin:</span>
                            <span className="font-bold">
                              {msg.widget.data.resultingMarginPct}% (Floor: {msg.widget.data.policyFloorPct}%)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 3. Offer Draft Widget */}
                      {msg.widget.type === "offer_draft" && (
                        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-1 font-mono text-[11px] text-purple-950">
                          <div className="flex items-center justify-between font-semibold border-b border-purple-200/60 pb-1">
                            <span>✨ Proposed Offer Structure</span>
                            <span>Muse Creative</span>
                          </div>
                          <p className="font-bold text-xs">{msg.widget.data.title}</p>
                          <p className="text-[10px] text-purple-800">
                            Bundling: {msg.widget.data.bundleItems?.join(" + ")}
                          </p>
                        </div>
                      )}

                      {/* 4. Decision Summary Widget */}
                      {msg.widget.type === "decision_summary" && (
                        <div className="bg-[#EFF6FF] border border-[#0069FF]/30 rounded-xl p-3 space-y-2 font-mono text-[11px] text-[#0A1B2A]">
                          <div className="flex items-center justify-between font-semibold border-b border-[#0069FF]/20 pb-1 text-[#0069FF]">
                            <span>🎖️ Consensus Strategy Card</span>
                            <span>ICE Score: {msg.widget.data.opportunityScore} / 100</span>
                          </div>
                          <p className="font-bold text-xs">{msg.widget.data.title}</p>
                          <div className="flex items-center justify-between text-[10px] text-[#475569]">
                            <span>Approved Margin: {msg.widget.data.marginPct}%</span>
                            <span className="text-[#0069FF] font-semibold">{msg.widget.data.expectedImpact}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Live Typing Indicator */}
        {isPlaying && activeTurn && (
          <div className="flex items-center gap-2 p-2.5 bg-white/90 border border-[#E2E8F0] rounded-xl text-xs text-[#64748B] w-fit shadow-2xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#0069FF] animate-ping" />
            <span>
              {getAgentName(activeTurn.senderKey)} is speaking (Turn {activeTurn.stepNumber} of{" "}
              {fullScript.length})...
            </span>
          </div>
        )}

        {/* Finished Banner */}
        {isCompleted && (
          <div className="p-4 bg-[#ECFDF5] border border-[#10B981]/30 rounded-2xl text-center space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-center gap-2 text-[#047857] font-semibold text-xs sm:text-sm">
              <CheckCircle2 size={16} />
              <span>Full Sales Council Deliberation Concluded with Unanimous Consensus</span>
            </div>
            <p className="text-xs text-[#065F46]">
              Scroll down to review the synthesized Strategy Decision Card and authorize execution via cryptographic SHA-256 seal.
            </p>
          </div>
        )}
      </div>

      {/* 3. Footer Status Bar */}
      <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]">
            {hasStarted
              ? `Turn ${Math.min(currentStepIndex, fullScript.length)} of ${fullScript.length}`
              : "Council Idle"}
          </span>
          <span className="text-[#CBD5E1]">•</span>
          <span className="hidden sm:inline">
            {isCompleted ? "Deliberation finalized" : isPlaying ? "Live debate in progress" : "Ready"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!hasStarted && (
            <button
              type="button"
              onClick={handleStartDeliberation}
              className="px-4 py-2 rounded-xl bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              Start Deliberation
            </button>
          )}
          {hasStarted && !isCompleted && (
            <button
              type="button"
              onClick={handleSkipToEnd}
              className="text-xs text-[#0069FF] hover:underline font-semibold cursor-pointer"
            >
              Skip to Decision Card →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
