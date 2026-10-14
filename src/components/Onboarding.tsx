import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Store,
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Phone,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Building2,
  MapPin,
  CreditCard,
  Truck,
  Bot,
  Sliders,
  Package,
} from "lucide-react";
import { SearchableSelect } from "./SearchableSelect";
import { useAuth } from "../contexts/AuthContext";
import { saveShopOnboarding } from "../services/shopRecord";
import { loadTownships, MYANMAR_REGIONS } from "../data/townships";
import type { OnboardingFormState } from "../types";
import { generateShopId, buildShopPublicUrl } from "../utils/shopId";
import { supabase } from "../utils/supabase";

interface OnboardingProps {
  lang?: string;
  onComplete: (
    profile: {
      shopName: string;
      ownerName: string;
      phone: string;
      businessAddress: string;
      shopId?: string;
    },
    aiSummary: string
  ) => void;
  initialFormData?: OnboardingFormState;
  isEditMode?: boolean;
  onCancelEdit?: () => void;
  onLangChange?: (l: string) => void;
}

const defaultForm = (): OnboardingFormState => ({
  business_name: "",
  owner_name: "",
  business_category: "Fashion & Apparel",
  mainly_sell: "Fashion & Apparel",
  main_customer: "General consumers",
  age_group: "All Age Groups",
  selling_platform: "Telegram & Web",
  marketing_method: "Telegram & Web",
  weekly_order_volume: "11-50",
  payment_method: "Mixed Payments",
  delivery_method: "Delivery Service",
  business_goal: "Increase Sales",
  bot_personality: "Friendly",
  matter_most: "Friendly",
  phone: "",
  business_address: "Kamayut",
});

const CATEGORIES = [
  { id: "Fashion & Apparel", label: "Fashion & Apparel", icon: "👗", desc: "Clothing, shoes, bags & jewelry" },
  { id: "Food, FMCG & Groceries", label: "Food & Groceries", icon: "🍜", desc: "Packaged foods, snacks & beverages" },
  { id: "Beauty & Cosmetics", label: "Beauty & Cosmetics", icon: "✨", desc: "Skincare, makeup & personal care" },
  { id: "Electronics & Gadgets", label: "Electronics & Gadgets", icon: "📱", desc: "Phones, accessories & electronics" },
  { id: "Home & Lifestyle Products", label: "Home & Living", icon: "🌿", desc: "Artisan crafts, home decor & living" },
  { id: "General Retail", label: "General Retail", icon: "🛍️", desc: "Miscellaneous & multi-product stores" },
];

const PAYMENTS = [
  { id: "Mixed Payments", label: "Mixed (COD + Mobile Wallets)", desc: "Accept Cash on Delivery & KPay/WavePay" },
  { id: "Cash on Delivery", label: "Cash on Delivery (COD)", desc: "Collect payment upon order arrival" },
  { id: "KBZPay", label: "KBZPay Mobile Wallet", desc: "Direct prepay transfer via KPay QR / number" },
  { id: "WavePay", label: "WavePay Mobile Wallet", desc: "Direct prepay transfer via WavePay" },
];

const DELIVERIES = [
  { id: "Delivery Service", label: "Third-Party Express Courier", desc: "Standard Yangon city delivery services" },
  { id: "Own Delivery Team", label: "In-House Delivery Rider", desc: "Dispatched by your own shop delivery staff" },
  { id: "Bus Gate", label: "Highway Bus Gate", desc: "Regional parcel drop-off at highway gates" },
  { id: "In-store Pickup", label: "Store Walk-in Pickup", desc: "Customers collect directly at your location" },
];

const PERSONALITIES = [
  { id: "Friendly", label: "Warm & Friendly (Candy)", desc: "Polite, welcoming concierge with enthusiastic warmth" },
  { id: "Professional", label: "Polite & Professional", desc: "Formal, direct and highly respectful tone" },
  { id: "Fast & Short Replies", label: "Fast & Concise", desc: "Brief bullet points with instant item pricing" },
];

