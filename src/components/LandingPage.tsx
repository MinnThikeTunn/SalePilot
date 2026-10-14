import React, { useState } from "react";
import {
  User,
  ArrowRight,
  Bot,
  ShieldCheck,
  Truck,
  Headphones,
  Check,
  ChevronRight,
  X,
  Store,
  LogOut,
  Menu
} from "lucide-react";

type LandingPageProps = {
  onGetStarted: () => void;
  onLogin?: () => void;
  isLoggedIn?: boolean;
  onDashboard?: () => void;
  onLogout?: () => void;
  lang?: string;
  onLangChange?: (l: string) => void;
};

export function LandingPage({
  onGetStarted,
  onLogin,
  isLoggedIn = false,
  onDashboard,
  onLogout,
}: LandingPageProps) {
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-[#0069FF] selection:text-white font-sans antialiased">
      {/* Top Sky Announcement Ribbon */}
      {bannerVisible && (
        <div className="bg-[#70B4FF] text-[#0A1B2A] py-2 px-4 sm:px-8 text-xs font-medium flex items-center justify-between border-b border-[#5B9FEA]/40 transition-all">
          <div className="flex-1 text-center flex items-center justify-center gap-2">
            <span className="font-semibold">Introducing the new Sales Brain AI, built to automate social commerce.</span>
            <button
              type="button"
              onClick={onGetStarted}
              className="underline hover:opacity-85 font-bold cursor-pointer transition"
            >
              Learn more →
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
            className="font-serif text-2xl sm:text-[26px] tracking-tight text-stone-900 font-medium hover:opacity-80 transition text-left cursor-pointer flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center shadow-xs">
              <Store className="w-4 h-4 text-stone-200" strokeWidth={1.8} />
            </div>
            <span>Sales Brain</span>
          </button>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide text-stone-600">
            <a href="#capabilities" className="hover:text-stone-950 transition">
              Capabilities
            </a>
            <a href="#philosophy" className="hover:text-stone-950 transition">
              Philosophy
            </a>
            <a href="#workflows" className="hover:text-stone-950 transition">
              Workflows
            </a>
            <a href="#about" className="hover:text-stone-950 transition">
              About
            </a>
          </nav>

          {/* Right Action Icons & Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={onDashboard || onGetStarted}
                  className="bg-[#0A1B2A] hover:bg-[#1E293B] text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer shadow-xs active:scale-[0.98] flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Dashboard →</span>
                </button>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="border border-[#E2E8F0] hover:border-stone-400 bg-white hover:bg-stone-100 text-stone-700 hover:text-[#0A1B2A] px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="text-stone-600 hover:text-[#0A1B2A] transition text-xs font-medium cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-full hover:bg-stone-100"
                >
                  <User className="w-4 h-4 stroke-[1.75]" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="bg-[#0A1B2A] hover:bg-[#1E293B] text-white px-5 sm:px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition duration-200 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  Get Started
                </button>
              </>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-2 rounded-xl text-stone-600 hover:text-[#0A1B2A] hover:bg-stone-100 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0069FF]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200/80 bg-[#FAF8F5] px-6 py-4 space-y-3 animate-fadeIn">
            <nav className="flex flex-col gap-2.5 text-sm font-medium text-stone-700">
              <a
                href="#capabilities"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-stone-100 transition"
              >
                Capabilities
              </a>
              <a
                href="#philosophy"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-stone-100 transition"
              >
                Philosophy
              </a>
              <a
                href="#workflows"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-stone-100 transition"
              >
                Workflows
              </a>
              <a
                href="#about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-stone-100 transition"
              >
                About
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 sm:px-12 pt-12 pb-20 sm:pt-16 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Headline & Pitch */}
            <div className="lg:col-span-6 max-w-xl">
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] leading-[1.2] text-stone-900 tracking-tight font-normal">
                Curated Sales <br className="hidden sm:inline" />
                Intelligence for Your <br className="hidden sm:inline" />
                Social Commerce
              </h1>
              <p className="mt-6 text-stone-600 text-base sm:text-[17px] leading-relaxed font-normal">
                Autonomous AI sales agents crafted for independent merchants. Elevate your customer conversations across Telegram and social channels with automated order taking, instant slip verification, and warmth.
              </p>
              <div className="mt-8 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onGetStarted}
                  className="bg-black hover:bg-stone-900 text-white px-8 py-3.5 rounded-xl text-sm font-semibold tracking-wide shadow-xs transition duration-200 cursor-pointer active:scale-[0.99]"
                >
                  Get Started
                </button>
                <a
                  href="#workflows"
                  className="hidden sm:inline-flex items-center gap-1.5 text-stone-600 hover:text-stone-900 text-sm font-medium transition"
                >
                  <span>Explore Workflows</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Right Curated Visual Frame */}
            <div className="lg:col-span-6">
              <div className="rounded-[32px] bg-white border border-stone-200/90 shadow-sm p-5 sm:p-7 space-y-4 sm:space-y-5">
                {/* Header Bar */}
                <div className="flex items-center justify-between pb-3.5 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-900 font-serif font-semibold text-base shadow-2xs">
                      SB
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-sm font-medium text-stone-900">
                          Candy · Sales Concierge
                        </h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live on Telegram &amp; Web
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Township couriers, real-time stock &amp; instant settlement
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Live Customer Interaction */}
                <div className="space-y-3 text-xs">
                  {/* Customer bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] bg-stone-900 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-2xs">
                      <p className="leading-relaxed">
                        Hello! Is the Ceramic Pour-Over in stock? Can you deliver to Kamayut Township?
                      </p>
                      <span className="text-[10px] text-stone-400 mt-1 block text-right font-mono">10:42 AM</span>
                    </div>
                  </div>

                  {/* Assistant bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[90%] bg-[#FAF8F5] border border-stone-200 text-stone-800 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs space-y-2">
                      <p className="leading-relaxed">
                        Mingalabar! Yes, we have 4 units available at <strong>45,000 MMK</strong>. Doorstep delivery to <strong>Kamayut Township</strong> is <strong>2,500 MMK</strong> with arrival in 1–2 days.
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-medium text-stone-700">
                          Stock: 4 Available
                        </span>
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-medium text-stone-700">
                          Delivery: 2,500 MMK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Order Confirmation Card */}
                  <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-stone-900 uppercase tracking-wider">
                          INV-2026-7821
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                          Confirmed Order
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-stone-400">10:43 AM</span>
                    </div>

                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-stone-700">
                        <span className="font-serif">Ceramic Pour-Over &amp; Linen Tote × 1</span>
                        <span className="font-mono font-medium">45,000 MMK</span>
                      </div>
                      <div className="flex justify-between text-stone-500">
                        <span>Township Courier (Kamayut)</span>
                        <span className="font-mono">+2,500 MMK</span>
                      </div>
                      <div className="flex justify-between text-stone-900 font-semibold pt-1 border-t border-stone-100">
                        <span>Total Bill</span>
                        <span className="font-mono text-xs">47,500 MMK</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-stone-500 border-t border-stone-100/80">
                      <span>Payment: Cash on Delivery / Mobile Wallet</span>
                      <span className="text-stone-700 font-medium">Dispatched to Courier</span>
                    </div>
                  </div>
                </div>

                {/* Trust & Automation Capabilities Footer */}
                <div className="pt-2 border-t border-stone-100 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="text-[10px] text-stone-400 font-mono uppercase">Response</p>
                    <p className="text-xs font-semibold text-stone-900 mt-0.5">&lt; 2s Instant</p>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="text-[10px] text-stone-400 font-mono uppercase">Delivery</p>
                    <p className="text-xs font-semibold text-stone-900 mt-0.5">Township Rates</p>
                  </div>
                  <div className="p-2 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="text-[10px] text-stone-400 font-mono uppercase">Settlement</p>
                    <p className="text-xs font-semibold text-stone-900 mt-0.5">OCR Slip Audit</p>
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
                Capabilities by Workflow
              </h2>
              <p className="mt-2 text-stone-500 text-sm">
                Find your perfect automation layer across our modular merchant suite.
              </p>
            </div>
            <button
              type="button"
              onClick={onGetStarted}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-black hover:text-stone-700 transition cursor-pointer"
            >
              <span>View All</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10">
            {/* Category 1 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-xl p-2 transition"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                Conversational AI
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                24/7 sales agent
              </p>
            </button>

            {/* Category 2 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-xl p-2 transition"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                Slip Verification
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                Instant OCR audit
              </p>
            </button>

            {/* Category 3 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-xl p-2 transition"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                Delivery Matrix
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                Township rates
              </p>
            </button>

            {/* Category 4 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-xl p-2 transition"
            >
              <h3 className="font-serif text-xl sm:text-2xl text-stone-900 group-hover:text-[#0069FF] transition">
                Live VIP Support
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-normal">
                1-click takeover
              </p>
            </button>
          </div>
        </section>

        {/* Section 3: Our Philosophy */}
        <section id="philosophy" className="bg-[#FAF8F5] py-20 sm:py-28 px-6 border-t border-stone-200/60">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0069FF] mb-4 block">
              OUR PHILOSOPHY
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-stone-900 tracking-tight font-normal">
              Commerce for Conversations, Always
            </h2>
            <p className="mt-6 text-stone-600 text-sm sm:text-base leading-relaxed font-normal">
              In social-first markets, transactions are born in direct messages, voice notes, and payment screenshots—not static web checkout carts. Sales Brain eliminates the manual friction of answering inventory questions, calculating township fees, and auditing bank accounts. We partner directly with modern makers across studios to doorsteps, keeping orders moving with zero overhead.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={onGetStarted}
                className="bg-black hover:bg-stone-900 text-white px-7 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition duration-200 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: Featured Workflows */}
        <section id="workflows" className="max-w-7xl mx-auto px-6 sm:px-12 py-20 sm:py-28 border-t border-stone-200/60">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight font-normal">
              Trending Workflows
            </h2>
            <p className="mt-3 text-stone-500 text-sm">
              The autonomous capabilities our merchants rely on to scale every single day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-2xl p-1 transition"
            >
              <div className="w-full aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <Bot className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  Telegram &amp; Web
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  Autonomous Chatbot
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  Telegram Sales Agent
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Conversational AI</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">24/7 Autopilot</p>
              </div>
            </button>

            {/* Card 2 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-2xl p-1 transition"
            >
              <div className="w-full aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  Payment Security
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  Slip OCR Verification
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  Smart Receipt Evaluator
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Fraud Prevention</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">Zero-Risk Prepay</p>
              </div>
            </button>

            {/* Card 3 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-2xl p-1 transition"
            >
              <div className="w-full aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <Truck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  Logistics Routing
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  Township Matrix
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  Township Delivery Matrix
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Automated Rates</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">Dynamic Rates</p>
              </div>
            </button>

            {/* Card 4 */}
            <button
              type="button"
              onClick={onGetStarted}
              className="cursor-pointer group flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0069FF] rounded-2xl p-1 transition"
            >
              <div className="w-full aspect-square bg-white rounded-2xl flex flex-col items-center justify-center p-8 border border-stone-200/80 transition duration-300 group-hover:border-[#0069FF]/40 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#0069FF] shadow-xs mb-4">
                  <Headphones className="w-6 h-6 stroke-[1.5]" />
                </div>
                <span className="text-[11px] font-mono tracking-wider uppercase text-stone-500">
                  Live Intervention
                </span>
                <p className="font-serif text-base text-stone-800 mt-2 text-center">
                  VIP Support Desk
                </p>
              </div>
              <div className="mt-4">
                <h3 className="font-serif text-lg text-stone-900 group-hover:text-[#0069FF] transition">
                  Live VIP Support Desk
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Human-in-the-Loop</p>
                <p className="text-xs font-semibold text-stone-800 mt-2">1-Click Takeover</p>
              </div>
            </button>
          </div>
        </section>

        {/* Section 5: Newsletter & Launch */}
        <section className="bg-[#FAF8F5] py-20 sm:py-28 px-6 border-t border-stone-200/60 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight font-normal">
              Stay in the Loop
            </h2>
            <p className="mt-3 text-stone-500 text-sm">
              New features, sales playbooks, and exclusive intelligence... delivered straight to your inbox.
            </p>

            {subscribed ? (
              <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-sm flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> <span>Welcome! Opening login...</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-8 flex items-center justify-center max-w-md mx-auto">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Your email address"
                  className="bg-white border border-stone-300 border-r-0 px-4 py-3 rounded-l-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-900 w-full"
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-stone-900 text-white px-6 py-3 rounded-r-xl text-sm font-semibold tracking-wide transition shrink-0 cursor-pointer active:scale-[0.98]"
                >
                  Get Started
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="about" className="bg-[#F5F1EA] border-t border-stone-200/80 pt-16 pb-12 text-stone-600 text-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-14">
          <div>
            <h4 className="font-serif text-lg text-stone-900 mb-4 font-normal">
              Sales Brain
            </h4>
            <p className="text-stone-500 leading-relaxed max-w-xs font-normal">
              Curating timeless, autonomous commerce tools for independent merchants and social brands.
            </p>
          </div>

          <div>
            <h5 className="font-medium text-stone-900 mb-4 tracking-wider uppercase text-[11px]">
              Platform &amp; Access
            </h5>
            <ul className="space-y-2.5">
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  Sign In / Get Started
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  Telegram Assistant
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  Township Matrix
                </button>
              </li>
              <li>
                <button type="button" onClick={onGetStarted} className="hover:text-stone-900 transition cursor-pointer">
                  VIP Support Desk
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-medium text-stone-900 mb-4 tracking-wider uppercase text-[11px]">
              Company
            </h5>
            <ul className="space-y-2.5">
              <li>
                <a href="#philosophy" className="hover:text-stone-900 transition">
                  Our Story
                </a>
              </li>
              <li>
                <a href="#workflows" className="hover:text-stone-900 transition">
                  Workflows
                </a>
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
