import type { Product, SystemState } from "../types";

export function getStrategyBriefing(state: SystemState, _lang?: string): string {
  return `Sales Brain AI Strategy Briefing

1. Peak Purchasing Activity
Based on active system sessions, customer inquiry rates peak dramatically between 6:00 PM and 9:30 PM (MSTM).
Action: Keep the automated Sales Assistant active with instant invoice delivery during these hours.

2. Hot Campaign Suggestions
Bundle ${state.products[0]?.name ?? "top products"} with township delivery promos to lift average order value.
Weekend prepay rebate of 5% on orders over 25,000 MMK via KPay.

3. Inventory Alerts
${state.products.find((p) => p.stock <= 5)?.name ?? "Check catalog"} may need restock soon.
Action: Re-order from suppliers before peak season.

4. Settlement Optimization
Promote KPay prepayment at checkout for faster owner verification.`;
}

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
    underperformingProducts: state.products.filter((p) => !selected.find((s) => s.id === p.id)).slice(0, 1).map((p) => p.name),
    lowStockAlerts: state.products.filter((p) => p.stock < 10).map((p) => `${p.name}: ${p.stock} units left`),
    analyticsSummary: {
      salesGrowthEstimate: `Estimated uplift for ${campaignType} campaign`,
      engagementLevel: "Strong evening Telegram & online store peaks",
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
        en: `Celebrate ${campaignType} with ${names}! Order via Telegram or phone. KPay prepay for fastest confirmation. Free delivery promos in select Yangon townships.`,
        my: `Celebrate ${campaignType} with ${names}! Order via Telegram or phone. KPay prepay for fastest confirmation. Free delivery promos in select Yangon townships.`,
      },
      instagramCaption: {
        en: `${campaignType} deals live now. Tap to order! #MyanmarSME #KPay`,
        my: `${campaignType} deals live now. Tap to order! #MyanmarSME #KPay`,
      },
      adCopy: {
        en: `Limited ${campaignType} offer on ${names}. Order today!`,
        my: `Limited ${campaignType} offer on ${names}. Order today!`,
      },
      email: {
        en: `Subject: ${campaignType} promotion\n\nDear customer,\n\nShop ${names} with exclusive bundle savings this week.`,
        my: `Subject: ${campaignType} promotion\n\nDear customer,\n\nShop ${names} with exclusive bundle savings this week.`,
      },
      hashtags: `#${campaignType} #MyanmarSME #KPay #TelegramShop`,
    },
    bannerPrompt: `Professional Myanmar SME marketing poster for ${campaignType}, featuring ${names}, portrait 3:4, warm lighting, modern typography`,
  };
}

export function getMarketingImageUrl(campaignType: string): string {
  return "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800";
}
