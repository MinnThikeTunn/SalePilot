import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  ArrowRight, 
  Percent, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RotateCw, 
  ShoppingBag, 
  CheckSquare, 
  Share2, 
  Sliders, 
  Award,
  BookOpen
} from "lucide-react";
import { SystemState, Product } from "../types";
import { CustomChart } from "./CustomChart";
import { getAiMarketingImage, getAiMarketingInsights } from "../services/clientStore";

interface SmartMarketingProps {
  state: SystemState;
  lang?: "en" | "my";
}

interface CampaignRecommendation {
  campaignTitle: string;
  rationale: string;
  targetAudience: string;
  discountPercentage: string;
  duration: string;
  expectedImpact: string;
  implementationSteps: string[];
}

interface CopywritingDetail {
  en: string;
  my?: string;
}

interface MarketingInsights {
  trendingProducts: string[];
  underperformingProducts: string[];
  lowStockAlerts: string[];
  analyticsSummary: {
    salesGrowthEstimate: string;
    engagementLevel: string;
    bestSellingCategory: string;
  };
  recommendations: CampaignRecommendation[];
  copywriting: {
    facebookCaption: CopywritingDetail;
    instagramCaption: CopywritingDetail;
    adCopy: CopywritingDetail;
    email: CopywritingDetail;
    hashtags: string;
  };
  bannerPrompt: string;
}

const SM_STRINGS = {
    stepTitle1: "Diagnostics & Campaign Selection",
    stepTitle2: "AI Campaign Strategy & Copywriting",
    stepTitle3: "Custom Poster Studio & Graphic Builder",
    stepBtn1: "1. Theme & Metrics",
    stepBtn2: "2. Strategy & Copy",
    stepBtn3: "3. Visual Studio",
    chooseProdTitle: "Step 1.1 Choose Products to Promote",
    chooseProdDesc: "Select which items from your inventory you want to actively spotlight. Your campaign copywriting will be specially customized to drive high conversions for these items.",
    chooseThemeTitle: "Step 1.2 Select Campaign Theme / Festival",
    chooseThemeDesc: "Select a festival, regional celebration, rainy season sale, or quick flash discount. Clicking any theme will instantly trigger Gemini AI to synthesize tailored copywriting and strategic workflows.",
    recommendedPkgTitle: "Recommended Sales Campaign Package",
    targetAudience: "Target Audience",
    expectedImpact: "Expected Impact",
    promoDiscount: "Promo Discount",
    campaignDuration: "Campaign Duration",
    socialCopyTitle: "AI High-Conversion Social Copywriting",
    hashtagCluster: "HASHTAG CLUSTER:",
    copy: "Copy",
    copied: "Copied!",
    backToTheme: "⇠ Back to Theme Selection",
    configPosters: "Configure Posters Studio (Step 3) ➔",
    backToStrategy: "⇠ Back to AI Strategy (Step 2)",
    startNewCampaign: "↩ Start New Campaign Builder",
    posterStudioTitle: "Custom Promotional Poster Studio",
    posterLivePreview: "Vertical Poster Live Preview (3:4)",
    posterTitleLabel: "Poster Title",
    promoDiscountLabel: "Promo discount text",
    subheadingLabel: "Subheading / Call-To-Action",
    catalogProductLabel: "Catalog Product Item",
    themeTemplateLabel: "Theme Template Style",
    downloadFlyer: "Download 3:4 Custom Campaign Flyer",
    synthesizing: "Synthesizing Strategy Package...",
    generatingFromGemini: "Drawing recommendations and copywriting translations from Gemini AI model...",
    updatingCreative: "Updating Creative assets...",
    noActiveTheme: "No Active Theme",
    noThemeSelected: "No Theme Selected",
    chooseThemeFirst: "Please choose a campaign theme in Step 1 first.",
    goToStep1: "Go to Step 1",
    styleStudents: "Ocean Wave (Students)",
    styleCozy: "Monsoon Rain (Cozy)",
    styleFlash: "Lightning Rush (Flash Sale)",
    styleThingyan: "Golden Splash (Thingyan)",
    styleChristmas: "Classic Red (Christmas)",
    styleNewYear: "Midnight Glow (New Year)",
    styleValentine: "Maroon Love (Valentine)",
    styleGeneral: "Classic Midnight (General)"
  };

