import { supabase } from "../utils/supabase";
import type { OnboardingFormState, OnboardingProfile, ShopRecord } from "../types";

export function shopRecordToFormData(shop: ShopRecord): OnboardingFormState {
  let p = shop.onboarding_profile;
  if (typeof p === "string") {
    try {
      p = JSON.parse(p);
    } catch {}
  }
  const businessCategory = p?.business_type ?? "";
  const sellingPlatform = p?.selling_platform ?? "";
  const botPersonality = p?.bot_personality ?? "Friendly";
  return {
    business_name: shop.shop_name ?? "",
    owner_name: shop.owner_name ?? "",
    business_category: businessCategory,
    mainly_sell: p?.mainly_sell ?? businessCategory,
    main_customer: p?.main_customer ?? "",
    age_group: p?.age_group ?? "",
    selling_platform: sellingPlatform,
    marketing_method: p?.marketing_method ?? sellingPlatform,
    weekly_order_volume: p?.weekly_order_volume ?? "",
    payment_method: p?.payment_method ?? "",
    delivery_method: p?.delivery_method ?? "",
    business_goal: p?.business_goal ?? "",
    bot_personality: botPersonality,
    matter_most: p?.matter_most ?? botPersonality,
    phone: shop.phone ?? p?.phone ?? "",
    business_address: shop.address ?? p?.business_address ?? "",
  };
}

export function emptyOnboardingForm(
  shopName = "",
  ownerName = ""
): OnboardingFormState {
  return {
    business_name: shopName,
    owner_name: ownerName,
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
  };
}

export type OnboardingFormPayload = {
  shopName: string;
  ownerName: string;
  businessCategory: string;
  sellingPlatform: string;
  weeklyOrderVolume: string;
  paymentMethod: string;
  deliveryMethod: string;
  businessGoal: string;
  botPersonality: string;
  shopId?: string;
  mainCustomer?: string;
  ageGroup?: string;
  matterMost?: string;
  marketingMethod?: string;
  mainlySell?: string;
  phone?: string;
  address?: string;
};

export function buildOnboardingProfile(
  form: OnboardingFormPayload,
  existing?: OnboardingProfile | null
): OnboardingProfile {
  const pick = (value: string | undefined, fallback: string) =>
    value !== undefined && value !== "" ? value : fallback;

  const businessType = pick(form.businessCategory, existing?.business_type ?? "");
  const sellingPlatform = pick(form.sellingPlatform, existing?.selling_platform ?? "");
  const botPersonality = pick(form.botPersonality, existing?.bot_personality ?? "Friendly");

  return {
    business_type: businessType,
    mainly_sell: pick(form.mainlySell, existing?.mainly_sell ?? businessType),
    main_customer: pick(form.mainCustomer, existing?.main_customer ?? ""),
    age_group: pick(form.ageGroup, existing?.age_group ?? ""),
    matter_most: pick(form.matterMost, existing?.matter_most ?? botPersonality),
    marketing_method: pick(form.marketingMethod, existing?.marketing_method ?? sellingPlatform),
    business_goal: pick(form.businessGoal, existing?.business_goal ?? ""),
    selling_platform: sellingPlatform,
    weekly_order_volume: pick(form.weeklyOrderVolume, existing?.weekly_order_volume ?? ""),
    payment_method: pick(form.paymentMethod, existing?.payment_method ?? ""),
    delivery_method: pick(form.deliveryMethod, existing?.delivery_method ?? ""),
    bot_personality: botPersonality,
    phone: pick(form.phone, existing?.phone ?? ""),
    business_address: pick(form.address, existing?.business_address ?? ""),
  };
}

export async function getShopForOwner(ownerId: string): Promise<ShopRecord | null> {
  const { data, error } = await supabase
    .from("shops")
    .select("id, owner_id, shop_id, shop_name, owner_name, phone, address, onboarding_completed, onboarding_profile")
    .eq("owner_id", ownerId)
    .order("onboarding_completed", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ShopRecord | null;
}

export async function saveShopOnboarding(
  ownerId: string,
  form: OnboardingFormPayload
): Promise<ShopRecord> {
  const existing = await getShopForOwner(ownerId);
  const profile = buildOnboardingProfile(form, existing?.onboarding_profile);
  const now = new Date().toISOString();

  const phone = (form.phone ?? profile.phone ?? "").trim();
  const address = (form.address ?? profile.business_address ?? "").trim();

  const row: any = {
    shop_name: form.shopName.trim(),
    owner_name: form.ownerName.trim() || null,
    phone: phone || null,
    address: address || null,
    onboarding_profile: profile,
    onboarding_completed: true,
    updated_at: now,
  };

  if (form.shopId) {
    row.shop_id = form.shopId;
  }

  const shopColumns =
    "id, owner_id, shop_id, shop_name, owner_name, phone, address, onboarding_completed, onboarding_profile";

  if (existing?.id) {
    const { data, error } = await supabase
      .from("shops")
      .update(row)
      .eq("id", existing.id)
      .select(shopColumns)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as ShopRecord;
    return { ...existing, ...row } as ShopRecord;
  }

  const { data, error } = await supabase
    .from("shops")
    .insert({ ...row, owner_id: ownerId })
    .select(shopColumns)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as ShopRecord;
  return { id: `shop-${Date.now()}`, owner_id: ownerId, ...row } as ShopRecord;
}

export async function setShopOnboardingCompleted(
  ownerId: string,
  completed: boolean
): Promise<void> {
  const existing = await getShopForOwner(ownerId);
  if (!existing?.id) return;

  const { error } = await supabase
    .from("shops")
    .update({
      onboarding_completed: completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) throw error;
}