export function Onboarding({
  onComplete,
  initialFormData,
  isEditMode = false,
  onCancelEdit,
}: OnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [saving, setSaving] = useState(false);
  const [generatedShopId, setGeneratedShopId] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormState>(() => ({
    ...defaultForm(),
    ...initialFormData,
  }));

  const parseLocation = (addr: string = "") => {
    const matchedRegion = MYANMAR_REGIONS.find((r) =>
      addr.toLowerCase().includes(r.toLowerCase())
    );
    let town = addr;
    if (matchedRegion) {
      town = town.replace(new RegExp(`,?\\s*${matchedRegion}`, "i"), "").trim();
    }
    return {
      region: matchedRegion || "Yangon Region",
      township: town || "Kamayut",
    };
  };

  const initialLoc = parseLocation(initialFormData?.business_address || "Kamayut");
  const [storeRegion, setStoreRegion] = useState<string>(initialLoc.region);
  const [storeTownship, setStoreTownship] = useState<string>(initialLoc.township);

  const initialHydratedRef = React.useRef(false);

  useEffect(() => {
    if (initialFormData && !initialHydratedRef.current) {
      const hasContent = Boolean(
        initialFormData.business_name ||
        initialFormData.owner_name ||
        initialFormData.phone ||
        initialFormData.business_address
      );
      if (hasContent) {
        setFormData((prev) => {
          const merged = { ...prev };
          (Object.keys(initialFormData) as (keyof OnboardingFormState)[]).forEach((key) => {
            if (!prev[key] && initialFormData[key]) {
              merged[key] = initialFormData[key];
            }
          });
          return merged;
        });
        if (initialFormData.business_address) {
          const parsed = parseLocation(initialFormData.business_address);
          setStoreRegion(parsed.region);
          setStoreTownship(parsed.township);
        }
        initialHydratedRef.current = true;
      }
    }
  }, [initialFormData]);

  const townships = useMemo(() => loadTownships(), []);

  const isStepValid = () => {
    if (step === 1) {
      return formData.business_name.trim() !== "" && formData.owner_name.trim() !== "";
    }
    if (step === 2) {
      return formData.business_category.trim() !== "" && formData.business_address.trim() !== "";
    }
    if (step === 3) {
      return formData.payment_method.trim() !== "" && formData.delivery_method.trim() !== "";
    }
    if (step === 4) {
      return formData.bot_personality.trim() !== "";
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setStep(5); // Show loading spinner

    let shopId = "";
    try {
      const { data: existing } = await supabase
        .from("shops")
        .select("shop_id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (existing?.shop_id) {
        shopId = existing.shop_id;
      } else {
        shopId = generateShopId();
      }
    } catch {
      shopId = generateShopId();
    }

    setGeneratedShopId(shopId);

    try {
      await saveShopOnboarding(user.id, {
        shopName: formData.business_name,
        ownerName: formData.owner_name,
        businessCategory: formData.business_category,
        mainlySell: formData.mainly_sell || formData.business_category,
        mainCustomer: formData.main_customer || "General consumers",
        ageGroup: formData.age_group || "All Age Groups",
        sellingPlatform: formData.selling_platform || "Telegram & Web",
        marketingMethod: formData.marketing_method || "Telegram & Web",
        weeklyOrderVolume: formData.weekly_order_volume || "11-50",
        paymentMethod: formData.payment_method || "Mixed Payments",
        deliveryMethod: formData.delivery_method || "Delivery Service",
        businessGoal: formData.business_goal || "Increase Sales",
        botPersonality: formData.bot_personality || "Friendly",
        matterMost: formData.matter_most || "Friendly",
        phone: formData.phone || "",
        address: formData.business_address || "Yangon",
        shopId: shopId,
      });

      const aiSummary = `Business Profile Saved! Based on ${formData.bot_personality} personality, Sales Brain AI is now ready for your ${formData.business_category} store.`;

      if (!isEditMode) {
        setStep(6); // Step 6 is the final Activation screen
        setSaving(false);
      } else {
        onComplete(
          {
            shopName: formData.business_name,
            ownerName: formData.owner_name,
            phone: formData.phone || "",
            businessAddress: formData.business_address || "Yangon",
            shopId: shopId,
          },
          aiSummary
        );
      }
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setSaving(false);
      setStep(4);
    }
  };

  const handleNext = () => {
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    } else if (step === 4) {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1 && step < 5) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleComplete = () => {
    onComplete(
      {
        shopName: formData.business_name,
        ownerName: formData.owner_name,
        phone: formData.phone || "",
        businessAddress: formData.business_address || "Yangon",
        shopId: generatedShopId,
      },
      `Welcome to Sales Brain! Your shop ${formData.business_name} has been activated.`
    );
  };

  const copyToClipboard = () => {
    const url = buildShopPublicUrl(generatedShopId);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepMeta = [
    { number: 1, label: "Basics", title: "Store Basics", desc: "What is your store named and who is the primary contact?" },
    { number: 2, label: "Category & Location", title: "Products & Location", desc: "Select what you sell and your store township for delivery." },
    { number: 3, label: "Payments & Delivery", title: "Settlement & Delivery", desc: "Choose how customers pay and how orders are dispatched." },
    { number: 4, label: "AI Assistant", title: "AI Concierge Setup", desc: "Choose the conversational personality for your bot Candy." },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#0069FF] selection:text-white antialiased">
      <div className="w-full max-w-2xl mx-auto space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-white/90 backdrop-blur-sm border border-stone-200/70 rounded-2xl px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#0069FF]/20 flex items-center justify-center text-[#0069FF]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-semibold tracking-[0.2em] uppercase text-[#0069FF] block">
                {isEditMode ? "PROFILE SETTINGS" : "FAST STORE ONBOARDING"}
              </span>
              <h1 className="text-sm font-semibold text-stone-900">
                {isEditMode ? "Edit Store Profile" : "Setup Your AI Storefront"}
              </h1>
            </div>
          </div>

          {/* Step Pill */}
          {step <= 4 && (
            <div className="bg-[#F3EFEA] border border-stone-200/70 text-stone-700 px-3 py-1 rounded-full text-xs font-semibold">
              Step {step} of 4
            </div>
          )}
        </div>

        {/* Step Header & Clean Progress Indicator */}
        {step <= 4 && (
          <div className="px-1">
            <div className="flex items-end justify-between gap-2 mb-2">
              <div>
                <h2 className="font-serif text-2xl text-stone-900 font-normal tracking-tight">
                  {stepMeta[step - 1].title}
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  {stepMeta[step - 1].desc}
                </p>
              </div>
              <span className="text-xs font-semibold text-[#0069FF] font-mono">
                {Math.round((step / 4) * 100)}%
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-[#E7E5E4]/60 rounded-full p-0.5 overflow-hidden">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-full rounded-full transition-all duration-300 ${
                    s <= step ? "bg-[#0069FF]" : "bg-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Separate Wizard Card */}
        <div className="bg-white border border-stone-200/80 rounded-[28px] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between min-h-[440px]">
          <AnimatePresence mode="wait">
            
            {/* ── PAGE 1: STORE BASICS ── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Store or Brand Name <span className="text-[#0069FF]">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      placeholder="e.g. Silk & Clay Studio, Yangon Coffee House"
                      className="w-full bg-[#FAF8F5]/60 border border-stone-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all font-medium"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">This name will appear on your public shop and customer receipts.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Owner or Manager Name <span className="text-[#0069FF]">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.owner_name}
                      onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                      placeholder="e.g. Daw Khin Khin"
                      className="w-full bg-[#FAF8F5]/60 border border-stone-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Contact Phone Number <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 09 450 123 456"
                      className="w-full bg-[#FAF8F5]/60 border border-stone-200/80 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">Used for customer order inquiries and delivery confirmation.</p>
                </div>
              </motion.div>
            )}

            {/* ── PAGE 2: CATEGORY & LOCATION ── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-2">
                    Primary Business Category <span className="text-[#0069FF]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const isSelected = formData.business_category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, business_category: cat.id, mainly_sell: cat.id })}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-[#EFF6FF] border-[#0069FF] text-stone-900 shadow-xs ring-1 ring-[#0069FF]"
                              : "bg-white border-stone-200/80 text-stone-600 hover:border-stone-300 hover:bg-stone-50/60"
                          }`}
                        >
                          <span className="text-xl block mb-1">{cat.icon}</span>
                          <span className="text-xs font-semibold block text-stone-900 leading-tight">
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                      Store State / Region <span className="text-[#0069FF]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={storeRegion}
                        onChange={(e) => {
                          const newReg = e.target.value;
                          setStoreRegion(newReg);
                          const fullAddr = storeTownship ? `${storeTownship}, ${newReg}` : newReg;
                          setFormData((prev) => ({ ...prev, business_address: fullAddr }));
                        }}
                        className="w-full bg-[#FAF8F5]/60 border border-stone-200/80 rounded-xl px-3.5 py-3 text-sm text-stone-900 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all font-medium cursor-pointer"
                      >
                        {MYANMAR_REGIONS.map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Select your store operating state or region (supports all 14 states & regions of Myanmar).
                    </p>
                  </div>

                  <div>
                    <SearchableSelect
                      label="Store Township / City (Delivery Origin)"
                      options={townships}
                      value={storeTownship}
                      onChange={(township) => {
                        setStoreTownship(township);
                        const fullAddr = township ? `${township}, ${storeRegion}` : storeRegion;
                        setFormData((prev) => ({ ...prev, business_address: fullAddr }));
                      }}
                      placeholder="Search township or city (e.g. Kamayut, Chanayethazan, Taunggyi)..."
                      required
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      Your base location is used by AI to compute local city deliveries vs. inter-state highway bus gate dispatches.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PAGE 3: PAYMENTS & DELIVERY ── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-2">
                    Accepted Payment Methods <span className="text-[#0069FF]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PAYMENTS.map((pm) => {
                      const isSelected = formData.payment_method === pm.id;
                      return (
                        <div
                          key={pm.id}
                          onClick={() => setFormData({ ...formData, payment_method: pm.id })}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? "bg-[#EFF6FF] border-[#0069FF] shadow-xs"
                              : "bg-white border-stone-200/80 hover:border-stone-300"
                          }`}
                        >
                          <CreditCard className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-[#0069FF]" : "text-stone-400"}`} />
                          <div>
                            <p className="text-xs font-semibold text-stone-900">{pm.label}</p>
                            <p className="text-[11px] text-stone-500 mt-0.5">{pm.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-stone-700 mb-2">
                    Primary Delivery Dispatch Method <span className="text-[#0069FF]">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {DELIVERIES.map((del) => {
                      const isSelected = formData.delivery_method === del.id;
                      return (
                        <div
                          key={del.id}
                          onClick={() => setFormData({ ...formData, delivery_method: del.id })}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                            isSelected
                              ? "bg-[#EFF6FF] border-[#0069FF] shadow-xs"
                              : "bg-white border-stone-200/80 hover:border-stone-300"
                          }`}
                        >
                          <Truck className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-[#0069FF]" : "text-stone-400"}`} />
                          <div>
                            <p className="text-xs font-semibold text-stone-900">{del.label}</p>
                            <p className="text-[11px] text-stone-500 mt-0.5">{del.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PAGE 4: AI ASSISTANT PERSONA ── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-2">
                    AI Sales Bot Personality (Candy) <span className="text-[#0069FF]">*</span>
                  </label>
                  <div className="space-y-2.5">
                    {PERSONALITIES.map((p) => {
                      const isSelected = formData.bot_personality === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setFormData({ ...formData, bot_personality: p.id, matter_most: p.id })}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-[#EFF6FF] border-[#0069FF] shadow-xs ring-1 ring-[#0069FF]"
                              : "bg-white border-stone-200/80 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🍭</span>
                            <div>
                              <p className="text-xs font-semibold text-stone-900">{p.label}</p>
                              <p className="text-[11px] text-stone-500">{p.desc}</p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#0069FF] bg-[#0069FF]" : "border-stone-300"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assistant Preview Banner */}
                <div className="p-4 bg-[#FAF8F5] border border-stone-200/80 rounded-2xl flex items-start gap-3">
                  <Bot className="w-5 h-5 text-[#0069FF] shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <strong className="text-stone-900">How Candy works:</strong> Your assistant &ldquo;Candy&rdquo; automatically welcomes customers, answers product inquiries, calculates township delivery fees, and collects payment receipts for fast verification.
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 5: PROVISIONING / SAVING SPINNER ── */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col justify-center items-center text-center space-y-4 py-16"
              >
                <div className="w-12 h-12 rounded-full border-3 border-[#0069FF] border-t-transparent animate-spin" />
                <h3 className="font-serif text-lg text-stone-900 font-normal">
                  Setting Up Your Store...
                </h3>
                <p className="text-xs text-stone-500 max-w-sm">
                  Saving your store profile, generating township matrices, and provisioning the Candy AI assistant.
                </p>
              </motion.div>
            )}

            {/* ── STEP 6: STORE ACTIVATED! ── */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-4"
              >
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-1.5 max-w-md">
                  <span className="text-[10px] font-mono font-semibold tracking-[0.2em] uppercase text-[#0069FF]">
                    STORE ACTIVATED
                  </span>
                  <h2 className="font-serif text-3xl text-stone-900 font-normal tracking-tight">
                    Your Shop is Ready!
                  </h2>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    We generated a dedicated public storefront and conversational bot link for{" "}
                    <strong>{formData.business_name}</strong>. Share it with your customers on Telegram and social media.
                  </p>
                </div>

                {/* Public Shop URL Preview */}
                <div className="w-full max-w-lg space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold text-stone-700 block">
                    Your Public Storefront Link
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#FAF8F5] border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-700 truncate flex items-center">
                      {buildShopPublicUrl(generatedShopId)}
                    </div>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className={`px-4 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer ${
                        copied
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Action CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg pt-2">
                  <a
                    href={buildShopPublicUrl(generatedShopId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white border border-stone-200 text-stone-800 font-semibold py-3 px-5 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>View Public Store</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="flex-1 bg-[#0069FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-semibold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    Enter Merchant Hub →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Action Footer for Steps 1 - 4 */}
          {step <= 4 && (
            <div className="flex items-center justify-between pt-6 border-t border-stone-100 mt-6 shrink-0">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : isEditMode && onCancelEdit ? (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                ) : (
                  <div />
                )}
              </div>

              <div className="flex items-center gap-3">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={!isStepValid() || saving}
                    className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-800 hover:bg-stone-50 text-xs font-semibold transition cursor-pointer disabled:opacity-40"
                  >
                    Save Changes
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid() || saving}
                  className="bg-[#0069FF] hover:bg-[#0052CC] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>
                    {step === 4
                      ? isEditMode
                        ? "Save Changes"
                        : "Finish & Launch Store"
                      : "Next Step"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-stone-400">
          © 2026 Sales Brain AI • Autonomous Social Commerce Platform
        </p>
      </div>
    </div>
  );
}
