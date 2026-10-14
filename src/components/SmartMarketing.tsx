import { useState, useEffect, useRef, useMemo } from "react";
import {
  Sparkles,
  Copy,
  Check,
  Image as ImageIcon,
  TrendingUp,
  AlertTriangle,
  Download,
  RotateCw,
  CheckSquare,
  BookOpen,
  Target,
  FlaskConical,
  Rocket,
  BarChart2,
  ChevronRight,
  Info,
  Zap,
  ShoppingBag,
  ArrowUpRight,
  Trophy,
  Clock,
  BookmarkCheck,
  DollarSign,
  Package,
} from "lucide-react";
import { SystemState, CampaignGoal, CampaignOfferType, OfferSimulation, CampaignRecord } from "../types";
import { getState, mutateCampaignRecord } from "../services/clientStore";
import {
  diagnose,
  DiagnosticSignal,
  simulateOffers,
  getBaselineOrders,
  getBaselineRevenue,
  getCampaignOrders,
  getCampaignRevenue,
  getCampaignOrdersList,
  evaluateCampaign,
  CampaignEvaluation,
  buildCopyHints,
} from "../services/campaignEngine";
import { generateBilingual } from "../services/fallbackAi";

interface SmartMarketingProps {
  state: SystemState;
  lang?: "en" | "my";
}

// ─── Stepper config ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Diagnose", icon: BarChart2 },
  { id: 2, label: "Choose", icon: Target },
  { id: 3, label: "Create", icon: Sparkles },
  { id: 4, label: "Launch", icon: Rocket },
  { id: 5, label: "Learn", icon: BookOpen },
];

const PRESET_CAMPAIGNS = [
  { id: "BackToSchool",  name: "Back-to-School",           color: "from-sky-400 to-blue-500",        bannerStyle: "gradient-school" },
  { id: "MonsoonSale",  name: "Monsoon Sale",              color: "from-teal-500 to-cyan-600",       bannerStyle: "gradient-monsoon" },
  { id: "FlashSale",    name: "Weekend Flash Sale",        color: "from-amber-400 to-orange-500",    bannerStyle: "gradient-flash" },
  { id: "Thingyan",     name: "Thingyan Water Festival",   color: "from-yellow-400 to-amber-500",    bannerStyle: "gradient-gold" },
  { id: "Christmas",    name: "Christmas Season",          color: "from-emerald-500 to-rose-600",    bannerStyle: "gradient-christmas" },
  { id: "NewYear",      name: "New Year Bash",             color: "from-amber-600 to-stone-900",     bannerStyle: "gradient-newyear" },
  { id: "Valentine",    name: "Valentine's Day",           color: "from-pink-400 to-red-500",        bannerStyle: "gradient-valentine" },
];

const GOAL_LABELS: Record<CampaignGoal, string> = {
  more_profit: "Maximise Profit",
  faster_turnover: "Faster Inventory Turnover",
  higher_order_value: "Higher Order Value",
  repeat_purchases: "Repeat Purchases",
};

const OFFER_LABELS: Record<CampaignOfferType, string> = {
  full_price: "Full Price",
  percentage_discount: "Percentage Discount",
  bundle: "Bundle Deal",
  delivery_subsidy: "Free Delivery",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function SignalBadge({ signal }: { signal: DiagnosticSignal }) {
  const styles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    opportunity: "bg-emerald-50 border-emerald-200 text-emerald-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  const icons = {
    warning: AlertTriangle,
    opportunity: ArrowUpRight,
    info: Info,
  };
  const Icon = icons[signal.severity];
  return (
    <div className={`p-4 rounded-xl border ${styles[signal.severity]} space-y-1`}>
      <div className="flex items-center gap-2">
        <Icon size={13} />
        <span className="text-xs font-bold uppercase tracking-wide">{signal.title}</span>
      </div>
      <p className="text-xs leading-relaxed opacity-80">{signal.detail}</p>
      {signal.recommendedCampaign && (
        <span className="inline-block mt-1 text-[10px] font-semibold border border-current/30 rounded-full px-2 py-0.5 opacity-70">
          Recommended: {OFFER_LABELS[signal.recommendedCampaign]}
        </span>
      )}
    </div>
  );
}

