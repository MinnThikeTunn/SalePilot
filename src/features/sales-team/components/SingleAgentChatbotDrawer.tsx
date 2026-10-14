import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Sparkles,
  Bot,
  RotateCcw,
  Lock,
  ShieldCheck,
  Search,
  MessageCircle,
  Award,
  Loader2,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Database,
  CheckCircle2,
} from "lucide-react";
import type { AgentRosterInfo } from "../services/salesTeamApi";
import type { AgentChatMessage } from "../types/sales-team";
import { generateAgentChatResponse } from "../services/geminiSalesTeamService";
import { FormattedChatMessage } from "./FormattedChatMessage";

interface SingleAgentChatbotDrawerProps {
  isOpen: boolean;
  agent: AgentRosterInfo | null;
  shopId: string;
  storeName?: string;
  onClose: () => void;
}

function AgentAvatar({
  avatarUrl,
  name,
  icon,
  size = "md",
}: {
  avatarUrl?: string;
  name: string;
  icon: React.ReactNode;
  size?: "sm" | "md";
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [avatarUrl]);

  const sizeClasses = size === "sm" ? "w-8 h-8 rounded-xl" : "w-12 h-12 rounded-2xl";

  return (
    <div
      className={`relative ${sizeClasses} overflow-hidden bg-[#F4F2EC] border border-[#E2E8F0] shadow-2xs shrink-0 flex items-center justify-center`}
    >
      {!hasError && avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {icon}
        </div>
      )}
    </div>
  );
}

