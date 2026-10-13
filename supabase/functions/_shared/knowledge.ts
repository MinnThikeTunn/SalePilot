import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { embedText } from "./gemini.ts";
import type { SystemState } from "./types.ts";
import type { ShopContext } from "./context.ts";

interface KnowledgeDocument {
  sourceId: string;
  sourceType: "shop_overview" | "payment_delivery" | "faq_policies" | "product";
  title: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface RetrievedKnowledgeDocument {
  source_id: string;
  source_type: string;
  title: string;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

const MAX_DOC_CONTEXT_CHARS = 1200;
const MAX_TOTAL_CONTEXT_CHARS = 5000;
const MAX_RPC_MATCH_COUNT = 8;

export async function buildKnowledgeDocuments(ctx: ShopContext): Promise<KnowledgeDocument[]> {
  const { state, userId } = ctx;
  const { config, products, deliveryZones } = state;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Fetch detailed onboarding data
  const { data: onboarding } = await supabase
    .from("business_onboarding")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const docs: KnowledgeDocument[] = [
    {
      sourceId: config.shopId || "main",
      sourceType: "shop_overview",
      title: `${config.shopName} business profile`,
      content: [
        `Business name: ${config.shopName}`,
        `Industry: ${onboarding?.business_category || "Retail"}`,
        `Selling on: ${onboarding?.selling_platform || "Multiple Channels"}`,
        `Business Goal: ${onboarding?.business_goal || "Customer Satisfaction"}`,
        `Bot Personality: ${onboarding?.bot_personality || "Friendly"}`,
      ].join("\n"),
      metadata: {
        shopName: config.shopName,
      },
    },
    {
      sourceId: `${config.shopId || "main"}:operations`,
      sourceType: "payment_delivery",
      title: `${config.shopName} operations and policies`,
      content: [
        `Payment Instructions: ${onboarding?.payment_method || "Contact us for payment details."}`,
        `Delivery Policy: ${onboarding?.delivery_method || "Standard shipping applied."}`,
        `Delivery Zones and Rates:\n${deliveryZones.map(z => `- ${z.township}: ${z.rate} MMK (${z.deliveryTime})`).join("\n")}`,
      ].join("\n"),
      metadata: {
        deliveryZoneCount: deliveryZones.length,
      },
    },
  ];

  for (const product of products) {
    docs.push({
      sourceId: product.id,
      sourceType: "product",
      title: product.name,
      content: [
        `Product name: ${product.name}`,
        `Price: ${product.price.toLocaleString()} MMK`,
        `Stock: ${product.stock}`,
        `Category: ${product.category}`,
        product.description ? `Description: ${product.description}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      metadata: {
        productId: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock,
      },
    });
  }

  return docs;
}

export async function syncShopKnowledge(ctx: ShopContext) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const docs = await buildKnowledgeDocuments(ctx);
  
  const rows = await Promise.all(
    docs.map(async (doc) => ({
      user_id: ctx.userId,
      shop_id: ctx.state.config.shopId || "main",
      source_id: doc.sourceId,
      source_type: doc.sourceType,
      title: doc.title,
      content: doc.content,
      metadata: doc.metadata,
      embedding: await embedText(doc.content),
    }))
  );

  // Clear old docs for this user
  const { error: deleteError } = await supabase
    .from("shop_knowledge_documents")
    .delete()
    .eq("user_id", ctx.userId);

  if (deleteError) {
    throw new Error(`Failed to clear knowledge documents: ${deleteError.message}`);
  }

  if (!rows.length) return;

  const { error: insertError } = await supabase
    .from("shop_knowledge_documents")
    .insert(rows);

  if (insertError) {
    throw new Error(`Failed to insert knowledge documents: ${insertError.message}`);
  }

  return { success: true, count: rows.length };
}

export async function retrieveRelevantKnowledge(
  ctx: ShopContext,
  query: string,
  matchCount = 5
): Promise<RetrievedKnowledgeDocument[]> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const queryEmbedding = await embedText(query || "shop customer request");

  const { data, error } = await supabase.rpc(
    "match_shop_knowledge",
    {
      user_id_input: ctx.userId,
      query_embedding: queryEmbedding,
      match_count: Math.min(Math.max(matchCount, 1), MAX_RPC_MATCH_COUNT),
    }
  );

  if (error) {
    throw new Error(`Knowledge retrieval failed: ${error.message}`);
  }

  return data as RetrievedKnowledgeDocument[];
}

export function buildRetrievedContext(docs: RetrievedKnowledgeDocument[]): string {
  if (!docs.length) {
    return "No specific business context found for this query.";
  }

  return docs
    .map(
      (doc, index) =>
        `Context ${index + 1} (${doc.source_type}):\n${doc.content}`
    )
    .join("\n\n");
}