function ContributionBar({ sim, max }: { sim: OfferSimulation; max: number }) {
  const pct = max > 0 ? Math.max(0, sim.contributionPerOrder) / max : 0;
  const isNegative = sim.contributionPerOrder < 0;
  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2 transition-all ${
        isNegative ? "border-red-200 bg-red-50" : "border-[#E7E5E4] bg-white hover:border-[#0069FF]/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1C1917]">{sim.label}</span>
        <span className={`text-xs font-bold font-mono ${isNegative ? "text-red-600" : "text-emerald-700"}`}>
          {sim.contributionPerOrder.toLocaleString()} MMK
        </span>
      </div>
      <div className="h-1.5 bg-[#F5F4F2] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNegative ? "bg-red-400" : "bg-emerald-500"}`}
          style={{ width: `${Math.round(pct * 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[#78716C] font-mono">
        <span>Contribution / order</span>
        {sim.breakEvenUnits > 0 && <span>Break-even: {sim.breakEvenUnits} units</span>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SmartMarketing({ state }: SmartMarketingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [campaignRecords, setCampaignRecords] = useState<CampaignRecord[]>(() => {
    const s = getState();
    if (s.campaignRecords && s.campaignRecords.length > 0) return s.campaignRecords;
    return state.campaignRecords ?? [];
  });

  useEffect(() => {
    const s = getState();
    if (s.campaignRecords && s.campaignRecords.length > 0) {
      setCampaignRecords(s.campaignRecords);
    } else if (state.campaignRecords && state.campaignRecords.length > 0) {
      setCampaignRecords(state.campaignRecords);
    }
  }, [state.campaignRecords]);

  // Step 1 — Diagnostics
  const diagnostics = useMemo(
    () => diagnose({ ...state, campaignRecords }),
    [state, campaignRecords]
  );

  // Step 2 — Campaign selection
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal>(diagnostics.topRecommendedGoal);
  const [selectedPreset, setSelectedPreset] = useState("BackToSchool");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedOfferType, setSelectedOfferType] = useState<CampaignOfferType>(diagnostics.topRecommendedOffer);
  const [discountPct, setDiscountPct] = useState(10);
  const [simProduct, setSimProduct] = useState(state.products[0]?.id || "");

  useEffect(() => {
    if (selectedProductIds.length === 0 && state.products.length > 0) {
      setSelectedProductIds(state.products.map((p) => p.id));
    }
  }, [state.products]);

  const simulations = useMemo<OfferSimulation[]>(() => {
    const product = state.products.find((p) => p.id === simProduct) || state.products[0];
    if (!product) return [];
    return simulateOffers({ product });
  }, [simProduct, state.products]);

  const maxContribution = useMemo(
    () => Math.max(...simulations.map((s) => Math.max(0, s.contributionPerOrder)), 1),
    [simulations]
  );

  // Step 3 — Copy generation
  const [copy, setCopy] = useState<ReturnType<typeof generateBilingual> | null>(null);
  const [copyLang, setCopyLang] = useState<"en" | "my">("en");
  const [activeTabCopy, setActiveTabCopy] = useState<"facebook" | "instagram" | "ad" | "email">("facebook");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<"A" | "B">("A");

  // Poster state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [posterTitle, setPosterTitle] = useState("Special Campaign");
  const [posterSubtitle, setPosterSubtitle] = useState("Order via Telegram today!");
  const [posterDiscount, setPosterDiscount] = useState("10% OFF");
  const [posterAccent, setPosterAccent] = useState("#eab308");
  const [posterBg, setPosterBg] = useState("gradient-gold");
  const [selectedProduct, setSelectedProduct] = useState(state.products[0]?.id || "");
  const [productImgElement, setProductImgElement] = useState<HTMLImageElement | null>(null);
  const [lastLoadedUrl, setLastLoadedUrl] = useState("");

  // Step 4 — Launch
  const [launchedCampaignId, setLaunchedCampaignId] = useState<string | null>(null);
  const [launchTime, setLaunchTime] = useState<string | null>(null);

  // Step 5 — Measure & Playbook
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [playbookNotes, setPlaybookNotes] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Product image loader
  useEffect(() => {
    const product = state.products.find((p) => p.id === selectedProduct);
    if (product?.image && product.image !== lastLoadedUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => { setProductImgElement(img); setLastLoadedUrl(product.image); };
      img.onerror = () => { setProductImgElement(null); setLastLoadedUrl(product.image); };
      img.src = product.image;
    } else if (!product?.image) {
      setProductImgElement(null);
    }
  }, [selectedProduct, state.products, lastLoadedUrl]);

  // Generate copy when entering step 3
  const buildCopy = () => {
    const products = state.products.filter((p) => selectedProductIds.includes(p.id));
    if (products.length === 0) return;
    const hints = buildCopyHints(
      products,
      selectedOfferType === "percentage_discount" ? discountPct : 0,
      selectedOfferType,
      PRESET_CAMPAIGNS.find((c) => c.id === selectedPreset)?.name ?? selectedPreset,
      state.config.telegramBotUsername || "SmeBot"
    );
    const generated = generateBilingual(hints);
    setCopy(generated);
    // Pre-fill poster
    const preset = PRESET_CAMPAIGNS.find((c) => c.id === selectedPreset);
    if (preset) {
      setPosterBg(preset.bannerStyle);
      if (preset.bannerStyle === "gradient-gold") setPosterAccent("#eab308");
      else if (preset.bannerStyle === "gradient-christmas") setPosterAccent("#ef4444");
      else if (preset.bannerStyle === "gradient-newyear") setPosterAccent("#8b5cf6");
      else if (preset.bannerStyle === "gradient-valentine") setPosterAccent("#ec4899");
      else if (preset.bannerStyle === "gradient-school") setPosterAccent("#0ea5e9");
      else if (preset.bannerStyle === "gradient-monsoon") setPosterAccent("#0d9488");
      else if (preset.bannerStyle === "gradient-flash") setPosterAccent("#f59e0b");
      else setPosterAccent("#6366f1");
    }
    const pName = PRESET_CAMPAIGNS.find((c) => c.id === selectedPreset)?.name ?? selectedPreset;
    setPosterTitle(`${pName} Special`);
    setPosterSubtitle(
      selectedOfferType === "percentage_discount"
        ? `${discountPct}% off — order via Telegram!`
        : selectedOfferType === "bundle"
        ? "Bundle deal — order via Telegram!"
        : selectedOfferType === "delivery_subsidy"
        ? "Free delivery — order via Telegram!"
        : "Order via Telegram today!"
    );
    setPosterDiscount(
      selectedOfferType === "percentage_discount"
        ? `${discountPct}% OFF`
        : selectedOfferType === "bundle"
        ? "BUNDLE"
        : selectedOfferType === "delivery_subsidy"
        ? "FREE DELIVERY"
        : "FULL PRICE"
    );
  };

  // Poster canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = 360, height = 480;
    canvas.width = width; canvas.height = height;

    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    const gradMap: Record<string, [string, string]> = {
      "gradient-gold":      ["#1e1b4b", "#120e2e"],
      "gradient-christmas": ["#022c22", "#021c15"],
      "gradient-newyear":   ["#0f172a", "#1e1b4b"],
      "gradient-valentine": ["#3e0a16", "#180206"],
      "gradient-school":    ["#0c1f30", "#060f18"],
      "gradient-monsoon":   ["#042f2e", "#0f172a"],
      "gradient-flash":     ["#2c1704", "#0c0a09"],
    };
    const [c1, c2] = gradMap[posterBg] ?? ["#090d16", "#1e293b"];
    bgGrad.addColorStop(0, c1); bgGrad.addColorStop(1, c2);
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.beginPath(); ctx.arc(width, 0, 180, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, height, 220, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = posterAccent; ctx.lineWidth = 1.5;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    ctx.fillStyle = "#ffffff"; ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillText(posterTitle.substring(0, 30), width / 2, 60);

    ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(80, 80); ctx.lineTo(280, 80); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(posterSubtitle, width / 2, 105);

    const product = state.products.find((p) => p.id === selectedProduct);
    if (product) {
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(40, 130, 280, 240, 12); ctx.fill(); }
      else ctx.fillRect(40, 130, 280, 240);
      const imgX = 85, imgY = 145, imgW = 190, imgH = 140;
      if (productImgElement) {
        ctx.save();
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH, 8); ctx.clip(); }
        ctx.drawImage(productImgElement, imgX, imgY, imgW, imgH); ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 2;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH, 8); ctx.stroke(); }
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.1)";
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(imgX, imgY, imgW, imgH, 8); ctx.fill(); }
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "italic 11px sans-serif";
        ctx.fillText("[ Product Image ]", width / 2, 220);
      }
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillText(product.name.replace(/\s*\(.*?\)/g, "").trim(), width / 2, 315);
      ctx.fillStyle = posterAccent; ctx.font = "bold 13px monospace";
      ctx.fillText(`${product.price.toLocaleString()} MMK`, width / 2, 345);
    }

    ctx.fillStyle = posterAccent;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(25, 410, 110, 32, 8); ctx.fill(); }
    else ctx.fillRect(25, 410, 110, 32);
    ctx.fillStyle = "#000000"; ctx.font = "bold 12px system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.fillText(posterDiscount, 80, 431);

    ctx.fillStyle = "#E2E8F0"; ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`@${state.config.telegramBotUsername || "SmeBot"}`, width - 30, 420);
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = "9px system-ui, sans-serif";
    ctx.fillText("Order on Telegram Store", width - 30, 436);
  }, [posterTitle, posterSubtitle, posterDiscount, posterAccent, posterBg, selectedProduct, state.products, state.config, productImgElement]);

  const downloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `campaign-${selectedPreset}-${posterDiscount.replace(/%/g, "") || "sale"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLaunch = () => {
    if (!copy) return;
    const now = new Date().toISOString();
    const baselineOrders = getBaselineOrders(state.orders, now);
    const baselineRevenue = getBaselineRevenue(state.orders, now);
    const themeName =
      PRESET_CAMPAIGNS.find((c) => c.id === selectedPreset)?.name ?? selectedPreset;
    const result = mutateCampaignRecord("add", {
      campaignTheme: themeName,
      goal: selectedGoal,
      offer: selectedOfferType,
      discountPct: selectedOfferType === "percentage_discount" ? discountPct : 0,
      selectedProductIds,
      copyEn: copy.facebookEn,
      copyMy: copy.facebookMy,
      launchedAt: now,
      baselineOrders,
      baselineRevenue,
      notes: "",
    });
    setCampaignRecords(result.campaignRecords);
    const newRecord = result.campaignRecords[0];
    setLaunchedCampaignId(newRecord?.id ?? null);
    setSelectedCampaignId(newRecord?.id ?? null);
    setLaunchTime(now);
    setCurrentStep(5);
  };

  // Step 5: Active campaign to evaluate
  const activeRecord = useMemo<CampaignRecord | null>(() => {
    const records = campaignRecords ?? [];
    if (selectedCampaignId) {
      return records.find((c) => c.id === selectedCampaignId) ?? null;
    }
    if (launchedCampaignId) {
      return records.find((c) => c.id === launchedCampaignId) ?? null;
    }
    return records[0] ?? null;
  }, [selectedCampaignId, launchedCampaignId, campaignRecords]);

  // Real campaign evaluation (Before vs After lift)
  const evaluation = useMemo<CampaignEvaluation | null>(() => {
    if (!activeRecord) return null;
    return evaluateCampaign(state.orders, activeRecord);
  }, [activeRecord, state.orders]);

  // Pre-fill playbook note when evaluation or active campaign changes
  useEffect(() => {
    if (activeRecord?.notes) {
      setPlaybookNotes(activeRecord.notes);
    } else if (evaluation?.takeaway) {
      setPlaybookNotes(evaluation.takeaway);
    }
  }, [activeRecord?.id, activeRecord?.notes, evaluation?.takeaway]);

  const handleSavePlaybook = () => {
    if (!activeRecord || !evaluation) return;
    const result = mutateCampaignRecord("update", {
      id: activeRecord.id,
      notes: playbookNotes,
      measuredAt: new Date().toISOString(),
      ordersGenerated: evaluation.campaignOrders,
      revenueGenerated: evaluation.campaignRevenue,
      orderLiftPct: evaluation.orderLiftPct,
      revenueLiftPct: evaluation.revenueLiftPct,
      estimatedMarginDelta: evaluation.estimatedMarginDelta,
      profitImpact: evaluation.profitImpact,
      verdict: evaluation.verdict,
    });
    setCampaignRecords(result.campaignRecords);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleEndCampaign = () => {
    if (!activeRecord) return;
    const now = new Date().toISOString();
    const result = mutateCampaignRecord("update", {
      id: activeRecord.id,
      endedAt: now,
      status: "ended",
    });
    setCampaignRecords(result.campaignRecords);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ─── STEPPER ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <div key={step.id} className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                    isActive
                      ? "bg-[#1C1917] text-white shadow-sm"
                      : isDone
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.id}</span>
                </button>
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={13} className="text-stone-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── STEP 1: DIAGNOSE ─────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric cards */}
            {[
              { label: "Inventory Turnover", value: `${diagnostics.inventoryTurnoverScore}%`, icon: BarChart2, color: diagnostics.inventoryTurnoverScore >= 50 ? "text-emerald-600" : "text-amber-600" },
              { label: "Avg Order Value", value: `${Math.round(diagnostics.avgOrderValue).toLocaleString()} MMK`, icon: ShoppingBag, color: "text-[#0069FF]" },
              { label: "Repeat Customer Rate", value: `${Math.round(diagnostics.repeatCustomerRate * 100)}%`, icon: RotateCw, color: diagnostics.repeatCustomerRate > 0.3 ? "text-emerald-600" : "text-[#78716C]" },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] flex items-center justify-center shrink-0">
                    <Icon size={18} className={m.color} />
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-[#78716C] uppercase tracking-wide">{m.label}</p>
                    <p className={`text-xl font-bold font-mono ${m.color}`}>{m.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3">
              <AlertTriangle size={16} className="text-amber-500" />
              <h3 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">AI Diagnosis Signals</h3>
              <span className="ml-auto text-[11px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-0.5 rounded-full font-semibold uppercase font-mono">Step 1</span>
            </div>
            <div className="space-y-3">
              {diagnostics.signals.map((s) => <SignalBadge key={s.id} signal={s} />)}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="text-xs text-[#78716C] flex-1">
                <span className="font-semibold text-[#1C1917]">Recommended:</span>{" "}
                <span className="font-mono">{GOAL_LABELS[diagnostics.topRecommendedGoal]}</span> via{" "}
                <span className="font-mono">{OFFER_LABELS[diagnostics.topRecommendedOffer]}</span>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedGoal(diagnostics.topRecommendedGoal); setSelectedOfferType(diagnostics.topRecommendedOffer); setCurrentStep(2); }}
                className="px-5 py-2.5 bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98] shrink-0"
              >
                Choose Campaign <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: CHOOSE CAMPAIGN ──────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Goal + Products + Theme */}
            <div className="space-y-4">
              {/* Business goal */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E5E4]">
                  <Target size={14} className="text-[#0069FF]" />
                  <span className="text-[11px] font-mono font-semibold text-[#78716C] uppercase tracking-wider">Business Goal</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(GOAL_LABELS) as CampaignGoal[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedGoal(g)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer select-none ${
                        selectedGoal === g
                          ? "border-[#0069FF] bg-blue-50 text-[#0069FF] font-semibold"
                          : "border-[#E7E5E4] text-[#57534E] hover:border-stone-300"
                      }`}
                    >
                      {GOAL_LABELS[g]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign theme */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E5E4]">
                  <Sparkles size={14} className="text-amber-500" />
                  <span className="text-[11px] font-mono font-semibold text-[#78716C] uppercase tracking-wider">Campaign Theme</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_CAMPAIGNS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedPreset(c.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer select-none relative ${
                        selectedPreset === c.id
                          ? "border-[#1C1917] bg-[#FAF8F5] font-semibold text-[#1C1917]"
                          : "border-[#E7E5E4] text-[#57534E] hover:border-stone-300"
                      }`}
                    >
                      <span className="block leading-tight">{c.name}</span>
                      {selectedPreset === c.id && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#0069FF]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[#E7E5E4]">
                  <CheckSquare size={14} className="text-[#0069FF]" />
                  <span className="text-[11px] font-mono font-semibold text-[#78716C] uppercase tracking-wider">Products to Promote</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {state.products.map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isChecked) {
                            if (selectedProductIds.length > 1) setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer select-none transition-all ${
                          isChecked ? "border-[#0069FF] bg-blue-50/50" : "border-[#E7E5E4] hover:border-stone-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? "bg-[#0069FF] border-[#0069FF]" : "border-[#E7E5E4]"}`}>
                          {isChecked && <Check size={10} strokeWidth={3} className="text-white" />}
                        </div>
                        <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded-lg" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-semibold block truncate text-[#1C1917]">{p.name}</span>
                          <span className="text-[10px] font-mono text-[#78716C]">{p.price.toLocaleString()} MMK</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Profit Simulator */}
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-[#E7E5E4]">
                <TrendingUp size={14} className="text-emerald-600" />
                <span className="text-[11px] font-mono font-semibold text-[#78716C] uppercase tracking-wider">Profit-Safe Offer Simulator</span>
              </div>
              <p className="text-[11px] text-[#78716C] leading-relaxed">
                Contribution per order = Price &minus; Est. COGS (55%) &minus; Fulfilment (1,000 MMK) &minus; Discount &minus; Delivery subsidy.
                All arithmetic — no AI estimates.
              </p>

              {/* Product selector for sim */}
              <div className="space-y-1">
                <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Simulate for product</label>
                <select
                  value={simProduct}
                  onChange={(e) => setSimProduct(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                >
                  {state.products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString()} MMK</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                {simulations.map((sim) => (
                  <ContributionBar key={sim.label} sim={sim} max={maxContribution} />
                ))}
              </div>

              <p className="text-[10px] text-[#78716C] italic">
                Higher volume does not automatically mean higher profit. Always check contribution before approving a discount.
              </p>

              {/* Offer type + discount pct approvals */}
              <div className="space-y-3 pt-2 border-t border-[#E7E5E4]">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Approved Offer Type</label>
                  <select
                    value={selectedOfferType}
                    onChange={(e) => setSelectedOfferType(e.target.value as CampaignOfferType)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                  >
                    {(Object.keys(OFFER_LABELS) as CampaignOfferType[]).map((o) => (
                      <option key={o} value={o}>{OFFER_LABELS[o]}</option>
                    ))}
                  </select>
                </div>
                {selectedOfferType === "percentage_discount" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Approved Discount %</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min={5} max={30} step={5} value={discountPct}
                        onChange={(e) => setDiscountPct(Number(e.target.value))}
                        className="flex-1 accent-[#0069FF]"
                      />
                      <span className="text-sm font-bold font-mono text-[#0069FF] w-12 text-right">{discountPct}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-[#E7E5E4] pt-4">
            <button type="button" onClick={() => setCurrentStep(1)} className="px-4 py-2 bg-[#FAF8F5] border border-[#E7E5E4] text-[#1C1917] text-xs font-semibold rounded-full hover:bg-stone-100 cursor-pointer transition-all">
              &larr; Back to Diagnosis
            </button>
            <button
              type="button"
              onClick={() => { buildCopy(); setCurrentStep(3); }}
              disabled={selectedProductIds.length === 0}
              className="px-5 py-2.5 bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate Campaign Assets <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: CREATE ───────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {!copy ? (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 shadow-2xs text-center space-y-3">
              <Sparkles size={28} className="text-amber-500 mx-auto" />
              <p className="text-sm text-[#78716C]">No assets yet. Go back to Step 2 to configure your campaign.</p>
              <button type="button" onClick={() => setCurrentStep(2)} className="px-4 py-2 bg-[#1C1917] text-white text-xs font-semibold rounded-full cursor-pointer">Back to Step 2</button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Copy section */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-[#0069FF]" />
                    <h3 className="font-serif text-base font-medium text-[#1C1917]">Bilingual Campaign Copy</h3>
                  </div>
                  {/* Language toggle */}
                  <div className="flex border border-[#E7E5E4] rounded-full overflow-hidden bg-[#FAF8F5] select-none shrink-0">
                    {(["en", "my"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setCopyLang(l)}
                        className={`px-3 py-0.5 text-[11px] font-semibold font-mono transition-all cursor-pointer ${
                          copyLang === l ? "bg-[#1C1917] text-white" : "text-[#78716C] hover:bg-stone-100"
                        }`}
                      >
                        {l === "en" ? "English" : "Myanmar"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-[#E7E5E4] gap-3 overflow-x-auto no-scrollbar select-none">
                  {(["facebook", "instagram", "ad", "email"] as const).map((tab) => {
                    const labels = { facebook: "Facebook", instagram: "Instagram", ad: "Ad Copy", email: "Email" };
                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveTabCopy(tab)}
                        className={`pb-2.5 px-1 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                          activeTabCopy === tab ? "border-[#0069FF] text-[#0069FF]" : "border-transparent text-[#78716C] hover:text-[#1C1917]"
                        }`}
                      >
                        {labels[tab]}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E7E5E4] relative min-h-[120px]">
                  <p className="text-xs text-[#1C1917] leading-relaxed whitespace-pre-line select-all">
                    {activeTabCopy === "facebook" && (copyLang === "en" ? copy.facebookEn : copy.facebookMy)}
                    {activeTabCopy === "instagram" && (copyLang === "en" ? copy.instagramEn : copy.instagramMy)}
                    {activeTabCopy === "ad" && (copyLang === "en" ? copy.adEn : copy.adMy)}
                    {activeTabCopy === "email" && (copyLang === "en" ? copy.emailEn : copy.emailMy)}
                  </p>
                  {(activeTabCopy === "facebook" || activeTabCopy === "instagram") && (
                    <div className="mt-3 pt-3 border-t border-[#E7E5E4]">
                      <span className="text-[10px] text-[#0069FF] font-bold uppercase font-mono">Hashtags: </span>
                      <span className="text-[10px] font-mono text-[#78716C]">{copy.hashtags}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      let text = "";
                      if (activeTabCopy === "facebook") text = copyLang === "en" ? copy.facebookEn : copy.facebookMy;
                      if (activeTabCopy === "instagram") text = copyLang === "en" ? copy.instagramEn : copy.instagramMy;
                      if (activeTabCopy === "ad") text = copyLang === "en" ? copy.adEn : copy.adMy;
                      if (activeTabCopy === "email") text = copyLang === "en" ? copy.emailEn : copy.emailMy;
                      copyText(text, activeTabCopy);
                    }}
                    className="absolute bottom-3 right-3 bg-white text-[#1C1917] px-3 py-1.5 rounded-full border border-[#E7E5E4] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:bg-stone-50"
                  >
                    {copiedKey === activeTabCopy ? <><Check size={12} className="text-emerald-700" /><span className="text-emerald-800">Copied!</span></> : <><Copy size={12} /><span>Copy</span></>}
                  </button>
                </div>
              </div>

              {/* A/B Variants */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3">
                  <FlaskConical size={16} className="text-purple-600" />
                  <h3 className="font-serif text-base font-medium text-[#1C1917]">A/B Test Variants</h3>
                  <span className="ml-auto text-[10px] bg-purple-50 text-purple-700 border border-purple-200/60 px-2 py-0.5 rounded-full font-semibold uppercase font-mono">2 variants</span>
                </div>
                <p className="text-[11px] text-[#78716C]">Two different message angles for the same approved offer. Test on comparable audience groups and record outcomes in Step 5.</p>
                <div className="flex gap-2 border-b border-[#E7E5E4]">
                  {(["A", "B"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setActiveVariant(v)}
                      className={`pb-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition-all ${activeVariant === v ? "border-purple-600 text-purple-700" : "border-transparent text-[#78716C]"}`}>
                      Variant {v}
                    </button>
                  ))}
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[#E7E5E4]">
                  <p className="text-xs text-[#1C1917] leading-relaxed select-all">
                    {activeVariant === "A" ? (copyLang === "en" ? copy.variantAEn : copy.variantAMy) : (copyLang === "en" ? copy.variantBEn : copy.variantBMy)}
                  </p>
                  <button type="button" onClick={() => copyText(activeVariant === "A" ? (copyLang === "en" ? copy.variantAEn : copy.variantAMy) : (copyLang === "en" ? copy.variantBEn : copy.variantBMy), `variant-${activeVariant}`)}
                    className="mt-3 bg-white px-3 py-1.5 rounded-full border border-[#E7E5E4] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs hover:bg-stone-50">
                    {copiedKey === `variant-${activeVariant}` ? <><Check size={12} className="text-emerald-700" /><span className="text-emerald-800">Copied!</span></> : <><Copy size={12} /><span>Copy Variant {activeVariant}</span></>}
                  </button>
                </div>
              </div>

              {/* Poster studio */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3">
                  <ImageIcon size={16} className="text-[#0069FF]" />
                  <h3 className="font-serif text-base font-medium text-[#1C1917]">Custom Poster Studio</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-5 flex flex-col items-center bg-[#FAF8F5] p-4 rounded-2xl border border-[#E7E5E4]">
                    <span className="text-[11px] font-mono font-semibold text-[#78716C] uppercase tracking-wider mb-2 select-none">Live Preview (3:4)</span>
                    <div className="w-full max-w-[240px] drop-shadow-md">
                      <canvas ref={canvasRef} className="w-full rounded-xl border border-[#E7E5E4] bg-[#1C1917] aspect-[3/4]" />
                    </div>
                  </div>
                  <div className="md:col-span-7 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Poster Title</label>
                        <input type="text" value={posterTitle} onChange={(e) => setPosterTitle(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs font-semibold text-[#1C1917] focus:outline-none focus:border-[#0069FF]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Promo Badge</label>
                        <input type="text" value={posterDiscount} onChange={(e) => setPosterDiscount(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs font-mono font-semibold text-[#1C1917] focus:outline-none focus:border-[#0069FF]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Subheading / CTA</label>
                      <input type="text" value={posterSubtitle} onChange={(e) => setPosterSubtitle(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Product</label>
                        <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]">
                          {state.products.map((p) => <option key={p.id} value={p.id}>{p.name.replace(/\s*\(.*?\)/g, "").trim()}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">Theme</label>
                        <select value={posterBg} onChange={(e) => { setPosterBg(e.target.value); if (e.target.value === "gradient-gold") setPosterAccent("#eab308"); else if (e.target.value === "gradient-christmas") setPosterAccent("#ef4444"); else if (e.target.value === "gradient-newyear") setPosterAccent("#8b5cf6"); else if (e.target.value === "gradient-valentine") setPosterAccent("#ec4899"); else if (e.target.value === "gradient-school") setPosterAccent("#0ea5e9"); else if (e.target.value === "gradient-monsoon") setPosterAccent("#0d9488"); else if (e.target.value === "gradient-flash") setPosterAccent("#f59e0b"); else setPosterAccent("#6366f1"); }} className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]">
                          <option value="gradient-school">Ocean Wave</option>
                          <option value="gradient-monsoon">Monsoon Rain</option>
                          <option value="gradient-flash">Lightning Rush</option>
                          <option value="gradient-gold">Golden Splash</option>
                          <option value="gradient-christmas">Classic Red</option>
                          <option value="gradient-newyear">Midnight Glow</option>
                          <option value="gradient-valentine">Maroon Love</option>
                          <option value="gradient-midnight">Classic Midnight</option>
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={downloadPoster} className="w-full mt-2 px-5 py-3 bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]">
                      <Download size={14} /> Download Campaign Poster
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#E7E5E4] pt-4">
                <button type="button" onClick={() => setCurrentStep(2)} className="px-4 py-2 bg-[#FAF8F5] border border-[#E7E5E4] text-[#1C1917] text-xs font-semibold rounded-full cursor-pointer hover:bg-stone-100 transition-all">
                  &larr; Back to Campaign
                </button>
                <button type="button" onClick={() => setCurrentStep(4)} className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white font-semibold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]">
                  Ready to Launch <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 4: LAUNCH ───────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3">
              <Rocket size={16} className="text-[#0069FF]" />
              <h3 className="font-serif text-base font-medium text-[#1C1917]">Launch Campaign</h3>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Theme", value: PRESET_CAMPAIGNS.find((c) => c.id === selectedPreset)?.name ?? selectedPreset },
                { label: "Goal", value: GOAL_LABELS[selectedGoal] },
                { label: "Offer", value: OFFER_LABELS[selectedOfferType] },
                { label: "Products", value: `${selectedProductIds.length} selected` },
              ].map((item) => (
                <div key={item.label} className="bg-[#FAF8F5] rounded-xl p-3 border border-[#E7E5E4]">
                  <p className="text-[10px] font-mono text-[#78716C] uppercase">{item.label}</p>
                  <p className="text-xs font-semibold text-[#1C1917] mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 text-xs text-[#78716C]">
              <p className="font-semibold text-[#1C1917]">Before you launch — checklist:</p>
              {[
                "Copy promotional text and share to your Telegram channel or Facebook page",
                "Attach the generated campaign poster to grab visual attention",
                "Ensure your Telegram bot is active and responding to customer chats",
                "Pre-launch baseline recorded: SalePilot automatically tracks orders against your 7-day average",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check size={13} className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {!launchedCampaignId ? (
              <button
                type="button"
                onClick={handleLaunch}
                disabled={!copy}
                className="w-full py-4 bg-[#0069FF] hover:bg-[#0052CC] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-[0.99]"
              >
                <Zap size={18} /> Record Campaign Launch &amp; Start Measuring
              </button>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-700" />
                  <span className="font-bold text-emerald-800 text-sm">Campaign Launched &amp; Tracking!</span>
                </div>
                <p className="text-xs text-emerald-700 font-mono">ID: {launchedCampaignId}</p>
                <p className="text-xs text-emerald-700">
                  Pre-launch baseline: <span className="font-bold">{getBaselineOrders(state.orders, launchTime!)} orders</span> ({getBaselineRevenue(state.orders, launchTime!).toLocaleString()} MMK)
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCampaignId(launchedCampaignId);
                    setCurrentStep(5);
                  }}
                  className="mt-2 px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-emerald-800 transition-all"
                >
                  Go to Measure &amp; Learn →
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[#E7E5E4] pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#E7E5E4] text-[#1C1917] text-xs font-semibold rounded-full cursor-pointer hover:bg-stone-100 transition-all"
            >
              &larr; Back to Assets
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 5: LEARN (PLAYBOOK & REAL LIFT) ──────────────────────────────── */}
      {currentStep === 5 && (
        <div className="space-y-6">
          {!activeRecord || !evaluation ? (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-[#0069FF] flex items-center justify-center mx-auto">
                <BookOpen size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-[#1C1917]">No Active Campaign Yet</h3>
                <p className="text-xs text-[#78716C] max-w-md mx-auto">
                  Launch a campaign from Step 4 to track real before-and-after order lift, profit impact, and build your shop's Campaign Playbook.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white font-semibold text-xs rounded-full cursor-pointer transition-all"
              >
                Choose &amp; Launch Campaign →
              </button>
            </div>
          ) : (
            <>
              {/* Campaign Switcher (if multiple exist) */}
              {campaignRecords.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  <span className="text-[11px] font-mono text-[#78716C] uppercase shrink-0">Campaign:</span>
                  {campaignRecords.map((c) => {
                    const isAct = !c.endedAt;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCampaignId(c.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          activeRecord.id === c.id
                            ? "bg-[#1C1917] text-white shadow-2xs"
                            : "bg-white border border-[#E7E5E4] text-[#78716C] hover:text-[#1C1917]"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAct ? "bg-emerald-500" : "bg-stone-400"}`} />
                        <span>{c.campaignTheme}</span>
                        <span className="text-[10px] opacity-70 font-mono">
                          {isAct ? "Active" : "Ended"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Real Performance Comparison Grid */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7E5E4] pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-[#0069FF]" />
                    <h3 className="font-serif text-base font-medium text-[#1C1917]">
                      {activeRecord.campaignTheme} — Real Impact
                    </h3>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      evaluation.status === "active"
                        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                        : "bg-stone-100 border border-stone-200 text-[#78716C]"
                    }`}>
                      {evaluation.status === "active" ? "● Active" : "Ended"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#78716C] font-mono">
                    <Clock size={11} />
                    <span>
                      {evaluation.status === "active"
                        ? `Running for ${evaluation.durationLabel}`
                        : `Ran for ${evaluation.durationLabel}`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E7E5E4]">
                      {OFFER_LABELS[activeRecord.offer]}
                    </span>
                    {evaluation.status === "active" && (
                      <button
                        type="button"
                        onClick={handleEndCampaign}
                        className="px-2.5 py-0.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full font-semibold cursor-pointer transition-all"
                      >
                        End Campaign
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Baseline Card */}
                  <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E7E5E4] space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#78716C]" />
                      <span className="text-[10px] font-mono text-[#78716C] uppercase">7-Day Pre-Launch Baseline</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-[#1C1917]">{evaluation.baselineOrders} orders</p>
                    <p className="text-[10px] text-[#78716C] font-mono">
                      {evaluation.baselineRevenue.toLocaleString()} MMK · {(evaluation.baselineOrders / 7).toFixed(1)}/day
                    </p>
                  </div>

                  {/* Campaign Actuals */}
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <ShoppingBag size={13} className="text-[#0069FF]" />
                      <span className="text-[10px] font-mono text-[#0069FF] uppercase">Orders In Campaign</span>
                    </div>
                    <p className="text-xl font-bold font-mono text-[#0069FF]">{evaluation.campaignOrders} orders</p>
                    <p className="text-[10px] text-[#78716C] font-mono">
                      {evaluation.campaignRevenue.toLocaleString()} MMK · {evaluation.campaignUnitsSold} units sold
                    </p>
                  </div>

                  {/* Lift */}
                  <div className={`rounded-xl p-4 border space-y-1 ${
                    evaluation.orderLiftPct > 0
                      ? "bg-emerald-50/60 border-emerald-200"
                      : evaluation.orderLiftPct === 0
                      ? "bg-[#FAF8F5] border-[#E7E5E4]"
                      : "bg-rose-50/60 border-rose-200"
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpRight size={13} className={evaluation.orderLiftPct > 0 ? "text-emerald-700" : "text-[#78716C]"} />
                      <span className="text-[10px] font-mono uppercase text-[#78716C]">
                        {evaluation.isEarly ? "Order Lift" : "Daily Pace Lift"}
                      </span>
                    </div>
                    <p className={`text-xl font-bold font-mono ${
                      evaluation.orderLiftPct > 0
                        ? "text-emerald-700"
                        : evaluation.orderLiftPct === 0
                        ? "text-[#1C1917]"
                        : "text-rose-600"
                    }`}>
                      {evaluation.orderLiftPct > 0 ? `+${evaluation.orderLiftPct}%` : `${evaluation.orderLiftPct}%`}
                    </p>
                    <p className="text-[10px] text-[#78716C] font-mono">
                      {evaluation.isEarly ? `Window: ${evaluation.durationLabel}` : "vs 7-day daily average"}
                    </p>
                  </div>

                  {/* Net Margin Impact */}
                  <div className={`rounded-xl p-4 border space-y-1 ${
                    evaluation.profitImpact === "positive"
                      ? "bg-emerald-50/60 border-emerald-200"
                      : evaluation.profitImpact === "negative"
                      ? "bg-amber-50/60 border-amber-200"
                      : "bg-[#FAF8F5] border-[#E7E5E4]"
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={13} className={
                        evaluation.profitImpact === "positive" ? "text-emerald-700" : evaluation.profitImpact === "negative" ? "text-amber-700" : "text-[#78716C]"
                      } />
                      <span className="text-[10px] font-mono uppercase text-[#78716C]">Net Margin Impact</span>
                    </div>
                    <p className={`text-xl font-bold font-mono ${
                      evaluation.profitImpact === "positive"
                        ? "text-emerald-700"
                        : evaluation.profitImpact === "negative"
                        ? "text-amber-700"
                        : "text-[#1C1917]"
                    }`}>
                      {evaluation.estimatedMarginDelta > 0
                        ? `+${evaluation.estimatedMarginDelta.toLocaleString()}`
                        : evaluation.estimatedMarginDelta.toLocaleString()} MMK
                    </p>
                    <p className="text-[10px] text-[#78716C] font-mono">
                      {evaluation.profitImpact === "positive"
                        ? "Margin expanded"
                        : evaluation.profitImpact === "negative"
                        ? "Discount reduced margin"
                        : "Margin neutral"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Automated Strategic Verdict */}
              <div className={`p-5 rounded-2xl border space-y-2 ${
                evaluation.verdict === "Strong Winner"
                  ? "bg-emerald-50 border-emerald-300"
                  : evaluation.verdict === "Profitable Growth"
                  ? "bg-blue-50 border-blue-300"
                  : evaluation.verdict === "Volume Boost Only"
                  ? "bg-amber-50 border-amber-300"
                  : evaluation.verdict === "Underperforming"
                  ? "bg-rose-50 border-rose-300"
                  : "bg-indigo-50 border-indigo-200"
              }`}>
                <div className="flex items-center gap-2">
                  {evaluation.verdict === "Strong Winner" ? (
                    <Trophy size={16} className="text-emerald-700" />
                  ) : evaluation.verdict === "Profitable Growth" ? (
                    <TrendingUp size={16} className="text-blue-700" />
                  ) : evaluation.verdict === "Volume Boost Only" ? (
                    <AlertTriangle size={16} className="text-amber-700" />
                  ) : evaluation.verdict === "Underperforming" ? (
                    <AlertTriangle size={16} className="text-rose-700" />
                  ) : (
                    <Clock size={16} className="text-indigo-700" />
                  )}
                  <span className="font-bold text-sm text-[#1C1917]">{evaluation.headline}</span>
                  <span className={`ml-auto text-[10px] font-semibold uppercase font-mono px-2 py-0.5 rounded-full border ${
                    evaluation.verdict === "Strong Winner"
                      ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                      : evaluation.verdict === "Profitable Growth"
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : evaluation.verdict === "Volume Boost Only"
                      ? "bg-amber-100 border-amber-300 text-amber-800"
                      : evaluation.verdict === "Underperforming"
                      ? "bg-rose-100 border-rose-300 text-rose-800"
                      : "bg-indigo-100 border-indigo-300 text-indigo-800"
                  }`}>
                    {evaluation.verdict}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#57534E]">{evaluation.takeaway}</p>
              </div>

              {/* Live Orders Feed */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#0069FF]" />
                    <h3 className="font-serif text-base font-medium text-[#1C1917]">
                      Live Store Orders Since Launch ({evaluation.campaignOrdersList.length})
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#78716C] font-mono">Captured directly from store orders</span>
                </div>

                {evaluation.campaignOrdersList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#78716C] bg-[#FAF8F5] rounded-xl border border-dashed border-[#E7E5E4] space-y-1">
                    <p className="font-semibold text-[#1C1917]">Awaiting incoming orders</p>
                    <p className="text-[11px]">
                      When customers place orders via your Telegram bot or store, they will automatically appear here and count toward this campaign.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {evaluation.campaignOrdersList.map((ord) => (
                      <div key={ord.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-[#1C1917]">{ord.customerName} ({ord.customerPhone || "Telegram"})</p>
                          <p className="text-[10px] text-[#78716C]">
                            {ord.items.map((i) => `${i.productName} × ${i.quantity}`).join(", ")} · {new Date(ord.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold font-mono text-[#1C1917]">{ord.totalAmount.toLocaleString()} MMK</p>
                          <span className="inline-block text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-white border border-[#E7E5E4] text-[#78716C]">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Closed-Loop Playbook Card */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-[#E7E5E4] pb-3">
                  <BookmarkCheck size={16} className="text-emerald-700" />
                  <div>
                    <h3 className="font-serif text-base font-medium text-[#1C1917]">Campaign Playbook</h3>
                    <p className="text-[11px] text-[#78716C]">
                      Saved learnings are remembered by SalePilot to guide future diagnostic recommendations.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-mono font-semibold text-[#78716C] uppercase">
                    Takeaway / Lesson for Future Campaigns
                  </label>
                  <textarea
                    rows={2}
                    value={playbookNotes}
                    onChange={(e) => setPlaybookNotes(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-3 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF] leading-relaxed resize-none"
                    placeholder="Enter what worked or what to adjust next time..."
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#78716C] font-mono">
                      Verdict: <strong className="text-[#1C1917]">{evaluation.verdict}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleSavePlaybook}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-[0.98]"
                    >
                      {savedSuccess ? (
                        <><Check size={13} /> Saved to Playbook!</>
                      ) : (
                        <><BookmarkCheck size={13} /> Save Takeaway to Playbook</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Campaign History */}
                {campaignRecords.length > 0 && (
                  <div className="border-t border-[#E7E5E4] pt-4 space-y-2">
                    <p className="text-[10px] font-mono font-semibold text-[#78716C] uppercase">Playbook History</p>
                    <div className="space-y-2">
                      {campaignRecords.slice(0, 5).map((rec) => (
                        <div
                          key={rec.id}
                          onClick={() => setSelectedCampaignId(rec.id)}
                          className={`flex items-start justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            activeRecord.id === rec.id
                              ? "border-[#0069FF] bg-blue-50/30"
                              : "border-[#E7E5E4] bg-[#FAF8F5] hover:border-stone-300"
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-[#1C1917] truncate">
                                {rec.campaignTheme} — {OFFER_LABELS[rec.offer]}
                              </p>
                              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full ${
                                !rec.endedAt ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-stone-100 text-[#78716C]"
                              }`}>
                                {!rec.endedAt ? "● Active" : "Ended"}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#78716C] line-clamp-1 italic">
                              {rec.notes || "No takeaway recorded"}
                            </p>
                            <p className="text-[9px] font-mono text-[#78716C]">
                              {new Date(rec.launchedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {rec.endedAt ? ` – ${new Date(rec.endedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : " (ongoing)"}
                              {" · "}{new Date(rec.launchedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            {rec.verdict && (
                              <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E7E5E4] text-[#1C1917]">
                                {rec.verdict}
                              </span>
                            )}
                            <p className="text-[10px] font-mono text-[#78716C] mt-1">
                              {rec.ordersGenerated ?? 0} orders
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex items-center justify-between border-t border-[#E7E5E4] pt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 bg-[#FAF8F5] border border-[#E7E5E4] text-[#1C1917] text-xs font-semibold rounded-full cursor-pointer hover:bg-stone-100 transition-all"
            >
              &larr; Back to Launch
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentStep(1);
                setLaunchedCampaignId(null);
                setLaunchTime(null);
                setCopy(null);
              }}
              className="px-5 py-2.5 bg-[#1C1917] hover:bg-stone-800 text-white font-semibold text-xs rounded-full flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              ↩ Start New Campaign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
