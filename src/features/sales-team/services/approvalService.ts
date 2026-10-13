import type { TeamApproval } from "../types/sales-team";
import { getState } from "../../../services/clientStore";
import { saveBusinessMemory } from "./businessMemoryService";

// ============================================================================
// Deterministic Canonical JSON Stringifier
// ============================================================================
export function canonicalStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalStringify).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(obj[k])).join(",") +
    "}"
  );
}

// ============================================================================
// Pure-TypeScript SHA-256 Engine (FIPS 180-4 Standard, Zero External Deps)
// Works synchronously in both Browser and Node.js environments
// ============================================================================
function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = "length";
  let i = 0,
    j = 0;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  // Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2; factor * factor <= candidate; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength | 0;

  // Process each 16-word block
  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];

      const s0 =
        (w15 ? ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3) : 0);
      const s1 =
        (w2 ? ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10) : 0);

      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const a = hash[0],
        e = hash[4];
      const s1_e = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & hash[5]) ^ (~e & hash[6]);
      const temp1 = (hash[7] + s1_e + ch + k[i] + w[i]) | 0;
      const s0_a = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_a + maj) | 0;

      hash = [(temp1 + temp2) | 0, hash[0], hash[1], hash[2], (hash[3] + temp1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

export function computeCanonicalPayloadHash(payload: Record<string, any>): string {
  const canonicalJson = canonicalStringify(payload);
  return sha256(canonicalJson);
}

// ============================================================================
// In-Memory & LocalStorage Approval Store
// ============================================================================
const APPROVAL_STORAGE_KEY = "sales_brain_approvals_v1";
let inMemoryApprovals: Record<string, TeamApproval> = {};

function loadApprovals(shopId: string): Record<string, TeamApproval> {
  if (typeof localStorage !== "undefined") {
    try {
      const stored = localStorage.getItem(`${APPROVAL_STORAGE_KEY}_${shopId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        inMemoryApprovals = { ...inMemoryApprovals, ...parsed };
      }
    } catch {
      // ignore
    }
  }
  return inMemoryApprovals;
}

function saveApprovals(shopId: string) {
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(
        `${APPROVAL_STORAGE_KEY}_${shopId}`,
        JSON.stringify(inMemoryApprovals)
      );
    } catch (e) {
      console.warn("Failed to persist approvals:", e);
    }
  }
}

export interface CreateApprovalOptions {
  shopId: string;
  decisionId: string;
  actionType: string;
  payload: Record<string, any>;
  approvedBy?: string;
}

export function createPendingApproval(options: CreateApprovalOptions): TeamApproval {
  const { shopId, decisionId, actionType, payload, approvedBy } = options;
  const hash = computeCanonicalPayloadHash(payload);
  const now = new Date().toISOString();
  const id = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  loadApprovals(shopId);

  const approval: TeamApproval = {
    id,
    decision_id: decisionId,
    shop_id: shopId,
    action_type: actionType,
    approved_by: approvedBy || "pending_owner",
    approved_payload: payload,
    approved_payload_hash: hash,
    status: "pending",
    created_at: now,
  };

  inMemoryApprovals[id] = approval;
  saveApprovals(shopId);
  return approval;
}

export function approveAction(approvalId: string, approvedBy: string): TeamApproval {
  const approval = inMemoryApprovals[approvalId];
  if (!approval) {
    throw new Error(`Approval '${approvalId}' not found`);
  }

  approval.status = "approved";
  approval.approved_by = approvedBy;
  approval.approved_at = new Date().toISOString();

  saveApprovals(approval.shop_id);
  return approval;
}

export interface RejectApprovalResult extends TeamApproval {
  rejectionReason?: string;
}

export function rejectAction(approvalId: string, reason: string): RejectApprovalResult {
  const approval = inMemoryApprovals[approvalId];
  if (!approval) {
    throw new Error(`Approval '${approvalId}' not found`);
  }

  approval.status = "rejected";
  (approval as any).rejectionReason = reason;

  saveApprovals(approval.shop_id);

  // Automatically record owner correction in Business Memory
  saveBusinessMemory({
    shopId: approval.shop_id,
    memoryType: "owner_correction",
    content: `Owner rejected action (${approval.action_type}): ${reason}`,
    sourceRefs: [approval.id],
    confidence: "high",
  });

  return approval;
}

export interface ExecutionResult {
  success: boolean;
  status: "executed" | "invalidated" | "failed";
  reason?: string;
  executedPayload?: Record<string, any>;
}

/**
 * Pre-execution Guard (ADR-0003)
 * 
 * Cryptographically verifies payload hash and checks underlying store stock/prices.
 * If product price or stock was altered since approval, immediately invalidates approval.
 */
export function verifyAndExecuteAction(approvalId: string): ExecutionResult {
  const approval = inMemoryApprovals[approvalId];
  if (!approval) {
    return { success: false, status: "failed", reason: `Approval '${approvalId}' not found` };
  }

  // 1. Verify cryptographic hash integrity
  const recomputedHash = computeCanonicalPayloadHash(approval.approved_payload);
  if (recomputedHash !== approval.approved_payload_hash) {
    approval.status = "invalidated";
    saveApprovals(approval.shop_id);
    return {
      success: false,
      status: "invalidated",
      reason: "Cryptographic Mismatch: Payload has been tampered with since approval.",
    };
  }

  // 2. Pre-execution Store State Guard
  const payload = approval.approved_payload;
  if (payload.productId) {
    const state = getState();
    const product = (state.products || []).find((p) => p.id === payload.productId);

    if (!product) {
      approval.status = "invalidated";
      saveApprovals(approval.shop_id);
      return {
        success: false,
        status: "invalidated",
        reason: "Invalidated: Target product has been removed from catalog.",
      };
    }

    // Check stock depletion
    const currentStock = Number(product.stock) || 0;
    if (currentStock <= 0) {
      approval.status = "invalidated";
      saveApprovals(approval.shop_id);
      return {
        success: false,
        status: "invalidated",
        reason: `Invalidated: Product '${product.name}' stock is depleted (${currentStock} units). Promotion cannot be fulfilled.`,
      };
    }

    // Check price alteration
    if (payload.priceMmk && Number(payload.priceMmk) !== Number(product.price)) {
      approval.status = "invalidated";
      saveApprovals(approval.shop_id);
      return {
        success: false,
        status: "invalidated",
        reason: `Invalidated: Retail price for '${product.name}' changed from ${payload.priceMmk} to ${product.price} MMK since approval.`,
      };
    }
  }

  // 3. Mark Executed
  approval.status = "executed";
  saveApprovals(approval.shop_id);

  saveBusinessMemory({
    shopId: approval.shop_id,
    memoryType: "verified_fact",
    content: `Owner executed approved action (${approval.action_type}): sealed with hash ${approval.approved_payload_hash.slice(0, 16)}`,
    sourceRefs: [approval.id],
    confidence: "high",
  });

  return {
    success: true,
    status: "executed",
    executedPayload: approval.approved_payload,
  };
}

export function getApprovalsForShop(shopId: string): TeamApproval[] {
  loadApprovals(shopId);
  return Object.values(inMemoryApprovals).filter((a) => a.shop_id === shopId);
}

export function getPendingApprovals(shopId: string): TeamApproval[] {
  return getApprovalsForShop(shopId).filter((a) => a.status === "pending");
}
