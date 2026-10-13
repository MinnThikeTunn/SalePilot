"use client";

import { useState } from "react";
import { ShopChatbot } from "./ShopChatbot";
import { Product, DeliveryZone } from "../types";
import { Sparkles, MapPin, CreditCard, ShoppingBag, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export interface PublicShop {
  shopId: string;
  businessName: string;
  phone?: string;
  description: string | null;
  paymentInfo: string;
  deliveryInfo: string;
  products: Product[];
  deliveryZones: DeliveryZone[];
}

function buildPromptSuggestions(shop: PublicShop, lang: "en" | "my" = "en") {
  const product = shop.products?.[0]?.name;

  if (lang === "my") {
    return [
      "ယနေ့ အထူးပစ္စည်းများ ဘာတွေရှိလဲရှင့်?",
      product ? `${product} အကြောင်း အသေးစိတ်သိချင်ပါတယ်` : "လူကြိုက်များသော ပစ္စည်းလေး အကြံပြုပေးပါ",
      "ရန်ကုန်မြို့နယ်အလိုက် ပို့ဆောင်ခ ဘယ်လောက်ကျပါသလဲ?",
      "KPay (သို့) WavePay ဖြင့် ဘယ်လိုငွေလွှဲရမလဲရှင့်?",
    ];
  }

  return [
    "What products are featured today?",
    product ? `Tell me more about ${product}` : "Recommend a product for me",
    "Delivery townships and fees in Yangon",
    "How can I pay via KPay or WavePay?",
  ];
}

function ShopInfoPanel({ shop }: { shop: PublicShop }) {
  const { lang, setLang } = useLanguage();
  const products = shop.products || [];
  const visibleProducts = products.slice(0, 6);

  return (
    <>
      <div className="shrink-0 border-b border-[#E7E5E4] px-6 py-5 bg-[#FAF8F5]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0069FF]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0069FF]">
              {lang === "my" ? "အဆင့်မြင့် လူမှုစီးပွား အရောင်းစနစ်" : "Artisanal Social Commerce"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLang(lang === "en" ? "my" : "en")}
            className="flex items-center gap-1.5 rounded-full border border-[#E7E5E4] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1C1917] hover:border-[#0069FF]/40 hover:bg-[#EFF6FF]/50 transition-all cursor-pointer shadow-2xs"
            title={lang === "en" ? "Switch to Myanmar" : "Switch to English"}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0069FF]" />
            <span>{lang === "en" ? "မြန်မာ" : "EN"}</span>
          </button>
        </div>
        <h1 className="mt-2 text-2xl font-serif font-normal text-[#1C1917] tracking-tight">
          {shop.businessName || (lang === "my" ? "အွန်လိုင်းစတိုး" : "Online Store")}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
          {shop.description ||
            (lang === "my"
              ? "ဆိုင်ရှိပစ္စည်းများ၊ မြို့နယ်အလိုက် ပို့ဆောင်ခနှင့် မိုဘိုင်းငွေလွှဲအကြောင်း Candy အား အချိန်မရွေး မေးမြန်းနိုင်ပါသည်။"
              : "Ask Candy anything about catalog items, township delivery fees, or mobile payment.")}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 no-scrollbar space-y-6">
        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78716C]">
              {lang === "my" ? "ရွေးချယ်ထားသော ပစ္စည်းများ" : "Curated Catalog"}
            </p>
            <span className="rounded-full bg-[#FAF8F5] border border-[#E7E5E4] px-2.5 py-0.5 text-xs font-mono font-medium text-[#57534E]">
              {products.length} {lang === "my" ? "ခု" : "items"}
            </span>
          </div>

          <div className="space-y-2.5">
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5] px-4 py-4 text-xs text-[#78716C] text-center">
                {lang === "my" ? "ပစ္စည်းများ တင်ပြီးပါက ဤနေရာတွင် ပြသပေးပါမည်။" : "Catalog will appear here once published."}
              </div>
            ) : (
              visibleProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] p-3.5 hover:border-stone-400 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-sans font-medium text-[#1C1917] tracking-tight">
                        {product.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#78716C]">
                        {product.description || (lang === "my" ? "ပစ္စည်းအကြောင်းနှင့် လက်ကျန်ကို Candy အား မေးမြန်းနိုင်ပါသည်။" : "Ask Candy for item availability and details.")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#FAF8F5] border border-[#E7E5E4] px-2.5 py-1 text-xs font-mono font-medium text-[#1C1917]">
                      {(Number(product.price) || 0).toLocaleString()} MMK
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {products.length > visibleProducts.length && (
            <p className="mt-3 rounded-xl border border-[#E7E5E4] bg-[#FAF8F5] px-4 py-2.5 text-xs text-[#78716C] text-center leading-relaxed">
              {lang === "my"
                ? `စုစုပေါင်း ${products.length} ခုအနက် ${visibleProducts.length} ခု ပြသထားပါသည်။ ပစ္စည်းအားလုံး ကြည့်ရှုလိုပါက Chat တွင် Candy အား မေးမြန်းနိုင်ပါသည်။`
                : `Showing ${visibleProducts.length} of ${products.length} items. Ask Candy in chat to browse the complete collection.`}
            </p>
          )}
        </section>

        {/* Store Logistics & Settlement */}
        <section className="rounded-2xl border border-[#E7E5E4] bg-[#F3EFEA]/80 p-5 text-[#1C1917] shadow-2xs">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0069FF] mb-3.5">
            {lang === "my" ? "ပို့ဆောင်ရေးနှင့် ငွေပေးချေမှု" : "Merchant Logistics & Settlement"}
          </p>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1C1917] font-sans">
                  {lang === "my" ? "ငွေပေးချေမှုနှင့် မိုဘိုင်းပိုက်ဆံအိတ်" : "Settlement & Mobile Pay"}
                </p>
                <p className="leading-relaxed text-[#57534E] font-sans mt-0.5">
                  {shop.paymentInfo ||
                    (lang === "my"
                      ? "KPay, WavePay မိုဘိုင်းငွေလွှဲနှင့် အိမ်ရောက်ငွေချေစနစ် (COD) ဖြင့် ဝယ်ယူနိုင်ပါသည်။"
                      : "KPay, WavePay mobile wallet transfers and Cash on Delivery (COD).")}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E7E5E4]/80 pt-3.5 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin size={12} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-[#1C1917] font-sans">
                  {lang === "my" ? "မြို့နယ်အလိုက် ပို့ဆောင်ခနှုန်းထားများ" : "Township Delivery Schedule"}
                </p>
                <p className="leading-relaxed text-[#57534E] font-sans mt-0.5">
                  {shop.deliveryZones && shop.deliveryZones.length > 0 
                    ? shop.deliveryZones.slice(0, 5).map(z => `${z.township_name || (z as any).township || "Yangon"}: ${(Number(z.rate) || 0).toLocaleString()} MMK`).join(" • ")
                    : shop.deliveryInfo ||
                      (lang === "my"
                        ? "ရန်ကုန်မြို့တွင်းနှင့် နယ်ဝေးမြို့များအတွက် မြို့နယ်အလိုက် ပို့ဆောင်ခ တွက်ချက်ပေးပါသည်။"
                        : "Calculated by township across Yangon and regional couriers.")}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export function ShopStorefront({ shop }: { shop: PublicShop }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const { lang, setLang } = useLanguage();

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#FAF8F5] text-[#1C1917] font-sans">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 p-3 lg:flex-row lg:p-5">
        {/* Desktop Sidebar */}
        <aside className="hidden w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-[#E7E5E4] bg-[#FFFFFF] shadow-xs lg:flex lg:h-full lg:w-[330px]">
          <ShopInfoPanel shop={shop} />
        </aside>

        {/* Chatbot Main Stage */}
        <main className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-[#E7E5E4] bg-[#FFFFFF] shadow-xs">
          <ShopChatbot
            shopId={shop.shopId}
            businessName={shop.businessName}
            phone={shop.phone}
            fullPage
            suggestedPrompts={buildPromptSuggestions(shop, lang)}
            products={shop.products || []}
            deliveryZones={shop.deliveryZones || []}
            onOpenInfo={() => setInfoOpen(true)}
            language={lang}
            onLanguageChange={setLang}
          />
        </main>
      </div>

      {/* Mobile Drawer */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close shop info"
            onClick={() => setInfoOpen(false)}
            className="absolute inset-0 bg-[#1C1917]/40 backdrop-blur-xs cursor-pointer"
          />
          <div className="absolute bottom-0 left-0 right-0 flex max-h-[88dvh] min-h-[60dvh] flex-col overflow-hidden rounded-t-3xl border-t border-[#E7E5E4] bg-[#FFFFFF] shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#E7E5E4] px-5 py-4 bg-[#FAF8F5]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0069FF]">
                  {lang === "my" ? "ဆိုင်အချက်အလက်" : "Shop Details"}
                </p>
                <p className="mt-0.5 font-serif text-lg text-[#1C1917]">
                  {shop.businessName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E7E5E4] bg-[#FFFFFF] text-[#57534E] flex items-center justify-center hover:bg-stone-50 cursor-pointer transition shadow-2xs"
              >
                <X size={15} />
              </button>
            </div>
            <ShopInfoPanel shop={shop} />
          </div>
        </div>
      )}
    </div>
  );
}