export function SmartMarketing({ state, lang = "en" }: SmartMarketingProps) {
  const tSM = (key: keyof typeof SM_STRINGS) => SM_STRINGS[key];

  const PRESET_CAMPAIGNS = [
    { 
      id: "BackToSchool", 
      name: "Back-to-School", 
      desc: "Nutritious school snack boxes & study treats", 
      color: "from-sky-400 to-blue-500", 
      bannerStyle: "school" 
    },
    { 
      id: "MonsoonSale", 
      name: "Monsoon Sale", 
      desc: "Cozy hot brews & sweet comforts for rainy days", 
      color: "from-teal-500 to-cyan-600", 
      bannerStyle: "monsoon" 
    },
    { 
      id: "FlashSale", 
      name: "Weekend Flash Sale", 
      desc: "Limited-time high urgency conversions boost", 
      color: "from-amber-400 to-orange-500", 
      bannerStyle: "flash" 
    },
    { 
      id: "Thingyan", 
      name: "Thingyan Water Festival", 
      desc: "Traditional food & cooling drink promos", 
      color: "from-yellow-400 to-amber-500", 
      bannerStyle: "thingyan" 
    },
    { 
      id: "Christmas", 
      name: "Christmas Season", 
      desc: "Warm family sharing & gift baskets", 
      color: "from-emerald-500 to-rose-600", 
      bannerStyle: "christmas" 
    },
    { 
      id: "NewYear", 
      name: "New Year Bash", 
      desc: "Crunchy snack boards & year-end clearance", 
      color: "from-amber-600 to-stone-900", 
      bannerStyle: "newyear" 
    },
    { 
      id: "Valentine", 
      name: "Valentine's Day", 
      desc: "Sweet traditional dessert couple boxes", 
      color: "from-pink-400 to-red-500", 
      bannerStyle: "valentine" 
    },
  ];
  const [selectedPreset, setSelectedPreset] = useState<string>("BackToSchool");
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<MarketingInsights | null>(null);
  const copyLang = "en";

  
  const [activeTabCopy, setActiveTabCopy] = useState<"facebook" | "instagram" | "ad" | "email">("facebook");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  
  // Custom AI Marketing Campaign selections
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [aspectRatio, setAspectRatio] = useState<string>("3:4");

  // Keep selected product ids synchronized with catalog at start
  useEffect(() => {
    if (selectedProductIds.length === 0 && state.products.length > 0) {
      setSelectedProductIds(state.products.map(p => p.id));
    }
  }, [state.products]);

  // Custom Poster Maker States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [posterTitle, setPosterTitle] = useState<string>("Special New Year Gift Box");
  const [posterSubtitle, setPosterSubtitle] = useState<string>("Get 15% discount today");
  const [posterDiscount, setPosterDiscount] = useState<string>("15% OFF");
  const [posterAccent, setPosterAccent] = useState<string>("#eab308"); // Gold
  const [posterBg, setPosterBg] = useState<string>("gradient-gold"); // gradient selection
  const [selectedProduct, setSelectedProduct] = useState<string>(state.products[0]?.id || "");
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiImageLoading, setAiImageLoading] = useState<boolean>(false);
  const [aiImageError, setAiImageError] = useState<string | null>(null);

  const [productImgElement, setProductImgElement] = useState<HTMLImageElement | null>(null);
  const [lastLoadedUrl, setLastLoadedUrl] = useState<string>("");

  useEffect(() => {
    const product = state.products.find(p => p.id === (selectedProduct || state.products[0]?.id));
    if (product && product.image) {
      if (product.image !== lastLoadedUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setProductImgElement(img);
          setLastLoadedUrl(product.image);
        };
        img.onerror = () => {
          setProductImgElement(null);
          setLastLoadedUrl(product.image);
        };
        img.src = product.image;
      }
    } else {
      setProductImgElement(null);
      setLastLoadedUrl("");
    }
  }, [selectedProduct, state.products, lastLoadedUrl]);

  // Derive dynamic analytics from the state
  const totalOrders = state.orders.length;
  const verifiedOrders = state.orders.filter(o => o.status !== "cancelled");
  const calculatedLoss = state.orders.filter(o => o.status === "cancelled").reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);
  const totalRevenue = verifiedOrders.reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);

  // Dynamic product metrics calculations
  const itemsSold: { [name: string]: number } = {};
  verifiedOrders.forEach(o => {
    o.items.forEach(i => {
      itemsSold[i.productName] = (itemsSold[i.productName] || 0) + i.quantity;
    });
  });

  const productMetrics = state.products.map(p => {
    return {
      name: p.name,
      sold: itemsSold[p.name] || 0,
      stock: p.stock,
      price: p.price
    };
  });

  const bestSellers = [...productMetrics].sort((a, b) => b.sold - a.sold).slice(0, 2);
  const slowSellers = [...productMetrics].sort((a, b) => a.sold - b.sold || b.stock - a.stock).slice(0, 2);

  // Customer engagement metrics stats
  const activeConversationsCount = Object.keys(state.sessions).length;
  const liveTakeoverActive = Object.values(state.sessions).filter(s => s.liveTakeoverActive).length;
  const aiRepliedCount = Object.values(state.sessions).filter(s => !s.liveTakeoverActive).length;

  // Render dummy metrics trend over last 6 months (based on actual revenue or realistic intervals)
  const chartData = [
    { label: "Dec", value: Math.round(totalRevenue * 0.4 + 40000) },
    { label: "Jan", value: Math.round(totalRevenue * 0.55 + 65000) },
    { label: "Feb", value: Math.round(totalRevenue * 0.7 + 90000) },
    { label: "Mar", value: Math.round(totalRevenue * 0.85 + 110000) },
    { label: "Apr", value: Math.round(totalRevenue * 1.1 + 180000) }, // Searing high seasonal performance
    { label: "May", value: totalRevenue }
  ];

  // Load backend insights
  const fetchMarketingInsights = async (campaign: string) => {
    setLoading(true);
    try {
      const data = await getAiMarketingInsights(campaign, selectedProductIds);
      if (data.success && data.insights) {
        setInsights(data.insights as unknown as MarketingInsights);
        // Prepopulate text poster configurations based on AI descriptions
        const rec = data.insights.recommendations[0];
        if (rec) {
          setPosterTitle(rec.campaignTitle.substring(0, 28));
          setPosterSubtitle(`Get ${rec.discountPercentage} storewide discount!`);
          setPosterDiscount(rec.discountPercentage || "10% OFF");
          setChecklist(new Array(rec.implementationSteps.length).fill(false));
        }
        
        // Auto select beautiful poster maker accents depending on campaign themes
        if (campaign === "Thingyan") {
          setPosterAccent("#eab308"); // Golden
          setPosterBg("gradient-gold");
        } else if (campaign === "Christmas") {
          setPosterAccent("#ef4444"); // Christmas Red
          setPosterBg("gradient-christmas");
        } else if (campaign === "NewYear") {
          setPosterAccent("#8b5cf6"); // Deep purple
          setPosterBg("gradient-newyear");
        } else if (campaign === "Valentine") {
          setPosterAccent("#ec4899"); // Pink
          setPosterBg("gradient-valentine");
        } else if (campaign === "BackToSchool") {
          setPosterAccent("#0ea5e9"); // Sky Blue
          setPosterBg("gradient-school");
        } else if (campaign === "MonsoonSale") {
          setPosterAccent("#0d9488"); // Teal
          setPosterBg("gradient-monsoon");
        } else if (campaign === "FlashSale") {
          setPosterAccent("#f59e0b"); // Amber
          setPosterBg("gradient-flash");
        } else {
          setPosterAccent("#6366f1"); // Indigo modern
          setPosterBg("gradient-midnight");
        }
      }
    } catch (err) {
      console.error("Could not fetch smart marketing insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingInsights(selectedPreset);
  }, [selectedPreset]);

  // Handle caption clipboard copy feedback
  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate poster with Imagen
  const handleGenerateAiImage = async () => {
    if (!insights) return;
    setAiImageLoading(true);
    setAiImageError(null);
    try {
      const data = await getAiMarketingImage(selectedPreset, insights.bannerPrompt);
      if (data.success && data.imageUrl) {
        setAiImage(data.imageUrl);
      } else {
        setAiImageError("Failed to generate marketing graphic.");
      }
    } catch (err) {
      setAiImageError("Could not load marketing image.");
    } finally {
      setAiImageLoading(false);
    }
  };

  // HTML5 Poster drawing inside the Canvas for 100% reliable customized poster graphic creation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Aspect Ratio 3:4 Vertical Poster Size
    const width = 360;
    const height = 480;
    canvas.width = width;
    canvas.height = height;

    // Draw background based on selector gradient
    let bgGrad = ctx.createLinearGradient(0, 0, width, height);
    if (posterBg === "gradient-gold") {
      bgGrad.addColorStop(0, "#1e1b4b"); // Indigo midnight
      bgGrad.addColorStop(1, "#120e2e");
    } else if (posterBg === "gradient-christmas") {
      bgGrad.addColorStop(0, "#022c22"); // Dark forest green
      bgGrad.addColorStop(1, "#021c15");
    } else if (posterBg === "gradient-newyear") {
      bgGrad.addColorStop(0, "#0f172a"); // Dark slate starry sky
      bgGrad.addColorStop(1, "#1e1b4b");
    } else if (posterBg === "gradient-valentine") {
      bgGrad.addColorStop(0, "#3e0a16"); // Deep romantic maroon
      bgGrad.addColorStop(1, "#180206");
    } else if (posterBg === "gradient-school") {
      bgGrad.addColorStop(0, "#0c1f30"); // Royal academic dark blue
      bgGrad.addColorStop(1, "#060f18");
    } else if (posterBg === "gradient-monsoon") {
      bgGrad.addColorStop(0, "#042f2e"); // Dark teal monsoon
      bgGrad.addColorStop(1, "#0f172a");
    } else if (posterBg === "gradient-flash") {
      bgGrad.addColorStop(0, "#2c1704"); // Warm charcoal/chocolate-amber flash
      bgGrad.addColorStop(1, "#0c0a09");
    } else {
      bgGrad.addColorStop(0, "#090d16"); // Classic dark metallic
      bgGrad.addColorStop(1, "#1e293b");
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Render themed decorative background shapes/elements
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.beginPath();
    ctx.arc(width, 0, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height, 220, 0, Math.PI * 2);
    ctx.fill();

    // Render specialized seasonal stickers/patterns
    ctx.font = "26px system-ui";
    // Emojis removed to keep posters minimal and sleek

    // Outer Thin Accent Border
    ctx.strokeStyle = posterAccent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Campaign Main Title (persuasive center)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px system-ui, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(posterTitle, width / 2, 60);

    // Divider Line
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 80);
    ctx.lineTo(280, 80);
    ctx.stroke();

    // Subtitle (Burmese / English localized)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(posterSubtitle, width / 2, 105);

    // Product Section Y offset from Y=130 to Y=370
    const product = state.products.find(p => p.id === selectedProduct);
    if (product) {
      // Draw a polished card background frame for the catalog product
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(40, 130, 280, 240, 12);
        ctx.fill();
      } else {
        ctx.fillRect(40, 130, 280, 240);
      }

      // Draw product image inside the frame!
      const imgX = 85;
      const imgY = 145;
      const imgW = 190;
      const imgH = 140;

      if (productImgElement) {
        ctx.save();
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 8);
          ctx.clip();
        }
        ctx.drawImage(productImgElement, imgX, imgY, imgW, imgH);
        ctx.restore();

        // Outline image with thin elegant border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 2;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 8);
          ctx.stroke();
        } else {
          ctx.strokeRect(imgX, imgY, imgW, imgH);
        }
      } else {
        // Fallback placeholders while loading or without photo
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(imgX, imgY, imgW, imgH, 8);
          ctx.fill();
        } else {
          ctx.fillRect(imgX, imgY, imgW, imgH);
        }
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.font = "italic 11px sans-serif";
        ctx.fillText("[ Product Artwork Loading... ]", width / 2, 220);
      }

      // Product Product Name Y=310
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 15px system-ui, sans-serif";
      ctx.fillText(product.name.replace(/\s*\(.*?\)/g, "").trim(), width / 2, 315);

      // Category and Price unit
      ctx.fillStyle = posterAccent;
      ctx.font = "bold 13px monospace";
      ctx.fillText(`${product.price.toLocaleString()} MMK`, width / 2, 345);

    } else {
      // General fallbacks message if catalog is completely empty
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx.font = "italic 12px sans-serif";
      ctx.fillText("[ Select catalog item below to embed ]", width / 2, 230);
    }

    // Dynamic Discount Badge left-aligned
    ctx.fillStyle = posterAccent;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(25, 410, 110, 32, 8);
      ctx.fill();
    } else {
      ctx.fillRect(25, 410, 110, 32);
    }
    ctx.fillStyle = "#000000";
    ctx.font = "extrabold 12px system-ui, sans-serif";
    ctx.fillText(posterDiscount, 80, 431);

    // Small footer note / CTA for Telegram Bot right-aligned
    ctx.fillStyle = "#E2E8F0";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`@${state.config.telegramBotUsername || "SmeBot"}`, width - 30, 420);

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "9px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Order on Telegram Store", width - 30, 436);

  }, [posterTitle, posterSubtitle, posterDiscount, posterAccent, posterBg, selectedProduct, state.products, state.config, productImgElement]);

  // Handle Download HTML5 generated poster
  const downloadPoster = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `promotion-${selectedPreset}-${posterDiscount.replace(/%/g, "") || "sale"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-6">
      
      {/* STEPPER NAVIGATOR CARD */}
      <div className="bg-white border border-[#E2E8F0] rounded-[32px] p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 self-start md:self-auto">
          <div className="w-9 h-9 rounded-full bg-[#0069FF] flex items-center justify-center text-white font-mono text-xs font-bold select-none shadow-xs">
            {currentStep}
          </div>
          <div className="text-left select-none">
            <span className="font-serif text-base font-medium text-[#0A1B2A] block tracking-tight">
              {currentStep === 1 && tSM("stepTitle1")}
              {currentStep === 2 && tSM("stepTitle2")}
              {currentStep === 3 && tSM("stepTitle3")}
            </span>
          </div>
        </div>
        
        {/* STEP BUTTONS */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 select-none w-full md:w-auto">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
              currentStep === 1 
                ? "bg-[#1C1917] text-white shadow-2xs" 
                : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-stone-100"
            }`}
          >
            <span>{tSM("stepBtn1")}</span>
          </button>
          <span className="text-stone-300 text-xs hidden sm:block">➔</span>
          <button
            type="button"
            onClick={() => {
              if (insights) setCurrentStep(2);
            }}
            disabled={!insights}
            title={!insights ? "Please select a theme first" : "Go to Step 2"}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 2 
                ? "bg-[#1C1917] text-white shadow-2xs" 
                : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-stone-100"
            }`}
          >
            <span>{tSM("stepBtn2")}</span>
          </button>
          <span className="text-stone-300 text-xs hidden sm:block">➔</span>
          <button
            type="button"
            onClick={() => {
              if (insights) setCurrentStep(3);
            }}
            disabled={!insights}
            title={!insights ? "Please select a theme first" : "Go to Step 3"}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
              currentStep === 3 
                ? "bg-[#1C1917] text-white shadow-2xs" 
                : "bg-[#FAF8F5] border border-[#E7E5E4] text-[#57534E] hover:text-[#1C1917] hover:bg-stone-100"
            }`}
          >
            <span>{tSM("stepBtn3")}</span>
          </button>
        </div>
      </div>

      {/* STEP 1: PRESET THEME SELECTION & PRODUCT CHANNELS */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* STEP 1.1: CHOOSE PRODUCTS TO PROMOTE */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-4">
              <div className="flex items-center gap-2 justify-start">
                <CheckSquare size={16} className="text-[#0069FF]" />
                <h3 className="text-[11px] font-mono font-semibold text-[#78716C] tracking-wider uppercase">{tSM("chooseProdTitle")}</h3>
              </div>
              
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 shadow-2xs space-y-4 text-left">
                <div className="space-y-2 max-h-[385px] overflow-y-auto pr-1">
                  {state.products.map((p) => {
                    const isChecked = selectedProductIds.includes(p.id);
                    return (
                      <div
                        key={p.id}
                        id={`product-promote-${p.id}`}
                        onClick={() => {
                          if (isChecked) {
                            if (selectedProductIds.length > 1) {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                            }
                          } else {
                            setSelectedProductIds([...selectedProductIds, p.id]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer select-none ${
                          isChecked
                            ? "border-[#0069FF] bg-[#EFF6FF]/50 text-[#1C1917] shadow-2xs"
                            : "border-[#E7E5E4] bg-white hover:border-stone-300 text-[#57534E]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? "bg-[#0069FF] border-[#0069FF] text-white" : "border-[#E7E5E4] bg-white"
                        }`}>
                          {isChecked && <Check size={11} strokeWidth={3} />}
                        </div>
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-lg border border-[#E7E5E4]" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1">
                           <span className="text-xs font-semibold block truncate leading-tight text-[#1C1917]">{p.name}</span>
                           <span className="text-[11px] font-mono block mt-0.5 text-[#78716C]">{p.price.toLocaleString()} MMK</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 1.2: SELECT AI CAMPAIGN THEME */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-4">
              <div className="flex items-center gap-2 justify-start">
                <Sparkles size={16} className="text-amber-600" />
                <h3 className="text-[11px] font-mono font-semibold text-[#78716C] tracking-wider uppercase">{tSM("chooseThemeTitle")}</h3>
              </div>

              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {PRESET_CAMPAIGNS.map((c) => (
                    <button
                      key={c.id}
                      id={`campaign-preset-${c.id}`}
                      onClick={() => {
                        setSelectedPreset(c.id);
                        setCurrentStep(2);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        selectedPreset === c.id
                          ? "border-[#1C1917] bg-[#FAF8F5] text-[#1C1917] shadow-2xs"
                          : "border-[#E7E5E4] bg-white hover:border-stone-300 text-[#57534E]"
                      }`}
                    >
                      <span className="font-semibold text-xs block transition-transform group-hover:translate-x-1 text-[#1C1917]">{c.name}</span>
                      <span className="text-[11px] text-[#78716C] block mt-1 leading-normal font-sans font-medium">{c.desc}</span>
                      
                      {selectedPreset === c.id && (
                        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#0069FF]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: AI STRATEGY PACKAGE & COPYWRITING */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-16 shadow-2xs text-center space-y-4">
              <div className="w-10 h-10 border-3 border-[#0069FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="font-serif text-base font-medium text-[#1C1917]">{tSM("synthesizing")}</h4>
                <p className="text-xs text-[#78716C] animate-pulse font-mono max-w-sm mx-auto">
                  {tSM("generatingFromGemini")}
                </p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              <div className="max-w-3xl mx-auto">
                
                {/* AI HIGH-CONVERSION SOCIAL COPYWRITING */}
                <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-[#0069FF]" />
                      <h3 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">{tSM("socialCopyTitle")}</h3>
                    </div>
                    
                    {/* Language Badge */}
                    <div className="flex border border-[#E7E5E4] rounded-full overflow-hidden bg-[#FAF8F5] shrink-0 select-none">
                      <span className="px-3 py-0.5 text-[11px] font-semibold bg-[#1C1917] text-white font-mono">
                        English
                      </span>
                    </div>
                  </div>

                  {/* Caption tabs selectors */}
                  <div className="flex border-b border-[#E7E5E4] gap-3 shrink-0 overflow-x-auto select-none no-scrollbar">
                    {(["facebook", "instagram", "ad", "email"] as const).map((tab) => {
                      const labels = {
                        facebook: "FB Caption",
                        instagram: "IG Headline",
                        ad: "Ad Copy",
                        email: "Email Copy"
                      };
                      return (
                        <button
                          key={tab}
                          onClick={() => setActiveTabCopy(tab)}
                          className={`pb-2.5 px-1 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                            activeTabCopy === tab 
                              ? "border-[#0069FF] text-[#0069FF]" 
                              : "border-transparent text-[#78716C] hover:text-[#1C1917]"
                          }`}
                        >
                          {labels[tab]}
                        </button>
                      );
                    })}
                  </div>

                  {/* Render Selected Tab content */}
                  <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#E7E5E4] relative group min-h-[160px]">
                    <p className="text-xs text-[#1C1917] leading-relaxed font-sans whitespace-pre-line select-all">
                      {activeTabCopy === "facebook" && (insights.copywriting?.facebookCaption?.[copyLang] || "No Facebook template generated")}
                      {activeTabCopy === "instagram" && (insights.copywriting?.instagramCaption?.[copyLang] || "No Instagram template generated")}
                      {activeTabCopy === "ad" && (insights.copywriting?.adCopy?.[copyLang] || "No Ad copy template generated")}
                      {activeTabCopy === "email" && (insights.copywriting?.email?.[copyLang] || "No Email template generated")}
                    </p>

                    {/* Tags section */}
                    {insights.copywriting?.hashtags && (activeTabCopy === "facebook" || activeTabCopy === "instagram") && (
                      <div className="mt-4 pt-3 border-t border-[#E7E5E4]">
                        <span className="text-[11px] text-[#0069FF] font-bold block uppercase font-mono">{tSM("hashtagCluster")}</span>
                        <span className="text-[11px] font-mono text-[#78716C] block mt-1 leading-snug">{insights.copywriting.hashtags}</span>
                      </div>
                    )}

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={() => {
                        let text = "";
                        if (activeTabCopy === "facebook") text = insights.copywriting?.facebookCaption?.[copyLang] || "";
                        if (activeTabCopy === "instagram") text = insights.copywriting?.instagramCaption?.[copyLang] || "";
                        if (activeTabCopy === "ad") text = insights.copywriting?.adCopy?.[copyLang] || "";
                        if (activeTabCopy === "email") text = insights.copywriting?.email?.[copyLang] || "";
                        copyText(text, activeTabCopy);
                      }}
                      className="absolute bottom-3 right-3 bg-white text-[#1C1917] hover:bg-stone-50 px-3 py-1.5 rounded-full border border-[#E7E5E4] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.98]"
                    >
                      {copiedKey === activeTabCopy ? (
                        <>
                          <Check size={12} className="text-emerald-700" />
                          <span className="text-emerald-800 font-semibold">{tSM("copied")}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} className="text-stone-500" />
                          <span>{tSM("copy")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between border-t border-[#E7E5E4] pt-4 select-none">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] text-[#1C1917] font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {tSM("backToTheme")}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                >
                  {tSM("configPosters")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 shadow-2xs text-center">
              <Sparkles size={28} className="text-amber-500 mx-auto mb-3" />
              <h4 className="font-serif text-base font-medium text-[#1C1917] mb-1">{tSM("noThemeSelected")}</h4>
              <p className="text-xs text-[#78716C]">{tSM("chooseThemeFirst")}</p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-4 px-4 py-2 bg-[#1C1917] text-white font-semibold text-xs rounded-full hover:bg-stone-850 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                {tSM("goToStep1")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CREATIVE SOCIAL POSTERS */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {loading ? (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-16 shadow-2xs text-center space-y-4">
              <div className="w-10 h-10 border-3 border-[#0069FF] border-t-transparent rounded-full animate-spin mx-auto" />
              <h4 className="font-serif text-base font-medium text-[#1C1917]">{tSM("updatingCreative")}</h4>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              
              {/* HTML5 POSTER STUDIO BUILDER CARD */}
              <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6 shadow-2xs space-y-6 text-left">
                <div className="flex items-center justify-between border-b border-[#E7E5E4] pb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-[#0069FF]" />
                    <h3 className="font-serif text-base font-medium text-[#1C1917] tracking-tight">{tSM("posterStudioTitle")}</h3>
                  </div>
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-semibold uppercase font-mono">Phase 3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Vertical Canvas Preview */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#FAF8F5] p-5 rounded-2xl border border-[#E7E5E4] relative">
                    <span className="text-[11px] font-mono font-semibold text-[#78716C] uppercase tracking-wider mb-2 select-none">
                      {tSM("posterLivePreview")}
                    </span>
                    <div className="w-full max-w-[280px] drop-shadow-md">
                      <canvas 
                        ref={canvasRef} 
                        className="w-full rounded-xl border border-[#E7E5E4] select-none bg-[#1C1917] aspect-[3/4]" 
                      />
                    </div>
                  </div>

                  {/* Right Column: Custom poster typography and selection tools */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">{tSM("posterTitleLabel")}</label>
                        <input 
                          type="text" 
                          value={posterTitle} 
                          onChange={(e) => setPosterTitle(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs font-semibold text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">{tSM("promoDiscountLabel")}</label>
                        <input 
                          type="text" 
                          value={posterDiscount} 
                          onChange={(e) => setPosterDiscount(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs font-mono font-semibold text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">{tSM("subheadingLabel")}</label>
                      <input 
                        type="text" 
                        value={posterSubtitle} 
                        onChange={(e) => setPosterSubtitle(e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">{tSM("catalogProductLabel")}</label>
                        <select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                          className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                        >
                          {state.products.map(p => (
                            <option key={p.id} value={p.id}>{p.name.replace(/\s*\(.*?\)/g, "").trim()} ({p.price.toLocaleString()} MMK)</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono font-semibold text-[#78716C] uppercase">{tSM("themeTemplateLabel")}</label>
                        <select
                          value={posterBg}
                          onChange={(e) => {
                            setPosterBg(e.target.value);
                            // Match presets
                            if (e.target.value === "gradient-gold") setPosterAccent("#eab308");
                            else if (e.target.value === "gradient-christmas") setPosterAccent("#ef4444");
                            else if (e.target.value === "gradient-newyear") setPosterAccent("#8b5cf6");
                            else if (e.target.value === "gradient-valentine") setPosterAccent("#ec4899");
                            else if (e.target.value === "gradient-school") setPosterAccent("#0ea5e9");
                            else if (e.target.value === "gradient-monsoon") setPosterAccent("#0d9488");
                            else if (e.target.value === "gradient-flash") setPosterAccent("#f59e0b");
                            else setPosterAccent("#6366f1");
                          }}
                          className="w-full bg-[#FAF8F5] border border-[#E7E5E4] rounded-xl p-2.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#0069FF]"
                        >
                          <option value="gradient-school">{tSM("styleStudents")}</option>
                          <option value="gradient-monsoon">{tSM("styleCozy")}</option>
                          <option value="gradient-flash">{tSM("styleFlash")}</option>
                          <option value="gradient-gold">{tSM("styleThingyan")}</option>
                          <option value="gradient-christmas">{tSM("styleChristmas")}</option>
                          <option value="gradient-newyear">{tSM("styleNewYear")}</option>
                          <option value="gradient-valentine">{tSM("styleValentine")}</option>
                          <option value="gradient-midnight">{tSM("styleGeneral")}</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={downloadPoster}
                      className="w-full mt-4 px-5 py-3 bg-[#0069FF] hover:bg-[#0052CC] text-white font-semibold text-xs rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                    >
                      <Download size={14} />
                      {tSM("downloadFlyer")}
                    </button>
                  </div>
                </div>
              </div>

              {/* NAVIGATION BUTTONS */}
              <div className="flex items-center justify-between border-t border-[#E7E5E4] pt-4 select-none">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-stone-100 border border-[#E7E5E4] text-[#1C1917] font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
                >
                  {tSM("backToStrategy")}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 bg-[#1C1917] hover:bg-stone-850 text-white font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
                >
                  {tSM("startNewCampaign")}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-12 shadow-2xs text-center">
              <Sparkles size={28} className="text-amber-500 mx-auto mb-3" />
              <h4 className="font-serif text-base font-medium text-[#1C1917] mb-1">{tSM("noActiveTheme")}</h4>
              <p className="text-xs text-[#78716C]">{tSM("chooseThemeFirst")}</p>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="mt-4 px-4 py-2 bg-[#1C1917] text-white font-semibold text-xs rounded-full hover:bg-stone-850 transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
              >
                {tSM("goToStep1")}
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
