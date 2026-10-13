import React, { useState, useEffect } from "react";
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
  Sliders,
} from "lucide-react";
import { RadioGroup } from "./RadioGroup";
import { SearchableSelect } from "./SearchableSelect";
import { useAuth } from "../contexts/AuthContext";
import { saveShopOnboarding } from "../services/shopRecord";
import { loadTownships } from "../data/townships";
import type { OnboardingFormState } from "../types";
import { generateShopId, buildShopPublicUrl } from "../utils/shopId";
import { supabase } from "../utils/supabase";

interface OnboardingProps {
  lang: "en" | "my";
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
  onLangChange?: (l: "en" | "my") => void;
}

const defaultForm = (): OnboardingFormState => ({
  business_name: "",
  owner_name: "",
  business_category: "",
  mainly_sell: "",
  main_customer: "",
  age_group: "",
  selling_platform: "",
  marketing_method: "",
  weekly_order_volume: "",
  payment_method: "",
  delivery_method: "",
  business_goal: "",
  bot_personality: "Friendly",
  matter_most: "Friendly",
  phone: "",
  business_address: "",
});

export function Onboarding({
  lang,
  onComplete,
  initialFormData,
  isEditMode = false,
  onCancelEdit,
  onLangChange,
}: OnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [saving, setSaving] = useState(false);
  const [generatedShopId, setGeneratedShopId] = useState("");
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<OnboardingFormState>(() => ({
    ...defaultForm(),
    ...initialFormData,
  }));

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
            // Only populate empty fields; never clobber text the user has already typed
            if (!prev[key] && initialFormData[key]) {
              merged[key] = initialFormData[key];
            }
          });
          return merged;
        });
        initialHydratedRef.current = true;
      }
    }
  }, [initialFormData]);

  const categories = [
    { id: "Electronics & Gadgets", labelEn: "Electronics & Gadgets", labelMy: "အီလက်ထရောနစ်နှင့် ဂက်ဂျက်များ" },
    { id: "Fashion & Clothing", labelEn: "Fashion & Clothing", labelMy: "ဖက်ရှင်နှင့် အဝတ်အထည်" },
    { id: "Food, FMCG & Groceries", labelEn: "Food, FMCG & Groceries", labelMy: "အစားအသောက်နှင့် ကုန်စုံပစ္စည်း" },
    { id: "Digital Products & Services", labelEn: "Digital Products & Services", labelMy: "ဒစ်ဂျစ်တယ် ထုတ်ကုန်နှင့် ဝန်ဆောင်မှု" },
    { id: "Home & Lifestyle Products", labelEn: "Home & Lifestyle Products", labelMy: "အိမ်သုံးနှင့် လူနေမှုဘဝ ထုတ်ကုန်များ" }
  ];

  const platforms = [
    { id: "Facebook", labelEn: "Facebook Messenger", labelMy: "Facebook မက်ဆင်ဂျာ" },
    { id: "Telegram", labelEn: "Telegram Bot", labelMy: "Telegram ဘော့တ်" },
    { id: "Website", labelEn: "Web Storefront Link", labelMy: "ဝဘ်ဆိုင် လင့်ခ်" },
    { id: "Physical Store", labelEn: "Physical Store / POS", labelMy: "ဆိုင်ခွဲ / POS အရောင်းကောင်တာ" },
    { id: "Marketplace", labelEn: "Marketplace Platform", labelMy: "ဈေးရောင်း ပလက်ဖောင်း" },
    { id: "Multiple Channels", labelEn: "Omnichannel / All", labelMy: "ချန်နယ်စုံ / အားလုံး" }
  ];

  const volumes = [
    { id: "1-10", labelEn: "1 - 10 orders / week", labelMy: "၁ - ၁၀ အော်ဒါ / တစ်ပတ်" },
    { id: "11-50", labelEn: "11 - 50 orders / week", labelMy: "၁၁ - ၅၀ အော်ဒါ / တစ်ပတ်" },
    { id: "51-100", labelEn: "51 - 100 orders / week", labelMy: "၅၁ - ၁၀၀ အော်ဒါ / တစ်ပတ်" },
    { id: "100+", labelEn: "100+ orders / week (High Volume)", labelMy: "၁၀၀+ အော်ဒါ / တစ်ပတ် (ပမာဏများ)" }
  ];

  const payments = [
    { id: "Cash on Delivery", labelEn: "Cash on Delivery (COD)", labelMy: "အိမ်ရောက်ငွေချေ (COD)" },
    { id: "KBZPay", labelEn: "KBZPay Mobile Wallet", labelMy: "KBZPay မိုဘိုင်းပိုက်ဆံအိတ်" },
    { id: "WavePay", labelEn: "WavePay Mobile Wallet", labelMy: "WavePay မိုဘိုင်းပိုက်ဆံအိတ်" },
    { id: "Bank Transfer", labelEn: "Direct Bank Transfer (CB/AYA)", labelMy: "ဘဏ်တိုက်ရိုက်ငွေလွှဲ (CB / AYA)" },
    { id: "Mixed Payments", labelEn: "Mixed (COD + Mobile Wallets)", labelMy: "ငွေပေးချေမှုစုံ (COD + မိုဘိုင်းငွေလွှဲ)" }
  ];

  const deliveries = [
    { id: "Own Delivery Team", labelEn: "Own In-House Courier", labelMy: "ဆိုင်ကိုယ်ပိုင် ပို့ဆောင်ရေးအဖွဲ့" },
    { id: "Delivery Service", labelEn: "Third-Party Express Courier", labelMy: "အမြန်ချောပို့ အဖွဲ့များ" },
    { id: "Bus Gate", labelEn: "Regional Bus Gate (Highway)", labelMy: "နယ်ဝေး ကားဂိတ်စနစ်" },
    { id: "Digital Delivery", labelEn: "Instant Digital Delivery", labelMy: "ချက်ချင်း ဒစ်ဂျစ်တယ်ပေးပို့မှု" },
    { id: "In-store Pickup", labelEn: "Store Walk-in Pickup", labelMy: "ဆိုင်သို့ ကိုယ်တိုင်လာယူခြင်း" }
  ];

  const goals = [
    { id: "Increase Sales", labelEn: "Boost Conversions & Sales", labelMy: "အရောင်းမြှင့်တင်ရန်နှင့် အော်ဒါတိုးရန်" },
    { id: "Customer Support Automation", labelEn: "24/7 Support Automation", labelMy: "၂၄/၇ အလိုအလျောက် ဝန်ဆောင်မှုပေးရန်" },
    { id: "Order Management", labelEn: "Streamline Orders & Slips", labelMy: "အော်ဒါနှင့် ငွေလွှဲစလစ် စနစ်တကျစီမံရန်" },
    { id: "Product Recommendations", labelEn: "AI Cross-Selling & Upselling", labelMy: "AI ပစ္စည်း အကြံပြုချက်များပေးရန်" },
    { id: "Marketing & Promotions", labelEn: "Automated Campaign Copy", labelMy: "အရောင်းမြှင့်တင်ရေး စာသားများ ရေးသားရန်" }
  ];

  const personalities = [
    { id: "Professional", labelEn: "Polite & Professional", labelMy: "ယဉ်ကျေးသိမ်မွေ့သော ပုံစံ" },
    { id: "Friendly", labelEn: "Warm & Friendly (Candy)", labelMy: "ဖော်ရွေနွေးထွေးသော ပုံစံ (Candy)" },
    { id: "Fast & Short Replies", labelEn: "Fast & Direct Bullet Points", labelMy: "မြန်ဆန်တိကျသော ပုံစံ" },
    { id: "Detailed Explainer", labelEn: "Thorough & Advisory", labelMy: "အသေးစိတ် ရှင်းပြပေးသော ပုံစံ" },
    { id: "Casual Style", labelEn: "Approachable & Casual", labelMy: "ရင်းနှီးပေါ့ပါးသော ပုံစံ" }
  ];

  const mainCustomers = [
    { id: "General consumers", labelEn: "General Retail Consumers", labelMy: "အထွေထွေ လက်လီဝယ်ယူသူများ" },
    { id: "Young adults & students", labelEn: "Students & Gen-Z", labelMy: "ကျောင်းသားနှင့် လူငယ် Gen-Z များ" },
    { id: "Working professionals", labelEn: "Corporate & Professionals", labelMy: "ရုံးဝန်ထမ်းနှင့် ကျွမ်းကျင်ပညာရှင်များ" },
    { id: "Parents & families", labelEn: "Parents & Household Buyers", labelMy: "မိဘများနှင့် မိသားစုအိမ်ထောင်ရှင်များ" },
    { id: "Small business buyers", labelEn: "B2B & SME Partners", labelMy: "လုပ်ငန်းရှင်နှင့် SME မိတ်ဖက်များ" },
    { id: "Resellers & wholesalers", labelEn: "Wholesale & Resellers", labelMy: "လက်ကားနှင့် ပြန်လည်ရောင်းချသူများ" }
  ];

  const ageGroups = [
    { id: "Under 18", labelEn: "Under 18", labelMy: "၁၈ နှစ်အောက်" },
    { id: "18-24", labelEn: "18 - 24 years", labelMy: "၁၈ - ၂၄ နှစ်" },
    { id: "25-34", labelEn: "25 - 34 years", labelMy: "၂၅ - ၃၄ နှစ်" },
    { id: "35-44", labelEn: "35 - 44 years", labelMy: "၃၅ - ၄၄ နှစ်" },
    { id: "45-54", labelEn: "45 - 54 years", labelMy: "၄၅ - ၅၄ နှစ်" },
    { id: "55+", labelEn: "55+ years", labelMy: "၅၅ နှစ်အထက်" },
    { id: "Mixed / all ages", labelEn: "All Age Groups", labelMy: "အသက်အရွယ်စုံ / အားလုံး" }
  ];

  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.business_name.trim() !== "" &&
        formData.owner_name.trim() !== "" &&
        formData.business_category !== "" &&
        formData.main_customer !== "" &&
        formData.age_group !== "" &&
        formData.selling_platform !== ""
      );
    }
    if (step === 2) {
      return (
        formData.weekly_order_volume !== "" &&
        formData.payment_method !== "" &&
        formData.delivery_method !== ""
      );
    }
    if (step === 3) {
      return formData.business_goal !== "" && formData.bot_personality !== "";
    }
    return true;
  };

  const handleFinalSubmit = async () => {
    if (!user) return;
    setSaving(true);
    setStep(4);

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
        mainCustomer: formData.main_customer,
        ageGroup: formData.age_group,
        sellingPlatform: formData.selling_platform,
        marketingMethod: formData.marketing_method || formData.selling_platform,
        weeklyOrderVolume: formData.weekly_order_volume,
        paymentMethod: formData.payment_method,
        deliveryMethod: formData.delivery_method,
        businessGoal: formData.business_goal,
        botPersonality: formData.bot_personality,
        matterMost: formData.matter_most || formData.bot_personality,
        phone: formData.phone || "",
        address: formData.business_address || "",
        shopId: shopId,
      });

      const aiSummary = `Business Profile Saved! Based on your goal of ${formData.business_goal} and ${formData.bot_personality} personality, Sales Brain AI is now optimized for your ${formData.business_category} store.`;

      if (!isEditMode) {
        setStep(5);
        setSaving(false);
      } else {
        onComplete(
          {
            shopName: formData.business_name,
            ownerName: formData.owner_name,
            phone: formData.phone?.trim() || "",
            businessAddress: formData.business_address?.trim() || "",
            shopId: shopId,
          },
          aiSummary
        );
      }
    } catch (err: any) {
      console.error("Error saving onboarding data:", err);
      setSaving(false);
      setStep(3);
      alert(
        `Failed to save onboarding data: ${err.message || "Unknown error"}. Please ensure you have run the database setup SQL.`
      );
    }
  };

  const handleComplete = () => {
    if (!user) return;
    const aiSummary = `Business Profile Saved! Based on your goal of ${formData.business_goal} and ${formData.bot_personality} personality, Sales Brain AI is now optimized for your ${formData.business_category} store.`;

    onComplete(
      {
        shopName: formData.business_name,
        ownerName: formData.owner_name || user.email?.split("@")[0] || "Owner",
        phone: formData.phone || "",
        businessAddress: formData.business_address || "",
        shopId: generatedShopId,
      },
      aiSummary
    );
  };

  const copyToClipboard = () => {
    const url = buildShopPublicUrl(generatedShopId);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentStepTitle = () => {
    switch (step) {
      case 1:
        return lang === "my" ? "ဆိုင်အချက်အလက်နှင့် ဝယ်ယူသူပစ်မှတ်" : "Store Identity & Profile";
      case 2:
        return lang === "my" ? "ငွေပေးချေမှုနှင့် ပို့ဆောင်ရေး ချန်နယ်များ" : "Operations & Logistics";
      case 3:
        return lang === "my" ? "AI အရောင်းလက်ထောက် ဗျူဟာ" : "AI Sales Bot Strategy";
      case 5:
        return lang === "my" ? "ဆိုင်စနစ် အောင်မြင်စွာ တည်ဆောက်ပြီးပါပြီ" : "Storefront Initialized";
      default:
        return lang === "my" ? "ဆိုင်စနစ် ပြင်ဆင်နေပါသည်" : "Configuring Storefront";
    }
  };

  const currentStepDescription = () => {
    switch (step) {
      case 1:
        return lang === "my"
          ? "မြန်မာပြည်တွင်းရှိ သင့်ဆိုင်အချက်အလက်နှင့် ဝယ်ယူသူပစ်မှတ်ကို သတ်မှတ်ပါ။"
          : "Define your store details and target audience in Myanmar.";
      case 2:
        return lang === "my"
          ? "ငွေပေးချေမှုပုံစံ၊ ပို့ဆောင်ရေးနည်းလမ်းနှင့် အပတ်စဉ်အော်ဒါပမာဏကို ရွေးချယ်ပါ။"
          : "Configure your payment channels, courier methods, and order throughput.";
      case 3:
        return lang === "my"
          ? "Candy ၏ စကားပြောဟန်ပန်နှင့် အရောင်းပန်းတိုင်များကို သတ်မှတ်ပါ။"
          : "Shape Candy's conversational personality and conversion goals.";
      case 5:
        return lang === "my"
          ? "သင့်ဆိုင်၏ သီးသန့်ဝဘ်လင့်ခ်နှင့် AI စနစ် စတင်အသုံးပြုနိုင်ပါပြီ။"
          : "Your unique customer-facing storefront and AI bot are live.";
      default:
        return lang === "my"
          ? "သင့်ကုန်ပစ္စည်းများနှင့် ကိုက်ညီသော AI စနစ်ကို စီစဉ်ပေးနေပါသည်..."
          : "Tailoring conversational intelligence to your catalog...";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#0069FF] selection:text-white antialiased">
      {/* Top Header Card */}
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="bg-white/80 backdrop-blur-sm border border-stone-200/70 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] border border-[#0069FF]/20 flex items-center justify-center text-[#0069FF]">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#0069FF] block">
                {isEditMode
                  ? lang === "my" ? "ဆိုင်အချက်အလက် ပြင်ဆင်ခြင်း" : "PROFILE EDITOR"
                  : lang === "my" ? "ဆိုင်စနစ် စတင်ဖွင့်လှစ်ခြင်း" : "MERCHANT ACTIVATION"}
              </span>
              <h1 className="text-sm font-semibold text-stone-900">
                {lang === "my" ? "Sales Brain AI စနစ် ပြင်ဆင်ခြင်း" : "Sales Brain AI Configuration"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Interactive Language Selector */}
            {onLangChange && (
              <div className="flex items-center bg-[#F3EFEA] border border-stone-200/60 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => onLangChange("en")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    lang === "en"
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => onLangChange("my")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                    lang === "my"
                      ? "bg-white text-stone-900 shadow-xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                >
                  မြန်မာ
                </button>
              </div>
            )}

            {/* Step Counter Pill */}
            <div className="bg-[#F3EFEA] border border-stone-200/70 text-stone-700 px-3 py-1 rounded-full text-xs font-medium">
              {step === 5
                ? lang === "my" ? "ပြီးစီးပါပြီ" : "Complete"
                : lang === "my" ? `အဆင့် ${step} / ၃` : `Step ${step} of 3`}
            </div>
          </div>
        </div>

        {/* Step Progress & Editorial Heading */}
        <div className="px-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl text-stone-900 font-normal tracking-tight">
                {currentStepTitle()}
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {currentStepDescription()}
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0069FF]">
              {step === 5 ? 100 : Math.round(((step - 1) / 3) * 100)}% {lang === "my" ? "ပြီးစီး" : "Completed"}
            </span>
          </div>

          {/* Clean Progress Indicator */}
          <div className="h-1.5 w-full bg-[#E7E5E4]/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0069FF] transition-all duration-400 ease-out"
              style={{ width: `${step === 5 ? 100 : (step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Main Wizard Form Card */}
        <div className="bg-white border border-stone-200/80 rounded-[32px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col justify-between min-h-[500px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Section A: Store Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <Building2 className="w-4 h-4 text-[#0069FF]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                      {lang === "my" ? "ဆိုင်အချက်အလက်နှင့် တည်နေရာ" : "Store Identity & Location"}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        {lang === "my" ? "ဆိုင်အမည်" : "Business Name"} <span className="text-[#0069FF]">*</span>
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3.5 top-3 text-stone-400" size={15} />
                        <input
                          type="text"
                          required
                          value={formData.business_name}
                          onChange={(e) =>
                            setFormData({ ...formData, business_name: e.target.value })
                          }
                          placeholder={lang === "my" ? "ဥပမာ - ရွှေပိုးထည်နှင့် အနုပညာလက်မှုဆိုင်" : "e.g. Silk & Clay Artisan Studio"}
                          className="w-full bg-[#FAF8F5]/60 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        {lang === "my" ? "ဆိုင်ပိုင်ရှင် အမည်" : "Owner Name"} <span className="text-[#0069FF]">*</span>
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-3 text-stone-400" size={15} />
                        <input
                          type="text"
                          required
                          value={formData.owner_name}
                          onChange={(e) =>
                            setFormData({ ...formData, owner_name: e.target.value })
                          }
                          placeholder={lang === "my" ? "ဥပမာ - ဒေါ်ခင်ခင်" : "e.g. Daw Khin Khin"}
                          className="w-full bg-[#FAF8F5]/60 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                        {lang === "my" ? "အဓိက ဆက်သွယ်ရန် ဖုန်းနံပါတ်" : "Primary Phone Number"}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-3 text-stone-400" size={15} />
                        <input
                          type="tel"
                          value={formData.phone || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          placeholder={lang === "my" ? "ဥပမာ - ၀၉ ၄၅၀ ၁၂၃ ၄၅၆" : "e.g. 09 450 123 456"}
                          className="w-full bg-[#FAF8F5]/60 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:border-[#0069FF] focus:ring-2 focus:ring-[#0069FF]/15 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <SearchableSelect
                        label={lang === "my" ? "ဆိုင်တည်ရှိရာ မြို့နယ် (ရန်ကုန် / နယ်မြို့များ)" : "Store Township (Yangon / Regional)"}
                        options={loadTownships()}
                        value={formData.business_address || ""}
                        onChange={(val) =>
                          setFormData({ ...formData, business_address: val })
                        }
                        lang={lang}
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Commercial Profile */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <Sliders className="w-4 h-4 text-[#0069FF]" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800">
                      {lang === "my" ? "အရောင်းပလက်ဖောင်းနှင့် ပစ်မှတ်အုပ်စု" : "Commercial Audience & Platform"}
                    </h3>
                  </div>

                  <RadioGroup
                    label={lang === "my" ? "အဓိက ရောင်းချသော ကုန်ပစ္စည်းအမျိုးအစား" : "Primary Business Category"}
                    required
                    options={categories}
                    value={formData.business_category}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        business_category: val,
                        mainly_sell:
                          !prev.mainly_sell || prev.mainly_sell === prev.business_category
                            ? val
                            : prev.mainly_sell,
                      }))
                    }
                    lang={lang}
                  />

                  <RadioGroup
                    label={lang === "my" ? "အဓိက ရောင်းချသော ပလက်ဖောင်း" : "Primary Selling Platform"}
                    required
                    options={platforms}
                    value={formData.selling_platform}
                    onChange={(val) =>
                      setFormData((prev) => ({
                        ...prev,
                        selling_platform: val,
                        marketing_method:
                          !prev.marketing_method || prev.marketing_method === prev.selling_platform
                            ? val
                            : prev.marketing_method,
                      }))
                    }
                    lang={lang}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <RadioGroup
                      label={lang === "my" ? "အဓိက ဝယ်ယူသူ အမျိုးအစား" : "Target Customer Type"}
                      required
                      options={mainCustomers}
                      value={formData.main_customer}
                      onChange={(val) => setFormData({ ...formData, main_customer: val })}
                      lang={lang}
                    />

                    <RadioGroup
                      label={lang === "my" ? "အဓိက အသက်အရွယ် အပိုင်းအခြား" : "Primary Age Group"}
                      required
                      options={ageGroups}
                      value={formData.age_group}
                      onChange={(val) => setFormData({ ...formData, age_group: val })}
                      lang={lang}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <RadioGroup
                  label={lang === "my" ? "ခန့်မှန်း အပတ်စဉ် အော်ဒါပမာဏ" : "Estimated Weekly Order Volume"}
                  required
                  options={volumes}
                  value={formData.weekly_order_volume}
                  onChange={(val) =>
                    setFormData({ ...formData, weekly_order_volume: val })
                  }
                  lang={lang}
                />

                <RadioGroup
                  label={lang === "my" ? "လက်ခံသော ငွေပေးချေမှုပုံစံများ" : "Accepted Payment Methods"}
                  required
                  options={payments}
                  value={formData.payment_method}
                  onChange={(val) => setFormData({ ...formData, payment_method: val })}
                  lang={lang}
                />

                <RadioGroup
                  label={lang === "my" ? "အဓိက ပို့ဆောင်ရေးနည်းလမ်း" : "Primary Delivery Method"}
                  required
                  options={deliveries}
                  value={formData.delivery_method}
                  onChange={(val) => setFormData({ ...formData, delivery_method: val })}
                  lang={lang}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <RadioGroup
                  label={lang === "my" ? "AI အလိုအလျောက်စနစ်၏ အဓိကရည်မှန်းချက်" : "Primary Business Goal for AI Automation"}
                  required
                  options={goals}
                  value={formData.business_goal}
                  onChange={(val) => setFormData({ ...formData, business_goal: val })}
                  lang={lang}
                />

                <RadioGroup
                  label={lang === "my" ? "Candy ၏ စကားပြောဟန်ပန်" : "AI Bot Assistant Personality (Candy)"}
                  required
                  options={personalities}
                  value={formData.bot_personality}
                  onChange={(val) =>
                    setFormData((prev) => ({
                      ...prev,
                      bot_personality: val,
                      matter_most:
                        !prev.matter_most || prev.matter_most === prev.bot_personality
                          ? val
                          : prev.matter_most,
                    }))
                  }
                  lang={lang}
                />

                <div className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#0069FF]/20 text-xs text-stone-700 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-[#0069FF] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong>{lang === "my" ? "မှတ်ချက် -" : "Persona Note:"}</strong>{" "}
                    {lang === "my"
                      ? "သင့်လက်ထောက် “Candy” သည် ယဉ်ကျေးပျူငှာသော မြန်မာ့နှုတ်ခွန်းဆက်စကားများဖြင့် စကားပြောဆိုပြီး၊ မြို့နယ်အလိုက် ပို့ဆောင်ခများကို အလိုအလျောက် တွက်ချက်ကာ ကြိုတင်ငွေလွှဲအော်ဒါများအတွက် ငွေလွှဲပြေစာစလစ် ဓာတ်ပုံကို တောင်းခံပေးမည်ဖြစ်ပါသည်။"
                      : "Your assistant “Candy” will speak with culturally respectful Myanmar greetings, compute township delivery rates automatically, and ask for payment slip screenshots when prepaid orders are placed."}
                  </p>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col justify-center items-center text-center space-y-6 py-12"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-3 border-[#0069FF]/20 border-t-[#0069FF] rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center font-serif text-sm font-semibold text-[#0069FF]">
                    SB
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-lg text-stone-900 font-normal">
                    {lang === "my" ? "ဆိုင်စနစ် စီစဉ်သတ်မှတ်နေပါသည်..." : "Configuring Merchant Sanctuary..."}
                  </h3>
                  <p className="text-xs text-stone-500 max-w-sm">
                    {lang === "my"
                      ? "သင့်လုပ်ငန်းအချက်အလက်များကို သိမ်းဆည်းခြင်း၊ မြို့နယ်ပို့ဆောင်ခများ သတ်မှတ်ခြင်းနှင့် Candy AI လက်ထောက်ကို စတင်တပ်ဆင်နေပါသည်။"
                      : "Saving your operational profile, setting up township matrices, and provisioning the Candy AI assistant."}
                  </p>
                </div>
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center items-center text-center space-y-8 py-6"
              >
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-700">
                  <CheckCircle2 size={36} />
                </div>

                <div className="space-y-2 max-w-md">
                  <span className="text-[11px] font-mono font-semibold tracking-[0.2em] uppercase text-[#0069FF]">
                    {lang === "my" ? "ဆိုင်စနစ် စတင်အသုံးပြုနိုင်ပါပြီ" : "STORE ACTIVATED"}
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight">
                    {lang === "my" ? "သင့်စတိုးဆိုင် အဆင်သင့်ဖြစ်ပါပြီ!" : "Your Shop is Ready!"}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {lang === "my" ? (
                      <><strong>{formData.business_name}</strong> အတွက် သီးသန့်အများပြည်သူဆိုင်လင့်ခ်နှင့် စကားပြော AI bot ကို ဖန်တီးပြီးပါပြီ။ Telegram နှင့် လူမှုကွန်ရက်ပေါ်တွင် ဝယ်ယူသူများအား မျှဝေလိုက်ပါ။</>
                    ) : (
                      <>We generated a dedicated public storefront and conversational bot link for <strong>{formData.business_name}</strong>. Share it with your customers on Telegram and social media.</>
                    )}
                  </p>
                </div>

                {/* Public Shop URL Preview */}
                <div className="w-full max-w-lg space-y-2">
                  <label className="text-[11px] font-semibold text-stone-700 block text-left">
                    {lang === "my" ? "သင့်ဆိုင်၏ အများသုံး ဝဘ်လင့်ခ်" : "Your Public Storefront Link"}
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-[#FAF8F5] border border-stone-200 rounded-xl px-4 py-3 text-xs font-mono text-stone-700 truncate flex items-center">
                      {buildShopPublicUrl(generatedShopId)}
                    </div>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className={`px-5 rounded-xl border transition-all flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer ${
                        copied
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300"
                      }`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copied ? (lang === "my" ? "ကူးယူပြီး" : "Copied") : (lang === "my" ? "လင့်ခ်ကူးယူရန်" : "Copy")}</span>
                    </button>
                  </div>
                </div>

                {/* Next Action CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-lg pt-2">
                  <a
                    href={buildShopPublicUrl(generatedShopId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white border border-stone-200 text-stone-800 font-semibold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-stone-50 hover:border-stone-300 transition-all cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    <span>{lang === "my" ? "ဆိုင်ဝဘ်ဆိုဒ် ကြည့်ရှုရန်" : "View Public Store"}</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleComplete}
                    className="flex-1 bg-[#0069FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-semibold py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer"
                  >
                    {lang === "my" ? "ဆိုင်စီမံခန့်ခွဲရေးစနစ်သို့ ဝင်ရောက်မည် →" : "Enter Merchant Hub →"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Action Footer for Steps 1 - 3 */}
          {step < 4 && (
            <div className="flex items-center justify-between pt-8 border-t border-stone-100 mt-8 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={step === 1}
                  onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-200 hover:bg-stone-50 text-stone-600 transition-colors disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{lang === "my" ? "ရှေ့သို့" : "Back"}</span>
                </button>
                {isEditMode && onCancelEdit && (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    {lang === "my" ? "မလုပ်တော့ပါ" : "Cancel"}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {isEditMode && step < 3 && (
                  <button
                    type="button"
                    disabled={!isStepValid()}
                    onClick={handleFinalSubmit}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#F3EFEA] hover:bg-[#EFE8E1] text-stone-800 transition-all cursor-pointer border border-stone-200/60"
                  >
                    {lang === "my" ? "သိမ်းဆည်းမည်" : "Save Changes"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={!isStepValid()}
                  onClick={() => {
                    if (step === 3) {
                      handleFinalSubmit();
                    } else {
                      setStep((prev) => (prev + 1) as 1 | 2 | 3 | 4);
                    }
                  }}
                  className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    isStepValid()
                      ? "bg-[#0069FF] hover:bg-[#0052CC] active:scale-[0.99] text-white shadow-xs"
                      : "bg-stone-200 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  <span>
                    {step === 3
                      ? isEditMode
                        ? lang === "my" ? "သိမ်းဆည်းမည်" : "Save Changes"
                        : lang === "my" ? "ပြီးစီးပြီး ဆိုင်ဖွင့်မည်" : "Finish & Launch Store"
                      : lang === "my" ? "နောက်တစ်ဆင့်" : "Next Step"}
                  </span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subtle Bottom Footer */}
      <footer className="text-center py-4 text-stone-400 text-xs">
        <p>{lang === "my" ? "© ၂၀၂၆ Sales Brain AI • မြန်မာနိုင်ငံအတွက် အဆင့်မြင့် စကားပြောစီးပွားရေးစနစ်" : "© 2026 Sales Brain AI • Curated Conversational Commerce for Myanmar"}</p>
      </footer>
    </div>
  );
}
