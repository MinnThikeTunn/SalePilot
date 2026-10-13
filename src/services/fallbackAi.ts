import type { SystemState } from "../types";
import type { CopyHints } from "./campaignEngine";

export function getStrategyBriefing(state: SystemState, _lang?: string): string {
  const lowStock = state.products.find((p) => p.stock <= 5);
  return `Sales Brain AI Strategy Briefing

1. Peak Purchasing Activity
Customer inquiry rates peak between 6:00 PM and 9:30 PM (MMT).
Action: Keep the automated Sales Assistant active with instant invoice delivery during these hours.

2. Hot Campaign Suggestions
Bundle ${state.products[0]?.name ?? "top products"} with township delivery promos to lift average order value.
Weekend prepay rebate of 5% on orders over 25,000 MMK via KPay.

3. Inventory Alerts
${lowStock?.name ?? "All products"} ${lowStock ? `has only ${lowStock.stock} units left — restock before your next campaign.` : "stock levels look healthy."}

4. Settlement Optimization
Promote KPay prepayment at checkout for faster owner verification.`;
}

// ---------------------------------------------------------------------------
// Burmese-first copy generator
// Constrained by hints produced by campaignEngine.buildCopyHints().
// Never promises a discount or free delivery that wasn't in the approved hints.
// ---------------------------------------------------------------------------

export function generateBilingual(hints: CopyHints): {
  facebookEn: string;
  facebookMy: string;
  instagramEn: string;
  instagramMy: string;
  adEn: string;
  adMy: string;
  emailEn: string;
  emailMy: string;
  hashtags: string;
  variantAEn: string;
  variantBEn: string;
  variantAMy: string;
  variantBMy: string;
} {
  const { productNames, priceRange, discountLine, deliveryLine, campaignTheme, botUsername } = hints;

  // ── English copy ──────────────────────────────────────────────────────────
  const facebookEn =
    `${campaignTheme} Special is here!\n\n` +
    `Shop ${productNames} — ${priceRange}.\n` +
    `${discountLine}. ${deliveryLine}.\n\n` +
    `Order now via @${botUsername} on Telegram or send us a message.\n` +
    `KPay & WavePay accepted for instant confirmation.`;

  const instagramEn =
    `${campaignTheme} deals are LIVE now.\n` +
    `${productNames} | ${priceRange}\n` +
    `${discountLine}.\n` +
    `DM us or tap the Telegram bot link in bio.`;

  const adEn =
    `Limited ${campaignTheme} offer: ${productNames} at ${priceRange}. ` +
    `${discountLine}. Order on Telegram @${botUsername} today.`;

  const emailEn =
    `Subject: ${campaignTheme} Exclusive — ${productNames}\n\n` +
    `Dear valued customer,\n\n` +
    `We are excited to bring you our ${campaignTheme} campaign.\n\n` +
    `Featured: ${productNames}\nPrice: ${priceRange}\nOffer: ${discountLine}\n${deliveryLine}.\n\n` +
    `Order directly via Telegram: @${botUsername}\n\n` +
    `Thank you for supporting our business.\nBest regards,\nYour Shop Team`;

  // Variant A — benefit-first, direct
  const variantAEn =
    `${discountLine} on ${productNames} this ${campaignTheme}! ` +
    `Order via @${botUsername}. ${deliveryLine}.`;

  // Variant B — curiosity-first, softer
  const variantBEn =
    `Looking for the perfect ${campaignTheme} treat? ` +
    `${productNames} (${priceRange}) — ${discountLine}. ` +
    `DM us on Telegram @${botUsername} to order now.`;

  // ── Burmese copy (natural phrasing, not word-for-word translation) ─────────
  // NOTE: These are template strings. Unicode is written directly in source.
  // Never send these through PowerShell — use file I/O only.
  const facebookMy =
    `${campaignTheme} အထူးပရိုမိုးရှင်း ရောက်ရှိပြီ!\n\n` +
    `${productNames} — ${priceRange} ဖြင့် ၀ယ်ယူနိုင်သည်။\n` +
    `${discountLine}. ${deliveryLine}.\n\n` +
    `Telegram @${botUsername} မှ ယခုပင် မှာယူပါ။\n` +
    `KPay / WavePay ဖြင့် ချက်ချင်း အတည်ပြုနိုင်သည်။`;

  const instagramMy =
    `${campaignTheme} offer ယခုစတင်ပြီ!\n` +
    `${productNames} | ${priceRange}\n` +
    `${discountLine}.\n` +
    `Bio link မှ Telegram bot ကို နှိပ်ပြီး မှာယူပါ။`;

  const adMy =
    `${campaignTheme} အဆင်သင့် — ${productNames} ${priceRange}. ` +
    `${discountLine}. Telegram @${botUsername} မှ မှာယူပါ။`;

  const emailMy =
    `Subject: ${campaignTheme} အထူးပရိုမိုး — ${productNames}\n\n` +
    `ဖောက်သည် မင်းကြီးသို့\n\n` +
    `${campaignTheme} ပရိုမိုးရှင်းကို ကျွန်ုပ်တို့ ဖော်ပြလျက်ရှိပါသည်။\n\n` +
    `ကုန်ပစ္စည်း: ${productNames}\nစျေးနှုန်း: ${priceRange}\nပရိုမိုး: ${discountLine}\n${deliveryLine}.\n\n` +
    `Telegram မှ မှာယူရန်: @${botUsername}\n\n` +
    `ကျေးဇူးတင်ပါသည်။`;

  const variantAMy =
    `${discountLine} — ${productNames} ${campaignTheme} အဆိုက်မှတ်ပြီ! ` +
    `Telegram @${botUsername} မှ မှာယူပါ။ ${deliveryLine}.`;

  const variantBMy =
    `${campaignTheme} ဆောင်ရွေးမှုများ ရှာနေပါသလား? ` +
    `${productNames} (${priceRange}) — ${discountLine}. ` +
    `Telegram @${botUsername} မှ ဆက်သွယ်ပါ။`;

  const hashtags =
    `#${campaignTheme.replace(/\s+/g, "")} #MyanmarSME #KPay #TelegramShop #မြန်မာကုန်သွယ်`;

  return {
    facebookEn,
    facebookMy,
    instagramEn,
    instagramMy,
    adEn,
    adMy,
    emailEn,
    emailMy,
    variantAEn,
    variantBEn,
    variantAMy,
    variantBMy,
    hashtags,
  };
}

