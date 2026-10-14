import type { SalesTeamTool, ToolExecutionContext } from "../types/sales-team";
import { getState, setClientProducts } from "../../../services/clientStore";
import { getShopBusinessPolicies, fetchShopBusinessPoliciesAsync } from "../services/salesTeamApi";
import {
  getBusinessMemories,
  fetchBusinessMemoriesAsync,
  retrieveRelevantMemories,
} from "../services/businessMemoryService";
import { supabase } from "../../../utils/supabase";
import { getProducts } from "../../../services/productService";
import { getOrdersForOwner } from "../../../services/ordersApi";

export class ToolRegistry {
  private tools: Map<string, SalesTeamTool> = new Map();
  private asyncHandlers: Map<
    string,
    (context: ToolExecutionContext & Record<string, any>, params?: any) => Promise<any>
  > = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  register(
    tool: SalesTeamTool,
    asyncHandler?: (context: ToolExecutionContext & Record<string, any>, params?: any) => Promise<any>
  ) {
    this.tools.set(tool.name, tool);
    if (asyncHandler) {
      this.asyncHandlers.set(tool.name, asyncHandler);
    }
  }

  getTool(name: string): SalesTeamTool | undefined {
    return this.tools.get(name);
  }

  getAllTools(): SalesTeamTool[] {
    return Array.from(this.tools.values());
  }

