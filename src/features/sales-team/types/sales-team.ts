import type { Product, Order, DeliveryZone } from "../../../types";

export type AgentRoleKey = "scout" | "muse" | "guardian" | "echo" | "commander";

export interface TeamSession {
  id: string;
  shop_id: string;
  created_by: string;
  goal: string;
  status: "queued" | "investigating" | "debating" | "awaiting_approval" | "executing" | "completed" | "failed";
  date_range_start?: string;
  date_range_end?: string;
  context_snapshot: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface TeamAgentRun {
  id: string;
  session_id: string;
  shop_id: string;
  agent_key: AgentRoleKey;
  status: "queued" | "running" | "completed" | "failed" | "skipped";
  input_hash?: string;
  output_json?: Record<string, any>;
  model_name?: string;
  token_usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error_code?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TeamEvidence {
  id: string;
  shop_id: string;
  session_id: string;
  source_type: "order" | "product" | "inventory" | "inquiry" | "campaign" | "analytics";
  source_id?: string;
  metric_key: string;
  value?: number | string | boolean | null;
  unit?: string;
  period_start?: string;
  period_end?: string;
  observed_at: string;
  snapshot?: Record<string, any>;
  quality: {
    coverage: number | null;
    missing_fields: string[];
    limitations: string[];
  };
}

export interface TeamProposal {
  id: string;
  session_id: string;
  agent_key: AgentRoleKey;
  title: string;
  hypothesis: string;
  evidence_refs: string[];
  assumptions: string[];
  estimated_impact: {
    metric: string;
    value?: number;
    unit: string;
    basis: "observed" | "scenario" | "forecast";
  };
  risks: string[];
  recommended_action: string;
  campaign_payload?: Record<string, any>;
  requires_owner_approval: true;
  status: "draft" | "audited" | "revised" | "rejected" | "accepted";
}

export interface TeamDebate {
  id: string;
  session_id: string;
  shop_id?: string;
  proposal_id: string;
  challenger: AgentRoleKey;
  objection_code: string;
  evidence_refs: string[];
  notes: string;
  revision_attempt: number;
  resolution: "pending" | "revised" | "escalated_to_owner" | "withdrawn" | "consensus";
  created_at?: string;
  updated_at?: string;
}

export interface TeamDecision {
  id: string;
  session_id: string;
  title: string;
  executive_summary: string;
  primary_proposal_id?: string;
  alternatives: Array<{
    proposal_id: string;
    reason: string;
    tradeoffs: string[];
  }>;
  opportunity_score: number;
  score_breakdown: {
    impact: number;
    confidence: number;
    urgency: number;
    feasibility: number;
  };
  evidence_refs: string[];
  assumptions: string[];
  risks: string[];
  next_actions: Array<{
    type: "draft_follow_up" | "draft_campaign" | "create_bundle" | "inventory_review" | "collect_more_data";
    description: string;
    payload?: Record<string, any>;
    requires_approval: true;
  }>;
  status: "ready_for_review" | "needs_more_data" | "approved" | "rejected";
}

export interface TeamApproval {
  id: string;
  decision_id: string;
  shop_id: string;
  action_type: string;
  approved_by: string;
  approved_payload: Record<string, any>;
  approved_payload_hash: string;
  status: "pending" | "approved" | "rejected" | "invalidated" | "executed";
  approved_at?: string;
  created_at: string;
}

export interface ShopBusinessPolicy {
  shop_id: string;
  min_contribution_margin_pct: number;
  max_discount_pct: number;
  require_delivery_fee_coverage: boolean;
  max_cod_return_allowance_pct: number;
  created_at?: string;
  updated_at?: string;
}

export interface BusinessMemory {
  id: string;
  shop_id: string;
  memory_type: "policy" | "verified_fact" | "experiment_result" | "owner_correction";
  content: string;
  source_refs: string[];
  confidence: "high" | "medium" | "low";
  expires_at?: string;
  created_at: string;
}

// Tool Definition Interfaces
export interface ToolExecutionContext {
  shopId: string;
  userId?: string;
  dateRange?: { start?: string; end?: string };
}

export interface SalesTeamTool<TParams = any, TResult = any> {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (context: ToolExecutionContext, params?: TParams) => Promise<TResult> | TResult;
}
