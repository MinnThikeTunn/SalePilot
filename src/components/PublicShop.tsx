"use client";

import { useState, useEffect } from "react";
import { ShopStorefront, type PublicShop as PublicShopData } from "./ShopStorefront";
import { ErrorBoundary } from "./ErrorBoundary";
import { supabase } from "../utils/supabase";
import { Product, DeliveryZone } from "../types";
import { getState } from "../services/clientStore";

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

          // 3. Fetch delivery zones strictly from user input (no hardcoding)
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
            township_name: z.township_name || z.township || "",
            rate: Math.max(0, Number(z.rate) || 0),
            estimated_transit_timeline: z.estimated_transit_timeline || "",
            region: z.region || "",
            division: z.division || "",
          }));

          if (deliveryZones.length === 0 && shopRow.owner_id) {
            try {
              const { data: stateBlob } = await supabase.storage
                .from("shop-states")
                .download(`${shopRow.owner_id}/state.json`);
              if (stateBlob) {
                const stateData = JSON.parse(await stateBlob.text());
                if (Array.isArray(stateData.deliveryZones) && stateData.deliveryZones.length > 0) {
                  deliveryZones = stateData.deliveryZones.map((z: any) => ({
                    id: z.id || `zone-${Math.random()}`,
                    township_name: z.township_name || z.township || "",
                    rate: Math.max(0, Number(z.rate) || 0),
                    estimated_transit_timeline: z.estimated_transit_timeline || "",
                    region: z.region || "",
                    division: z.division || "",
                  }));
                }
              }
            } catch (_) {}
          }

          if (deliveryZones.length === 0) {
            const localState = getState();
            if (Array.isArray(localState.deliveryZones) && localState.deliveryZones.length > 0) {
              deliveryZones = localState.deliveryZones.map((z: any) => ({
                id: z.id || `zone-${Math.random()}`,
                township_name: z.township_name || z.township || "",
                rate: Math.max(0, Number(z.rate) || 0),
                estimated_transit_timeline: z.estimated_transit_timeline || "",
                region: z.region || "",
                division: z.division || "",
              }));
            }
          }

          let profile: any = shopRow.onboarding_profile;
          if (typeof profile === "string") {
            try { profile = JSON.parse(profile); } catch { profile = {}; }
          }
          if (!profile || typeof profile !== "object") profile = {};

          const localState = getState();
          const localProfile: any = (localState as any).onboardingProfile || {};

          const businessName = shopRow.shop_name?.trim() || localState.config.shopName?.trim() || "Official Store";
          const ownerName = shopRow.owner_name?.trim() || localState.config.ownerName?.trim() || "";
          const phone = shopRow.phone?.trim() || profile.phone?.trim() || localState.config.phone?.trim() || localProfile.phone?.trim() || "";
          const address = shopRow.address?.trim() || profile.business_address?.trim() || localProfile.business_address?.trim() || "";
          const businessCategory = profile.business_category || profile.business_type || profile.mainly_sell || localProfile.business_category || localProfile.mainly_sell || "";
          const description = profile.business_goal || businessCategory || localProfile.business_goal || "";
          const paymentInfo = profile.payment_method || (shopRow as any).payment_method || localProfile.payment_method || "";
          const deliveryInfo = profile.delivery_method || (shopRow as any).delivery_method || localProfile.delivery_method || "";

          if (isMounted) {
            setShop({
              shopId: actualShopId,
              businessName,
              ownerName,
              phone,
              address,
              businessCategory,
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

        // 4. Fallback to local store (user input only, no hardcoded zones)
        const localState = getState();
        const hasLocalProducts = Array.isArray(localState.products) && localState.products.length > 0;
        const localProducts = hasLocalProducts ? localState.products : [];
        const localZones = Array.isArray(localState.deliveryZones) ? localState.deliveryZones : [];
        const localProfile: any = (localState as any).onboardingProfile || {};

        const businessName = localState.config.shopName?.trim() || "Official Store";
        const ownerName = localState.config.ownerName?.trim() || localProfile.owner_name?.trim() || "";
        const phone = localState.config.phone?.trim() || localProfile.phone?.trim() || "";
        const address = localProfile.business_address?.trim() || "";
        const businessCategory = localProfile.business_category || localProfile.mainly_sell || "";
        const description = localProfile.business_goal || businessCategory || "";
        const paymentInfo = localProfile.payment_method || "";
        const deliveryInfo = localProfile.delivery_method || "";

        if (isMounted) {
          setShop({
            shopId: shopId || localState.config.shopId || "store",
            businessName,
            ownerName,
            phone,
            address,
            businessCategory,
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
            businessName: "Official Store",
            phone: "",
            description: "",
            paymentInfo: "",
            deliveryInfo: "",
            products: [],
            deliveryZones: [],
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
            Connecting to Storefront...
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
