"use client";

import { useState, useEffect } from "react";
import { ShopStorefront, type PublicShop as PublicShopData } from "./ShopStorefront";
import { ErrorBoundary } from "./ErrorBoundary";
import { supabase } from "../utils/supabase";
import { Product, DeliveryZone } from "../types";
import { getState } from "../services/clientStore";


const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: "dz-1", township_name: "Kamayut", rate: 2000, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-2", township_name: "Bahan", rate: 2000, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-3", township_name: "Sanchaung", rate: 2000, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-4", township_name: "Hlaing", rate: 2500, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-5", township_name: "Yankin", rate: 2500, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-6", township_name: "Dagon", rate: 2500, estimated_transit_timeline: "1-2 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-7", township_name: "Mayangone", rate: 3000, estimated_transit_timeline: "2-3 Days", region: "Yangon", division: "Yangon" },
  { id: "dz-8", township_name: "Thanlyin", rate: 3500, estimated_transit_timeline: "2-3 Days", region: "Yangon", division: "Yangon" },
];

export function PublicShop({ shopId }: { shopId: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shop, setShop] = useState<PublicShopData | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchShop() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch shop record from Supabase
        const { data: shopRow, error: shopErr } = await supabase
          .from("shops")
          .select("id, owner_id, shop_id, shop_name, owner_name, phone, address, onboarding_profile")
          .eq("shop_id", shopId)
          .maybeSingle();

        if (!shopErr && shopRow) {
          const actualShopId = shopRow.shop_id || shopId;

          // 2. Fetch products strictly for this shop
          let productQuery = supabase
            .from("products")
            .select("id, name, category, price, description, stock, image, Varies");

          if (shopRow.owner_id) {
            productQuery = productQuery.or(`shop_id.eq.${actualShopId},owner_id.eq.${shopRow.owner_id}`);
          } else {
            productQuery = productQuery.eq("shop_id", actualShopId);
          }

          const { data: productRows } = await productQuery;

          let products: Product[] = (productRows || []).map((p) => ({
            id: p.id,
            name: p.name || "Product",
            category: p.category ?? "General",
            price: Math.max(0, Number(p.price) || 0),
            description: p.description ?? "",
            stock: Math.max(0, Number(p.stock) || 0),
            image: p.image ?? "",
            varies: Array.isArray(p.Varies) ? p.Varies : [],
          }));

          // 3. Fetch delivery zones strictly for this shop
          let zoneQuery = supabase
            .from("delivery_zones")
            .select("id, township_name, rate, estimated_transit_timeline, region, division");

          if (shopRow.owner_id) {
            zoneQuery = zoneQuery.or(`shop_id.eq.${actualShopId},owner_id.eq.${shopRow.owner_id}`);
          } else {
            zoneQuery = zoneQuery.eq("shop_id", actualShopId);
          }

          const { data: zoneRows } = await zoneQuery;

          let deliveryZones: DeliveryZone[] = (zoneRows || []).map((z: any) => ({
            id: z.id || `zone-${Math.random()}`,
            township_name: z.township_name || z.township || "Yangon",
            rate: Math.max(0, Number(z.rate) || 2000),
            estimated_transit_timeline: z.estimated_transit_timeline || "1-2 Days",
            region: z.region || "Yangon",
            division: z.division || "Yangon",
          }));

          if (deliveryZones.length === 0) {
            deliveryZones = DEFAULT_DELIVERY_ZONES;
          }

          const profile = (shopRow.onboarding_profile as Record<string, string> | null) || {};
          const businessName = shopRow.shop_name || "The Curated Atelier";
          const phone = shopRow.phone?.trim() || profile.phone?.trim() || "09971234567";
          const description = profile.business_goal || profile.business_category || "Curated artisanal goods and lifestyle creations.";
          const paymentInfo = profile.payment_method || "KPay / WavePay (09971234567) or Cash on Delivery (COD) across Yangon.";
          const deliveryInfo = profile.delivery_method || "Yangon Townships: 2,000 - 3,500 MMK (1-2 Days).";

          if (isMounted) {
            setShop({
              shopId: actualShopId,
              businessName,
              phone,
              description,
              paymentInfo,
              deliveryInfo,
              products,
              deliveryZones,
            });
            setError(null);
            setLoading(false);
          }
          return;
        }

        // 4. Fallback to local store or curated boutique demo if Supabase didn't have row
        const localState = getState();
        const hasLocalProducts = Array.isArray(localState.products) && localState.products.length > 0;
        const localProducts = hasLocalProducts ? localState.products : [];
        const localZones = (Array.isArray(localState.deliveryZones) && localState.deliveryZones.length > 0)
          ? localState.deliveryZones
          : DEFAULT_DELIVERY_ZONES;

        const businessName = localState.config.shopName?.trim() || "The Curated Atelier";
        const phone = localState.config.phone?.trim() || "09971234567";
        const description = "Artisanal lifestyle goods, hand-crafted ceramics, and organic botanicals. Bilingual automated assistant Candy.";
        const paymentInfo = "KPay / WavePay: 09971234567 (Account: Sales Brain Store) & Cash on Delivery (COD).";
        const deliveryInfo = "Yangon Townships: 2,000 - 3,500 MMK (1-2 Days). Regional express courier available.";

        if (isMounted) {
          setShop({
            shopId: shopId || localState.config.shopId || "curated-shop",
            businessName,
            phone,
            description,
            paymentInfo,
            deliveryInfo,
            products: localProducts,
            deliveryZones: localZones,
          });
          setError(null);
        }
      } catch (err: unknown) {
        console.warn("PublicShop fallback activated:", err);
        if (isMounted) {
          setShop({
            shopId: shopId || "demo-shop",
            businessName: "The Curated Atelier",
            phone: "09971234567",
            description: "Artisanal lifestyle goods and botanical creations.",
            paymentInfo: "Cash on Delivery (COD) & KPay / WavePay mobile transfer.",
            deliveryInfo: "Yangon Townships: 2,000 - 3,500 MMK (1-2 Days).",
            products: [],
            deliveryZones: DEFAULT_DELIVERY_ZONES,
          });
          setError(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchShop();

    return () => {
      isMounted = false;
    };
  }, [shopId]);

  if (loading) {
    return (
      <div className="h-[100dvh] bg-[#FAF8F5] flex items-center justify-center font-sans">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#E7E5E4] border-t-[#0069FF] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-serif tracking-[0.2em] text-[#78716C] uppercase">
            Entering Merchant Sanctuary...
          </p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="h-[100dvh] bg-[#FAF8F5] flex items-center justify-center font-sans p-4">
        <div className="bg-[#FFFFFF] p-8 sm:p-10 rounded-3xl border border-[#E7E5E4] shadow-xs max-w-md w-full text-center">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#0069FF] mb-2">
            Store Unavailable
          </span>
          <h2 className="text-2xl font-serif text-[#1C1917] mb-2">Shop Not Found</h2>
          <p className="text-sm text-[#57534E] mb-8 leading-relaxed">
            The shop link might be expired or incorrect. Please confirm with the merchant.
          </p>
          <a
            href="/"
            className="inline-block bg-[#0069FF] hover:bg-[#0052CC] text-white px-8 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition shadow-xs"
          >
            Go to Sales Brain AI
          </a>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Online Storefront Error">
      <ShopStorefront shop={shop} />
    </ErrorBoundary>
  );
}
