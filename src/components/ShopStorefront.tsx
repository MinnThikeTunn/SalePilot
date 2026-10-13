"use client";

import { useState } from "react";
import { ShopChatbot } from "./ShopChatbot";
import { Product, DeliveryZone } from "../types";
import { CreditCard, MapPin, X, Phone } from "lucide-react";

export interface PublicShop {
  shopId: string;
  businessName: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  businessCategory?: string;
  description: string | null;
  paymentInfo: string;
  deliveryInfo: string;
  products: Product[];
  deliveryZones: DeliveryZone[];
}

function buildPromptSuggestions(shop: PublicShop) {
  const product = shop.products?.[0]?.name;

  return [
    "What products are featured today?",
    product ? `Tell me more about ${product}` : "Recommend a product for me",
    "Delivery townships and fees in Yangon",
    "How can I pay via KPay or WavePay?",
  ];
}

function ShopInfoPanel({ shop }: { shop: PublicShop }) {
  const [activeTab, setActiveTab] = useState<"catalog" | "logistics">("catalog");
  const products = shop.products || [];

  return (
    <div className="flex h-full flex-col min-h-0 bg-[#FFFFFF]">
      {/* Header */}
      <div className="shrink-0 border-b border-[#E7E5E4] px-6 py-5 bg-[#FAF8F5]">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#0069FF]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0069FF]">
            Artisanal Social Commerce
          </p>
        </div>
        <h1 className="mt-2 text-2xl font-serif font-normal text-[#1C1917] tracking-tight">
          {shop.businessName || "Online Store"}
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-[#57534E]">
          {shop.description || "Ask Candy anything about catalog items, township delivery fees, or mobile payment."}
        </p>

        {/* Tab switchers to prevent logistics info from getting buried under 10+ items */}
        <div className="mt-4 flex rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("catalog")}
            className={`flex-1 rounded-lg py-2 font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "catalog"
                ? "bg-[#1C1917] text-white shadow-2xs font-semibold"
                : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]"
            }`}
          >
            <span>Curated Catalog</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === "catalog" ? "bg-white/20 text-white" : "bg-[#FAF8F5] text-[#78716C]"
            }`}>
              {products.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("logistics")}
            className={`flex-1 rounded-lg py-2 font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "logistics"
                ? "bg-[#1C1917] text-white shadow-2xs font-semibold"
                : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#FAF8F5]"
            }`}
          >
            <CreditCard size={12} className={activeTab === "logistics" ? "text-white" : "text-[#78716C]"} />
            <span>Logistics & Pay</span>
          </button>
        </div>
      </div>

      {activeTab === "catalog" ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 no-scrollbar space-y-3.5">
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#78716C]">
              Curated Catalog
            </p>
            <span className="rounded-full bg-[#FAF8F5] border border-[#E7E5E4] px-2.5 py-0.5 text-xs font-mono font-medium text-[#57534E]">
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="space-y-2.5">
            {products.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E7E5E4] bg-[#FAF8F5] px-4 py-8 text-xs text-[#78716C] text-center">
                Catalog will appear here once published.
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-[#E7E5E4] bg-[#FFFFFF] p-3.5 hover:border-[#0069FF] transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-sans font-medium text-[#1C1917] tracking-tight">
                        {product.name}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#78716C]">
                        {product.description || "Ask Candy for item availability and details."}
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
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 no-scrollbar space-y-4">
          <section className="rounded-2xl border border-[#E7E5E4] bg-[#F3EFEA]/80 p-5 text-[#1C1917] shadow-2xs">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0069FF] mb-3.5">
              Merchant Logistics & Settlement
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CreditCard size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1C1917] font-sans">
                    Settlement & Mobile Pay
                  </p>
                  <p className="leading-relaxed text-[#57534E] font-sans mt-0.5">
                    {shop.paymentInfo || "Cash on Delivery (COD) and Mobile Prepayment (KPay / WavePay)."}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#E7E5E4]/80 pt-3.5 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#1C1917] font-sans">
                    Township Delivery Schedule
                  </p>
                  {shop.deliveryZones && shop.deliveryZones.length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                      {shop.deliveryZones.map((z) => (
                        <div
                          key={z.id || z.township_name}
                          className="flex items-center justify-between py-1 border-b border-[#E7E5E4]/40 last:border-0"
                        >
                          <span className="font-medium text-[#1C1917]">
                            {z.township_name || (z as any).township}
                          </span>
                          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E7E5E4] text-[#1C1917]">
                            {(Number(z.rate) || 0).toLocaleString()} MMK
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="leading-relaxed text-[#57534E] font-sans mt-0.5">
                      {shop.deliveryInfo || "Delivery details arranged upon order confirmation."}
                    </p>
                  )}
                </div>
              </div>

              {shop.phone && (
                <div className="border-t border-[#E7E5E4]/80 pt-3.5 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1C1917] font-sans">
                      Direct Contact / Hotline
                    </p>
                    <p className="leading-relaxed text-[#57534E] font-mono mt-0.5">
                      {shop.phone}
                    </p>
                  </div>
                </div>
              )}

              {shop.address && (
                <div className="border-t border-[#E7E5E4]/80 pt-3.5 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={12} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#1C1917] font-sans">
                      Boutique Location
                    </p>
                    <p className="leading-relaxed text-[#57534E] font-sans mt-0.5">
                      {shop.address}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export function ShopStorefront({ shop }: { shop: PublicShop }) {
  const [infoOpen, setInfoOpen] = useState(false);
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
            ownerName={shop.ownerName}
            phone={shop.phone}
            address={shop.address}
            businessCategory={shop.businessCategory}
            paymentInfo={shop.paymentInfo}
            deliveryInfo={shop.deliveryInfo}
            fullPage
            suggestedPrompts={buildPromptSuggestions(shop)}
            products={shop.products || []}
            deliveryZones={shop.deliveryZones || []}
            onOpenInfo={() => setInfoOpen(true)}
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
                  "Shop Details"
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