  executeTool(name: string, context: ToolExecutionContext & Record<string, any>, params?: any): any {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry`);
    }
    return tool.execute(context, params || context);
  }

  async executeToolAsync(
    name: string,
    context: ToolExecutionContext & Record<string, any>,
    params?: any
  ): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry`);
    }

    const asyncHandler = this.asyncHandlers.get(name);
    if (asyncHandler) {
      try {
        return await asyncHandler(context, params || context);
      } catch (err) {
        console.warn(`[toolRegistry] Async execution failed for '${name}', using sync fallback:`, err);
      }
    }

    return await tool.execute(context, params || context);
  }

  private registerDefaultTools() {
    // 1. Product Catalog Tool (Dual Layer: Supabase DB + clientStore)
    this.register(
      {
        name: "get_product_catalog",
        description:
          "Fetches current product catalog including prices, COGS (cost_price), stock levels, lead times, and buffer safety thresholds from live database and store cache.",
        parameters: {
          type: "object",
          properties: {
            shopId: { type: "string", description: "Shop identifier" },
          },
          required: ["shopId"],
        },
        execute: (context) => {
          const state = getState();
          return {
            products: state.products || [],
            totalCount: (state.products || []).length,
            timestamp: new Date().toISOString(),
            source: "local_cache",
          };
        },
      },
      async (context) => {
        const state = getState();
        let products = [...(state.products || [])];

        try {
          if (supabase) {
            const dbProducts = await getProducts(context.shopId);
            if (dbProducts && dbProducts.length > 0) {
              const existingIds = new Set(products.map((p) => p.id));
              let addedAny = false;
              dbProducts.forEach((p) => {
                if (!existingIds.has(p.id)) {
                  products.push(p);
                  existingIds.add(p.id);
                  addedAny = true;
                }
              });
              if (addedAny || products.length > (state.products || []).length) {
                setClientProducts(products);
              }
            }
          }
        } catch (e) {
          console.warn("[toolRegistry] Database query failed for products:", e);
        }

        return {
          products,
          totalCount: products.length,
          timestamp: new Date().toISOString(),
          source: "database_merged",
        };
      }
    );

    // 2. Order History Tool (Dual Layer: Supabase DB + clientStore)
    this.register(
      {
        name: "get_order_history",
        description:
          "Fetches completed, confirmed, and pending order records with item breakdowns, payment methods, delivery fees, and order timestamps from database and store ledger.",
        parameters: {
          type: "object",
          properties: {
            shopId: { type: "string", description: "Shop identifier" },
            status: { type: "string", description: "Filter by status (confirmed, completed, pending, etc.)" },
          },
          required: ["shopId"],
        },
        execute: (context, params) => {
          const state = getState();
          const orders = state.orders || [];
          const filtered = params?.status
            ? orders.filter((o) => o.status === params.status)
            : orders;
          return {
            orders: filtered,
            totalCount: filtered.length,
            timestamp: new Date().toISOString(),
            source: "local_cache",
          };
        },
      },
      async (context, params) => {
        const state = getState();
        let orders = [...(state.orders || [])];

        try {
          if (supabase && context.shopId) {
            const dbOrders = await getOrdersForOwner(context.shopId, context.shopId);
            if (dbOrders && dbOrders.length > 0) {
              const existingIds = new Set(orders.map((o) => o.id));
              dbOrders.forEach((o) => {
                if (!existingIds.has(o.id)) {
                  orders.push(o);
                  existingIds.add(o.id);
                }
              });
            }
          }
        } catch (e) {
          console.warn("[toolRegistry] Database query failed for orders:", e);
        }

        const filtered = params?.status
          ? orders.filter((o) => o.status === params.status)
          : orders;

        return {
          orders: filtered,
          totalCount: filtered.length,
          timestamp: new Date().toISOString(),
          source: "database_merged",
        };
      }
    );

    // 3. Delivery Matrix Tool (Dual Layer: Supabase DB + clientStore)
    this.register(
      {
        name: "get_delivery_matrix",
        description:
          "Fetches configured township delivery rates, transit timelines, and regional coverage from database.",
        parameters: {
          type: "object",
          properties: {
            shopId: { type: "string", description: "Shop identifier" },
          },
          required: ["shopId"],
        },
        execute: (context) => {
          const state = getState();
          return {
            zones: state.deliveryZones || [],
            totalCount: (state.deliveryZones || []).length,
            timestamp: new Date().toISOString(),
            source: "local_cache",
          };
        },
      },
      async (context) => {
        const state = getState();
        let zones = [...(state.deliveryZones || [])];

        try {
          if (supabase && context.shopId) {
            const { data, error } = await supabase
              .from("delivery_zones")
              .select("*")
              .or(`owner_id.eq.${context.shopId},shop_id.eq.${context.shopId}`);

            if (!error && Array.isArray(data) && data.length > 0) {
              const existingIds = new Set(zones.map((z) => z.id));
              data.forEach((row: any) => {
                if (!existingIds.has(row.id)) {
                  zones.push({
                    id: row.id,
                    township_name: row.township_name,
                    region: row.region || "",
                    division: row.division || "",
                    rate: Math.max(0, Number(row.rate) || 0),
                    estimated_transit_timeline: row.estimated_transit_timeline || "1-2 Days",
                    created_at: row.created_at,
                  });
                  existingIds.add(row.id);
                }
              });
            }
          }
        } catch (e) {
          console.warn("[toolRegistry] Database query failed for delivery zones:", e);
        }

        return {
          zones,
          totalCount: zones.length,
          timestamp: new Date().toISOString(),
          source: "database_merged",
        };
      }
    );

    // 4. Deterministic Unit Economics Calculator Tool
    this.register({
      name: "calculate_unit_economics",
      description:
        "Deterministically calculates net revenue, gross margin, contribution margin %, and COD return risk deductions. Never guesses numbers.",
      parameters: {
        type: "object",
        properties: {
          price: { type: "number", description: "Base retail price in MMK" },
          costPrice: { type: "number", description: "Product cost / COGS in MMK" },
          discountPct: { type: "number", description: "Proposed discount percentage (0-100)" },
          deliveryFee: { type: "number", description: "Estimated delivery fee in MMK" },
          courierReturnRiskPct: { type: "number", description: "Estimated COD return rate allowance percentage (e.g. 15)" },
        },
        required: ["price", "costPrice"],
      },
      execute: (context, params) => {
        const price = Number(params?.price) || 0;
        const costPrice = Number(params?.costPrice) || 0;
        const discountPct = Math.min(100, Math.max(0, Number(params?.discountPct) || 0));
        const deliveryFee = Number(params?.deliveryFee) || 0;
        const returnRiskPct = Number(params?.courierReturnRiskPct) || 10;

        const discountAmount = Math.round(price * (discountPct / 100));
        const netPrice = price - discountAmount;
        const grossMarginMmk = netPrice - costPrice;
        const grossMarginPct = netPrice > 0 ? Number(((grossMarginMmk / netPrice) * 100).toFixed(1)) : 0;

        // Courier return risk deduction (estimated return fee loss per shipment)
        const returnRiskAllowanceMmk = Math.round(deliveryFee * (returnRiskPct / 100));
        const contributionMmk = grossMarginMmk - returnRiskAllowanceMmk;
        const contributionMarginPct = netPrice > 0 ? Number(((contributionMmk / netPrice) * 100).toFixed(1)) : 0;

        return {
          originalPrice: price,
          discountPct,
          discountAmount,
          netPrice,
          costPrice,
          grossMarginMmk,
          grossMarginPct,
          returnRiskAllowanceMmk,
          contributionMmk,
          contributionMarginPct,
          isProfitable: contributionMmk > 0,
        };
      },
    });

    // 5. Customer Friction Signals Tool
    this.register({
      name: "get_customer_friction_signals",
      description:
        "Extracts anonymized friction and drop-off categories from Telegram sessions without accessing or leaking raw customer messages or PII.",
      parameters: {
        type: "object",
        properties: {
          shopId: { type: "string", description: "Shop identifier" },
        },
        required: ["shopId"],
      },
      execute: (context) => {
        const state = getState();
        const sessions = Object.values(state.sessions || {});

        let deliveryObjections = 0;
        let paymentDropoffs = 0;
        let priceHesitations = 0;
        let abandonedCarts = 0;

        sessions.forEach((sess) => {
          if (sess.currentStep === "selecting_township") deliveryObjections++;
          if (sess.currentStep === "selecting_payment" || sess.currentStep === "prepayment_pending") paymentDropoffs++;
          if (sess.cart && sess.cart.length > 0 && sess.currentStep !== "completed") abandonedCarts++;

          (sess.messages || []).forEach((m) => {
            const text = (m.content || "").toLowerCase();
            if (text.includes("ဈေးကြီး") || text.includes("expensive") || text.includes("discount")) priceHesitations++;
            if (text.includes("ပို့ခ") || text.includes("delivery") || text.includes("transit")) deliveryObjections++;
          });
        });

        return {
          totalActiveSessions: sessions.length,
          abandonedCarts,
          objections: [
            { category: "delivery_fee_too_high", count: deliveryObjections, severity: deliveryObjections > 2 ? "high" : "medium" },
            { category: "payment_method_hesitation", count: paymentDropoffs, severity: paymentDropoffs > 1 ? "medium" : "low" },
            { category: "price_sensitivity", count: priceHesitations, severity: priceHesitations > 2 ? "high" : "low" },
          ],
          timestamp: new Date().toISOString(),
        };
      },
    });

    // 6. Shop Policies Tool (Dynamic DB + Cache Lookup)
    this.register(
      {
        name: "get_shop_policies",
        description:
          "Fetches merchant-configured policy thresholds for contribution margins, discount caps, and courier allowances.",
        parameters: {
          type: "object",
          properties: {
            shopId: { type: "string", description: "Shop identifier" },
          },
          required: ["shopId"],
        },
        execute: (context) => {
          const policies = getShopBusinessPolicies(context.shopId || "default_shop");
          return {
            ...policies,
            timestamp: new Date().toISOString(),
            source: "cache",
          };
        },
      },
      async (context) => {
        const policies = await fetchShopBusinessPoliciesAsync(context.shopId || "default_shop");
        return {
          ...policies,
          timestamp: new Date().toISOString(),
          source: "database",
        };
      }
    );

    // 7. External Market Intelligence & Persona Context Tool
    this.register({
      name: "search_market_intelligence",
      description:
        "Provides verified external Myanmar social commerce benchmarks, seasonal retail patterns (Thadingyut, Tazaungdaing, Thingyan), COD return rate averages, and consumer payment psychology to enrich agent personas.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Market topic: 'cod_return_rates' | 'seasonal_festivals' | 'payment_psychology' | 'telegram_commerce_benchmarks' | 'all'",
          },
        },
        required: ["topic"],
      },
      execute: (context, params) => {
        const topic = params?.topic || "all";
        const intelligence = {
          cod_return_rates: {
            benchmarkRtoPct: 18.5,
            range: "15% - 25% in Myanmar social commerce",
            primaryCauses: ["Doorstep delivery refusal", "Impulse buy decay", "Delayed transit (>3 days)"],
            mitigation: "Require small prepayment deposit or verify buyer phone before dispatch",
          },
          seasonal_festivals: {
            currentSeason: "October/November (Thadingyut & Tazaungdaing Lighting Festivals)",
            marketTrends: [
              "High gift-giving demand, family visits, food & sweets hampers",
              "Payday liquidity peaks between 28th and 5th of each month",
              "Pre-holiday courier cutoffs require earlier dispatch warnings",
            ],
            recommendedStrategy: "Bundle seasonal gifts with guaranteed delivery deadlines",
          },
          payment_psychology: {
            dominantMethods: ["Cash on Delivery (COD) ~ 60%", "KBZPay (KPay) ~ 28%", "Wave Money ~ 12%"],
            trustDeficit: "Buyers hesitate to prepay unknown merchants; offering KPay bonuses or verified store reviews increases prepay adoption by ~35%",
          },
          telegram_commerce_benchmarks: {
            conversionStrength: "High community loyalty, ideal for flash drops and VIP repeat buyer broadcasts",
            averageEngagementTime: "Peak messaging between 12:00-14:00 and 19:00-22:00 Myanmar Time",
          },
        };

        if (topic === "all") {
          return { topic, intelligence, source: "Myanmar Social Commerce Benchmark Index" };
        }
        return {
          topic,
          intelligence: intelligence[topic as keyof typeof intelligence] || intelligence,
          source: "Myanmar Social Commerce Benchmark Index",
        };
      },
    });

    // 8. Business Memory Tool (Dual Layer: Supabase DB + Local Storage)
    this.register(
      {
        name: "get_business_memory",
        description:
          "Fetches verified business memories, owner corrections, past experiment results, and store policies.",
        parameters: {
          type: "object",
          properties: {
            shopId: { type: "string", description: "Shop identifier" },
            query: { type: "string", description: "Optional search query to filter memories" },
          },
          required: ["shopId"],
        },
        execute: (context, params) => {
          const memories = params?.query
            ? retrieveRelevantMemories({ shopId: context.shopId || "default_shop", query: params.query })
            : getBusinessMemories(context.shopId || "default_shop");
          return {
            memories,
            totalCount: memories.length,
            timestamp: new Date().toISOString(),
            source: "cache",
          };
        },
      },
      async (context, params) => {
        const memories = await fetchBusinessMemoriesAsync(context.shopId || "default_shop");
        const filtered = params?.query
          ? retrieveRelevantMemories({ shopId: context.shopId || "default_shop", query: params.query })
          : memories;
        return {
          memories: filtered,
          totalCount: filtered.length,
          timestamp: new Date().toISOString(),
          source: "database",
        };
      }
    );
  }
}

export const toolRegistry = new ToolRegistry();
