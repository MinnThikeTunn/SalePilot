import type { BusinessMemory } from "../types/sales-team";

const MEMORY_STORAGE_KEY = "sales_brain_memories_v1";

let inMemoryStorage: Record<string, BusinessMemory> = {};

function loadMemories(shopId: string): Record<string, BusinessMemory> {
  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(`${MEMORY_STORAGE_KEY}_${shopId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        inMemoryStorage = { ...inMemoryStorage, ...parsed };
      }
    } catch {
      // ignore
    }
  }
  return inMemoryStorage;
}

function persistMemories(shopId: string) {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(
        `${MEMORY_STORAGE_KEY}_${shopId}`,
        JSON.stringify(inMemoryStorage)
      );
    } catch (e) {
      console.warn("Failed to persist business memories:", e);
    }
  }
}

export interface SaveMemoryInput {
  shopId: string;
  memoryType: "policy" | "verified_fact" | "experiment_result" | "owner_correction";
  content: string;
  sourceRefs?: string[];
  confidence?: "high" | "medium" | "low";
  expiresAt?: string;
}

/**
 * Persists verified shop lessons, owner corrections, and decision outcomes.
 */
export function saveBusinessMemory(input: SaveMemoryInput): BusinessMemory {
  const { shopId, memoryType, content, sourceRefs = [], confidence = "high", expiresAt } = input;
  loadMemories(shopId);

  const id = `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const memory: BusinessMemory = {
    id,
    shop_id: shopId,
    memory_type: memoryType,
    content,
    source_refs: sourceRefs,
    confidence,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };

  inMemoryStorage[id] = memory;
  persistMemories(shopId);
  return memory;
}

export function getBusinessMemories(shopId: string): BusinessMemory[] {
  loadMemories(shopId);
  return Object.values(inMemoryStorage)
    .filter((m) => m.shop_id === shopId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function deleteBusinessMemory(memoryId: string, shopId: string): boolean {
  loadMemories(shopId);
  if (inMemoryStorage[memoryId]) {
    delete inMemoryStorage[memoryId];
    persistMemories(shopId);
    return true;
  }
  return false;
}

export interface RetrieveMemoriesOptions {
  shopId: string;
  query: string;
}

/**
 * Relevance-based Memory Retriever
 * 
 * Ingests keywords from goal/products and prioritizes owner corrections and policies.
 */
export function retrieveRelevantMemories(options: RetrieveMemoriesOptions): BusinessMemory[] {
  const { shopId, query } = options;
  const memories = getBusinessMemories(shopId);
  const qTokens = query
    .toLowerCase()
    .split(/[\s,._-]+/)
    .filter((t) => t.length > 2);

  return memories.filter((m) => {
    // Owner corrections and policies always get high retrieval priority
    if (m.memory_type === "owner_correction" || m.memory_type === "policy") {
      return true;
    }

    const contentLower = m.content.toLowerCase();
    return qTokens.some((tok) => contentLower.includes(tok));
  });
}

export interface UnverifiedPromotionInput {
  shopId: string;
  content: string;
  isConfirmedByOwner: boolean;
  sourceRefs?: string[];
}

export interface UnverifiedPromotionResult {
  success: boolean;
  reason?: string;
  memory?: BusinessMemory;
}

/**
 * Guardrail Check: Unverified AI assertions are strictly prevented from
 * promoting to permanent business memory without owner confirmation.
 */
export function attemptUnverifiedPromotion(
  input: UnverifiedPromotionInput
): UnverifiedPromotionResult {
  if (!input.isConfirmedByOwner) {
    return {
      success: false,
      reason:
        "Guardrail violation: Only human-confirmed corrections or approved actions may enter permanent memory.",
    };
  }

  const memory = saveBusinessMemory({
    shopId: input.shopId,
    memoryType: "verified_fact",
    content: input.content,
    sourceRefs: input.sourceRefs,
    confidence: "medium",
  });

  return {
    success: true,
    memory,
  };
}