export function SingleAgentChatbotDrawer({
  isOpen,
  agent,
  shopId,
  storeName,
  onClose,
}: SingleAgentChatbotDrawerProps) {
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize greeting whenever agent changes
  useEffect(() => {
    if (agent) {
      const greetingMsg: AgentChatMessage = {
        id: `greeting-${agent.key}-${Date.now()}`,
        role: "assistant",
        senderKey: agent.key,
        content: `Hello! I'm **${agent.name}**, your ${agent.title}.\n\n*"${agent.motto}"*\n\nI have real-time access to **${storeName || "your store"}**'s live catalog, orders, and business guardrails. How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([greetingMsg]);
    }
  }, [agent?.key, shopId, storeName]);

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen || !agent) return null;

  const getAgentIcon = (key: string, size = 18) => {
    switch (key) {
      case "scout":
        return <Search size={size} className="text-[#0069FF]" />;
      case "guardian":
        return <ShieldCheck size={size} className="text-amber-600" />;
      case "muse":
        return <Sparkles size={size} className="text-purple-600" />;
      case "echo":
        return <MessageCircle size={size} className="text-emerald-600" />;
      case "commander":
        return <Award size={size} className="text-[#0A1B2A]" />;
      default:
        return <Bot size={size} className="text-[#64748B]" />;
    }
  };

  const getAgentPresets = (key: string): string[] => {
    switch (key) {
      case "scout":
        return [
          "Check low stock hazards",
          "Identify dead stock (>45 days)",
          "Top repeat buyer items",
        ];
      case "guardian":
        return [
          "Simulate 15% festival discount",
          "Test 3,500 MMK COD delivery fee",
          "Audit contribution margins on all items",
        ];
      case "echo":
        return [
          "Analyze checkout drop-offs",
          "Review delivery fee objections",
          "Address prepayment trust hesitation",
        ];
      case "muse":
        return [
          "Draft Thadingyut flash sale post",
          "Create high-margin bundle offer",
          "Write urgency re-engagement message",
        ];
      case "commander":
      default:
        return [
          "Summarize top strategic priorities",
          "Evaluate volume vs. margin trade-offs",
          "Prioritize this week's action items",
        ];
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg: AgentChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await generateAgentChatResponse({
        agentKey: agent.key,
        agentName: agent.name,
        agentTitle: agent.title,
        personaPrompt: agent.systemPersonaPrompt,
        motto: agent.motto,
        shopId,
        storeName,
        userMessage: text,
        history: messages,
      });

      const botMsg: AgentChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        senderKey: agent.key,
        content: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        toolCalls: result.toolCalls,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat generation failed:", err);
      const errorMsg: AgentChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        senderKey: agent.key,
        content: `I encountered an unexpected issue connecting to the inference engine. Please try again or rephrase your inquiry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    if (agent) {
      const greetingMsg: AgentChatMessage = {
        id: `greeting-${agent.key}-${Date.now()}`,
        role: "assistant",
        senderKey: agent.key,
        content: `Conversation refreshed. I'm ready to investigate new parameters for **${agent.name}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([greetingMsg]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-[#0A1B2A]/40 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-2xl h-full max-h-[94vh] bg-white border border-[#E2E8F0] rounded-[32px] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 1. Header */}
        <div className="p-5 sm:p-6 border-b border-[#E2E8F0] bg-[#FAF8F5]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <AgentAvatar
              avatarUrl={agent.avatarUrl}
              name={agent.name}
              icon={getAgentIcon(agent.key, 20)}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0A1B2A] tracking-tight">
                  {agent.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20">
                  {agent.specialty}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#ECFDF5] text-[#047857]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Gemini AI Active
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">
                {agent.title} • {agent.persona}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0A1B2A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#0A1B2A] hover:bg-[#F4F2EC] transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2. Chat Feed Body */}
        <div ref={scrollRef} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 bg-[#FAF8F5]/40">
          {/* Persona Motto Callout */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-xs space-y-1">
            <p className="font-semibold text-amber-900 flex items-center gap-1.5">
              <span>Persona Motto:</span>
            </p>
            <p className="text-amber-800 italic text-[11px] leading-relaxed">
              "{agent.motto}"
            </p>
          </div>

          {/* Privacy Guarantee Note for Echo */}
          {agent.key === "echo" && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 flex items-center gap-2.5">
              <Lock size={15} className="text-emerald-700 shrink-0" />
              <span>
                <strong>Zero-PII Privacy Guarantee:</strong> Echo inspects anonymized conversation stages and drop-offs. Customer names, phone numbers, and raw chat logs are strictly omitted from analysis.
              </span>
            </div>
          )}

          {/* Policy Lock Note for Guardian */}
          {agent.key === "guardian" && (
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-center gap-2.5">
              <ShieldCheck size={15} className="text-[#0069FF] shrink-0" />
              <span>
                <strong>Profit Guardrails Active:</strong> Evaluates deterministic contribution margins including courier COD return risks. Vetoes any proposal below policy threshold.
              </span>
            </div>
          )}

          {/* Render Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}
              >
                {!isUser && (
                  <div className="mt-1">
                    <AgentAvatar
                      avatarUrl={agent.avatarUrl}
                      name={agent.name}
                      icon={getAgentIcon(agent.key, 14)}
                      size="sm"
                    />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-2xs space-y-2 ${
                    isUser
                      ? "bg-[#0069FF] text-white rounded-br-xs"
                      : "bg-white border border-[#E2E8F0] text-[#0A1B2A] rounded-bl-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 font-mono mb-1">
                    <span>{isUser ? "You (Merchant)" : agent.name}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <FormattedChatMessage content={msg.content} isUser={isUser} />

                  {/* Render Tool Calls Badge if available */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="pt-2 border-t border-[#E2E8F0] mt-2 space-y-1.5">
                      {msg.toolCalls.map((tc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E2E8F0] text-[10px] text-[#475569] font-mono"
                        >
                          <Database size={11} className="text-[#0069FF] shrink-0" />
                          <span className="font-semibold text-[#0A1B2A]">{tc.toolName}:</span>
                          <span className="truncate">{tc.summary}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-[#64748B] p-2 bg-white/70 border border-[#E2E8F0] rounded-xl w-fit">
              <Loader2 size={13} className="animate-spin text-[#0069FF]" />
              <span className="font-mono text-[11px]">
                {agent.name} is querying store context and computing with Gemini...
              </span>
            </div>
          )}
        </div>

        {/* 3. Preset Suggestion Chips & Input Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-white space-y-3 shrink-0">
          {/* Quick Inquiry Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[10px] font-mono uppercase text-[#94A3B8] shrink-0 font-bold">
              Suggested:
            </span>
            {getAgentPresets(agent.key).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#EFF6FF] hover:text-[#0069FF] border border-[#E2E8F0] hover:border-[#0069FF]/30 text-xs font-medium text-[#475569] transition-all whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Text Input Row */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={`Ask ${agent.name} anything about ${agent.specialty.toLowerCase()}, products, or margins...`}
              className="flex-1 px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#E2E8F0] text-xs sm:text-sm text-[#0A1B2A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/10 transition-all"
            />

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isLoading}
              className="px-5 py-3 rounded-xl bg-[#0069FF] hover:bg-[#0052CC] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
