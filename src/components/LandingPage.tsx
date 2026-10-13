import React, { useState } from "react";
import {
  Search,
  User,
  ShoppingBag,
  ArrowRight,
  Bot,
  ShieldCheck,
  Truck,
  Headphones,
  Check,
  ChevronRight,
  Sparkles,
  X
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

type LandingPageProps = {
  onGetStarted: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
  onDashboard?: () => void;
  lang?: "en" | "my";
  onLangChange?: (l: "en" | "my") => void;
};

export function LandingPage({
  onGetStarted,
  onLogin,
  isLoggedIn = false,
  onDashboard,
  lang: propLang,
  onLangChange
}: LandingPageProps) {
  const { lang: contextLang, setLang: contextSetLang } = useLanguage();
  const lang = propLang || contextLang;
  const setLang = onLangChange || contextSetLang;

  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
    setTimeout(() => {
      onGetStarted();
    }, 900);
  };

  const handleLoginClick = () => {
    if (isLoggedIn && onDashboard) {
      onDashboard();
    } else if (onLogin) {
      onLogin();
    } else {
      onGetStarted();
    }
  };

  const isMy = lang === "my";

  return (
    <div className={`min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-[#0069FF] selection:text-white font-sans antialiased ${isMy ? "lang-my" : ""}`}>
      {/* Top Sky Announcement Ribbon (Calendly Inspiration) */}
      {bannerVisible && (
        <div className="bg-[#70B4FF] text-[#0A1B2A] py-2 px-4 sm:px-8 text-xs font-medium flex items-center justify-between border-b border-[#5B9FEA]/40 transition-all">
          <div className="flex-1 text-center flex items-center justify-center gap-2">
            <span className="font-semibold">⚡ {isMy ? "မြန်မာကုန်သည်များအတွက် AI စနစ်သစ် မိတ်ဆက်ခြင်း" : "Introducing the new Sales Brain AI, built to automate social commerce."}</span>
            <button
              type="button"
              onClick={onGetStarted}
              className="underline hover:opacity-85 font-bold cursor-pointer transition"
            >
              {isMy ? "လေ့လာရန် →" : "Learn more →"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBannerVisible(false)}
            className="text-[#0A1B2A]/70 hover:text-[#0A1B2A] p-0.5 rounded cursor-pointer transition"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <header className="border-b border-stone-200/60 bg-[#FAF8F5]/90 backdrop-blur-sm sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-5 sm:py-6 flex items-center justify-between">
          {/* Brand Logo in Classic Serif */}
          <button
            type="button"
            onClick={onGetStarted}
            className="font-serif text-2xl sm:text-[26px] tracking-tight text-stone-900 font-medium hover:opacity-80 transition text-left cursor-pointer flex items-center gap-2"
          >
            <span>Sales Brain</span>
            <span className="text-[10px] font-sans font-bold bg-[#0069FF]/10 text-[#0069FF] px-2 py-0.5 rounded-full uppercase tracking-wider">
              AI
            </span>
          </button>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide text-stone-600">
            <a href="#capabilities" className="hover:text-stone-950 transition">
              {isMy ? "စွမ်းဆောင်ရည်များ" : "Capabilities"}
            </a>
            <a href="#philosophy" className="hover:text-stone-950 transition">
              {isMy ? "အယူအဆ" : "Philosophy"}
            </a>
            <a href="#workflows" className="hover:text-stone-950 transition">
              {isMy ? "လုပ်ငန်းစဉ်များ" : "Workflows"}
            </a>
            <a href="#about" className="hover:text-stone-950 transition">
              {isMy ? "အကြောင်း" : "About"}
            </a>
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Header Language Switcher Pill */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-full border border-stone-200/80 shadow-xs">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === "en"
                    ? "bg-white text-stone-900 shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("my")}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  lang === "my"
                    ? "bg-[#0069FF] text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
                title="မြန်မာဘာသာသို့ ပြောင်းမည်"
              >
                မြန်မာ
              </button>
            </div>

            <button
              type="button"
              onClick={handleLoginClick}
              className="text-stone-600 hover:text-stone-950 transition text-xs font-medium cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-full hover:bg-stone-100"
              title={isLoggedIn ? "Dashboard" : "Sign In"}
              aria-label={isLoggedIn ? "Dashboard" : "Sign In"}
            >
              <User className="w-4 h-4 stroke-[1.75]" />
              <span className="hidden sm:inline">
                {isLoggedIn 
                  ? (isMy ? "လုပ်ငန်းခွင်" : "Dashboard") 
                  : (isMy ? "အကောင့်ဝင်မည်" : "Sign In")}
              </span>
            </button>

            {isLoggedIn && onDashboard && (
              <button
                type="button"
                onClick={onDashboard}
                className="hidden md:inline-flex items-center text-xs font-medium text-stone-700 bg-stone-200/70 hover:bg-stone-300 px-3 py-2 rounded-md transition cursor-pointer"
              >
                {isMy ? "လုပ်ငန်းခွင် →" : "Dashboard →"}
              </button>
            )}

            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center text-xs font-medium tracking-wider uppercase bg-[#0069FF] hover:bg-[#0052CC] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition shadow-xs cursor-pointer active:scale-[0.98]"
            >
              {isMy ? "စတင်မည်" : "Get Started"}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Headline & Pitch */}
            <div className="lg:col-span-6 max-w-xl">
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] leading-[1.2] text-stone-900 tracking-tight font-normal">
                {isMy ? (
                  <>
                    လူမှုကူးသန်းရောင်းဝယ်ရေးအတွက် <br className="hidden sm:inline" />
                    ခေတ်မီ AI အရောင်းစနစ်
                  </>
                ) : (
                  <>
                    Curated Sales <br className="hidden sm:inline" />
                    Intelligence for Your <br className="hidden sm:inline" />
                    Social Commerce
                  </>
                )}
              </h1>
              <p className="mt-6 text-stone-600 text-base sm:text-[17px] leading-relaxed font-normal">
                {isMy
                  ? "မြန်မာလုပ်ငန်းရှင်များအတွက် အထူးပြုလုပ်ထားသော AI အရောင်းလက်ထောက်။ Telegram, Messenger နှင့် လူမှုကွန်ရက်များမှ အော်ဒါလက်ခံခြင်း၊ KPay/Wave ငွေလွှဲစလစ် စစ်ဆေးခြင်းနှင့် မြို့နယ် ပို့ဆောင်ခ တွက်ချက်ခြင်းများကို အလိုအလျောက် ပြုလုပ်ပေးပါသည်။"
                  : "Autonomous AI sales agents crafted for independent merchants. Elevate your customer conversations across Telegram and social channels with automated order taking, instant slip verification, and warmth."}
              </p>
              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="bg-[#0069FF] hover:bg-[#0052CC] text-white px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide shadow-xs transition duration-200 cursor-pointer active:scale-[0.99]"
                >
                  {isMy ? "စတင်အသုံးပြုမည်" : "Get Started"}
                </button>
                <a
                  href="#workflows"
                  className="hidden sm:inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-sm font-medium transition"
                >
                  <span>{isMy ? "လုပ်ငန်းစဉ်များ ကြည့်ရှုမည်" : "Explore Workflows"}</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Curated Visual Frame */}
            <div className="lg:col-span-6">
              <div className="relative rounded-[32px] overflow-hidden shadow-sm aspect-[4/5] bg-stone-100 border border-stone-200/60 group">
                <img
                  src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80"
                  alt="Curated merchant sanctuary with artisanal goods"
                  className="w-full h-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
                />

                {/* Subtle Floating AI Commerce Overlay Badge */}
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md border border-stone-200/80 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-stone-700 tracking-wide">
                    {isMy ? "ဘော့တ် အသက်ဝင်နေသည် · Telegram & Web" : "Live Bot Active · Telegram & Web"}
                  </span>
                </div>

                {/* Bottom Verified Slip Card */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md border border-stone-200/80 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-[#0069FF]">
                      {isMy ? "အလိုအလျောက် အော်ဒါ" : "Automated Checkout"}
                    </span>
                    <span className="text-xs font-mono text-stone-400">
                      INV-2026-7821
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-serif font-medium text-stone-900">
                        {isMy ? "ရိုးရာ လက်မှု ကုန်ပစ္စည်း စုံတွဲ" : "Ceramic Pour-Over & Linen Tote"}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {isMy ? "ကမာရွတ် ပို့ဆောင်ခ · 2,500 MMK" : "Matched to Kamayut Delivery · 2,500 MMK"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>{isMy ? "စလစ် အတည်ပြုပြီး" : "Slip Verified"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Capabilities by Workflow */}
        <section id="capabilities" className="max-w-7xl mx-auto px-6 sm:px-12 py-16 sm:py-20 border-t border-stone-200/60">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight font-normal">
                {isMy ? "အဓိက စွမ်းဆောင်ရည်များ" : "Capabilities by Workflow"}
              </h2>
              <p className="mt-2 text-stone-500 text-sm">
                {isMy
                  ? "သင့်လုပ်ငန်းအတွက် လိုအပ်သော အလိုအလျောက် အရောင်းစနစ်ကို ရွေးချယ်ပါ။"
                  : "Find your perfect automation layer across our modular merchant suite."}
              </p>
            </div>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-[#0069FF] hover:text-[#0052CC] transition cursor-pointer"
            >
              <span>{isMy ? "အားလုံး ကြည့်မည်" : "View All"}</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {/* Category 1 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                {isMy ? "AI စကားပြောလက်ထောက်" : "Conversational AI"}
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                {isMy ? "၂၄ နာရီ အရောင်းလက်ထောက်" : "24/7 sales agent"}
              </p>
            </div>

            {/* Category 2 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                {isMy ? "ငွေလွှဲစလစ် စစ်ဆေးခြင်း" : "Slip Verification"}
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                {isMy ? "ချက်ချင်း စစ်ဆေးအတည်ပြုခြင်း" : "Instant OCR audit"}
              </p>
            </div>

            {/* Category 3 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                {isMy ? "မြို့နယ် ပို့ဆောင်ခ နှုန်းထား" : "Delivery Matrix"}
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                {isMy ? "အလိုအလျောက် တွက်ချက်မှု" : "Township rates"}
              </p>
            </div>

            {/* Category 4 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                {isMy ? "တိုက်ရိုက် VIP အကူအညီ" : "Live VIP Support"}
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                {isMy ? "ဆိုင်ရှင် ကိုယ်တိုင် ဖြေကြားခြင်း" : "1-click takeover"}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Our Philosophy */}
        <section id="philosophy" className="bg-[#FAF8F5] py-20 sm:py-28 px-6 border-t border-stone-200/60">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0069FF] mb-4 block">
              {isMy ? "ကျွန်ုပ်တို့၏ အယူအဆ" : "OUR PHILOSOPHY"}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-stone-900 tracking-tight font-normal">
              {isMy ? "စကားပြောဆိုမှုမှတစ်ဆင့် အရောင်းအဝယ်ဖြစ်ခြင်း" : "Commerce for Conversations, Always"}
            </h2>
            <p className="mt-6 text-stone-600 text-sm sm:text-base leading-relaxed font-normal">
              {isMy
                ? "မြန်မာနိုင်ငံ၏ လူမှုစီးပွားရေးတွင် အရောင်းအဝယ်များသည် မက်ဆေ့ခ်ျများ၊ အသံဖိုင်များနှင့် ငွေလွှဲစလစ်များမှ စတင်ပါသည်။ Sales Brain သည် ပစ္စည်းမေးမြန်းမှုများ ဖြေကြားခြင်း၊ ပို့ဆောင်ခ တွက်ချက်ခြင်းနှင့် ဘဏ်စလစ် စစ်ဆေးခြင်းဆိုင်ရာ အခက်အခဲများကို ဖြေရှင်းပေးပြီး ဆိုင်ရှင်များအနေဖြင့် အရောင်းအဝယ်ကို စိတ်ချလက်ချ တိုးချဲ့နိုင်စေပါသည်။"
                : "In social-first markets, transactions are born in direct messages, voice notes, and payment screenshots—not static web checkout carts. Sales Brain eliminates the manual friction of answering inventory questions, calculating township fees, and auditing bank accounts. We partner directly with modern makers across studios to doorsteps, keeping orders moving with zero overhead."}
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={onGetStarted}
                className="border border-stone-300 hover:border-stone-900 text-stone-800 hover:text-stone-950 px-6 py-2.5 rounded-xl text-xs font-medium uppercase tracking-wider transition bg-white/40 cursor-pointer"
              >
                {isMy ? "အခမဲ့ စတင်မည်" : "Get Started Free"}
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Featured Workflows */}
        <section id="workflows" className="max-w-7xl mx-auto px-6 sm:px-12 py-20 sm:py-28 border-t border-stone-200/60">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight font-normal">
              {isMy ? "အသုံးများသော လုပ်ငန်းစဉ်များ" : "Trending Workflows"}
            </h2>
            <p className="mt-3 text-stone-500 text-sm">
              {isMy
                ? "နေ့စဉ် လုပ်ငန်းတိုးတက်စေရန် အသုံးပြုနေသော အလိုအလျောက် စနစ်များ။"
                : "The autonomous capabilities our merchants rely on to scale every single day."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col"
            >
              <div className="aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <Bot className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  Telegram &amp; Web
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  {isMy ? "AI အရောင်းလက်ထောက်" : "Autonomous Chatbot"}
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  {isMy ? "Telegram အရောင်းလက်ထောက်" : "Telegram Sales Agent"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{isMy ? "စကားပြော AI စနစ်" : "Conversational AI"}</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">{isMy ? "၂၄ နာရီ အလိုအလျောက်" : "24/7 Autopilot"}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col"
            >
              <div className="aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  {isMy ? "ငွေပေးချေမှု လုံခြုံရေး" : "Payment Security"}
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  {isMy ? "စလစ် OCR စစ်ဆေးခြင်း" : "Slip OCR Verification"}
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  {isMy ? "စမတ် ငွေလွှဲပြေစာ စစ်ဆေးစနစ်" : "Smart Receipt Evaluator"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{isMy ? "လိမ်လည်မှု ကာကွယ်ရေး" : "Fraud Prevention"}</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">{isMy ? "အန္တရာယ်ကင်း မိုဘိုင်းငွေလွှဲ" : "Zero-Risk Prepay"}</p>
              </div>
            </div>

            {/* Card 3 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col"
            >
              <div className="aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <Truck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  {isMy ? "ပို့ဆောင်ရေး စီမံမှု" : "Logistics Routing"}
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  {isMy ? "မြို့နယ် နှုန်းထား" : "Township Matrix"}
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  {isMy ? "မြို့နယ်အလိုက် ပို့ဆောင်ခ စနစ်" : "Township Delivery Matrix"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{isMy ? "အလိုအလျောက် တွက်ချက်မှု" : "Automated Rates"}</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">{isMy ? "တိကျသော နှုန်းထား" : "Dynamic Rates"}</p>
              </div>
            </div>

            {/* Card 4 */}
            <div
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col"
            >
              <div className="aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <Headphones className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  {isMy ? "တိုက်ရိုက် အကူအညီ" : "Live Intervention"}
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  {isMy ? "VIP စကားပြောခန်း" : "VIP Support Desk"}
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  {isMy ? "တိုက်ရိုက် VIP အကူအညီခန်း" : "Live VIP Support Desk"}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">{isMy ? "လူကိုယ်တိုင် ဖြေကြားနိုင်မှု" : "Human-in-the-Loop"}</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">{isMy ? "၁ ချက်နှိပ် ဝင်ရောက်ပြောဆိုခြင်း" : "1-Click Takeover"}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Newsletter & Launch */}
        <section className="bg-[#FAF8F5] py-20 sm:py-28 px-6 border-t border-stone-200/60 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight font-normal">
              {isMy ? "သတင်းနှင့် အကြံပြုချက်များ ရယူပါ" : "Stay in the Loop"}
            </h2>
            <p className="mt-3 text-stone-500 text-sm">
              {isMy
                ? "လုပ်ငန်းတိုးတက်ရေး အကြံဉာဏ်များနှင့် ဝန်ဆောင်မှုအသစ်များကို သင့်အီးမေးလ်သို့ တိုက်ရိုက် ပေးပို့ပါမည်။"
                : "New features, sales playbooks, and exclusive intelligence... delivered straight to your inbox."}
            </p>

            {subscribed ? (
              <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> <span>{isMy ? "ကြိုဆိုပါသည်! အကောင့်ဖွင့်ပေးနေပါသည်..." : "Welcome! Opening login..."}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-8 flex items-center justify-center max-w-md mx-auto">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={isMy ? "သင့်အီးမေးလ် လိပ်စာ" : "Your email address"}
                  className="bg-white border border-stone-300 border-r-0 px-4 py-3 rounded-l-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#0069FF] w-full"
                />
                <button
                  type="submit"
                  className="bg-[#0069FF] hover:bg-[#0052CC] text-white px-6 py-3 rounded-r-xl text-sm font-semibold tracking-wide transition shrink-0 cursor-pointer"
                >
                  {isMy ? "စတင်မည်" : "Get Started"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="bg-[#F5F1EA] border-t border-stone-200/80 pt-16 pb-12 text-stone-600 text-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <h4 className="font-serif text-lg text-stone-900 mb-4 font-normal">
              Sales Brain
            </h4>
            <p className="text-stone-500 leading-relaxed max-w-xs font-normal">
              {isMy
                ? "မြန်မာလုပ်ငန်းရှင်များအတွက် ခေတ်မီပြီး အဆင့်မြင့်သော လူမှုကူးသန်းရောင်းဝယ်ရေး AI စနစ်။"
                : "Curating timeless, autonomous commerce tools for independent merchants and social brands."}
            </p>
          </div>

          <div>
            <h5 className="font-medium text-stone-900 mb-4 tracking-wider uppercase text-[11px]">
              {isMy ? "ပလက်ဖောင်းနှင့် စနစ်များ" : "Platform & Access"}
            </h5>
            <ul className="space-y-2.5">
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  {isMy ? "အကောင့်ဝင် / စတင်မည်" : "Sign In / Get Started"}
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  {isMy ? "Telegram လက်ထောက်" : "Telegram Assistant"}
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  {isMy ? "မြို့နယ် ပို့ဆောင်ခ စနစ်" : "Township Matrix"}
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  {isMy ? "VIP အကူအညီခန်း" : "VIP Support Desk"}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-stone-900 mb-4 tracking-wider uppercase text-[11px]">
              {isMy ? "ကုမ္ပဏီ" : "Company"}
            </h5>
            <ul className="space-y-2.5">
              <li>
                <a href="#philosophy" className="hover:text-stone-900 transition">
                  {isMy ? "ကျွန်ုပ်တို့ အကြောင်း" : "Our Story"}
                </a>
              </li>
              <li>
                <a href="#workflows" className="hover:text-stone-900 transition">
                  {isMy ? "လုပ်ငန်းစဉ်များ" : "Workflows"}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-stone-900 mb-4 tracking-wider uppercase text-[11px]">
              {isMy ? "အကူအညီနှင့် ဥပဒေ" : "Help & Legal"}
            </h5>
            <ul className="space-y-2.5">
              <li>
                <span className="text-stone-500">{isMy ? "ပို့ဆောင်ခ နှုန်းထားများ" : "Shipping & Delivery Matrix"}</span>
              </li>
              <li>
                <span className="text-stone-500">{isMy ? "အမေးများသော မေးခွန်းများ" : "FAQ"}</span>
              </li>
              <li>
                <span className="text-stone-500">{isMy ? "ကိုယ်ရေးအချက်အလက် မူဝါဒ" : "Privacy Policy"}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 sm:px-12 mt-16 pt-8 border-t border-stone-200/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 text-[11px]">
          <p>© 2026 Sales Brain AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-stone-600 transition cursor-pointer">Telegram</span>
            <span className="hover:text-stone-600 transition cursor-pointer">Facebook</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