// ---------------------------------------------------------------------------
// Legacy adapter — keeps getMarketingInsights working for existing callers
// ---------------------------------------------------------------------------
export function getMarketingInsights(
  state: SystemState,
  campaignType: string,
  productIds: string[]
) {
  const selected =
    productIds.length > 0
      ? state.products.filter((p) => productIds.includes(p.id))
      : state.products.slice(0, 2);
  const names = selected.map((p) => p.name).join(", ") || "your catalog highlights";

  return {
    trendingProducts: selected.map((p) => p.name),
    underperformingProducts: state.products
      .filter((p) => !selected.find((s) => s.id === p.id))
      .slice(0, 1)
      .map((p) => p.name),
    lowStockAlerts: state.products
      .filter((p) => p.stock < 10)
      .map((p) => `${p.name}: ${p.stock} units left`),
    analyticsSummary: {
      salesGrowthEstimate: `Estimated uplift for ${campaignType} campaign`,
      engagementLevel: "Strong evening Telegram & online store peaks",
      bestSellingCategory: selected[0]?.category ?? "General",
    },
    recommendations: [
      {
        campaignTitle: `${campaignType} Spotlight — ${names}`,
        rationale: `Promote ${names} with localized KPay-first checkout and township delivery clarity.`,
        targetAudience: "Myanmar SME shoppers on Facebook & Telegram",
        discountPercentage: "10% bundle discount",
        duration: "7 days",
        expectedImpact: "Higher conversion on featured SKUs",
        implementationSteps: [
          "Pin featured products in catalog",
          "Post bilingual caption on Facebook",
          "Enable bot auto-reply with payment options",
          "Track verifying orders in SME Hub",
        ],
      },
    ],
    copywriting: {
      facebookCaption: {
        en: `Celebrate ${campaignType} with ${names}! Order via Telegram or phone. KPay prepay for fastest confirmation. Delivery fees apply per township rate.`,
        my: `${campaignType} ပရိုမိုးဖြင့် ${names} ၀ယ်ယူပါ! Telegram မှ မှာ၍ KPay ဖြင့် ချက်ချင်း အတည်ပြုနိုင်သည်။`,
      },
      instagramCaption: {
        en: `${campaignType} deals live now. Tap to order! #MyanmarSME #KPay`,
        my: `${campaignType} offer ယခုစတင်သည်! မှာယူရန် Telegram ကို နှိပ်ပါ။ #MyanmarSME`,
      },
      adCopy: {
        en: `Limited ${campaignType} offer on ${names}. Order today!`,
        my: `${campaignType} အထူးပရိုမိုး — ${names}. ယခုပင် မှာယူပါ!`,
      },
      email: {
        en: `Subject: ${campaignType} promotion\n\nDear customer,\n\nShop ${names} with exclusive bundle savings this week.`,
        my: `Subject: ${campaignType} ပရိုမိုး\n\nဖောက်သည် မင်းကြီးသို့,\n\n${names} ကို ဤအပတ်တွင် အထူးလျှော့စျေးဖြင့် ၀ယ်ယူပါ။`,
      },
      hashtags: `#${campaignType} #MyanmarSME #KPay #TelegramShop #မြန်မာကုန်သွယ်`,
    },
    bannerPrompt: `Professional Myanmar SME marketing poster for ${campaignType}, featuring ${names}, portrait 3:4, warm lighting, modern typography`,
  };
}

export function getMarketingImageUrl(_campaignType: string): string {
  return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800";
}

