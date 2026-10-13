import type {
  Product,
  Order,
  SalesOpportunity,
  AnalyticsRun,
  OpportunityOutcome,
  DataQualityStatus,
  ScoreBreakdown,
  ConfidenceLevel,
  OpportunityType,
  LifecycleStatus,
} from "../../types";

export interface PeriodSlice {
  startDate: Date;
  endDate: Date;
  orders: Order[];
  revenue: number;
  completedOrders: number;
  cancelledOrders: number;
  totalOrders: number;
  aov: number;
  cancellationRate: number; // 0 to 1
  totalUnitsSold: number;
  productVelocities: Record<string, { unitsSold: number; revenue: number }>;
}

export interface BusinessMetrics {
  current: PeriodSlice;
  previous: PeriodSlice;
  changes: {
    revenuePct: number | null;
    ordersPct: number | null;
    aovPct: number | null;
    cancellationRatePct: number | null;
  };
}

export interface DataQualityCheckResult {
  status: DataQualityStatus;
  completenessScore: number; // 0 - 100
  missingData: string[];
  warnings: string[];
  freshnessTimestamp: string;
}

export interface OpportunityCandidate {
  key: string;
  type: OpportunityType;
  title: string;
  problemDescription: string;
  impactScore: number;       // 0 - 100
  evidenceScore: number;     // 0 - 100
  urgencyScore: number;      // 0 - 100
  actionabilityScore: number;// 0 - 100
  confidence: ConfidenceLevel;
  evidenceSnapshot: {
    metrics: Record<string, number | string | boolean>;
    analysisPeriod: string;
    comparisonPeriod?: string;
    comparisonValues?: Record<string, number | string>;
    sourceRecords: string;
    warnings?: string[];
  };
  expectedImpact: {
    revenueAtRiskMmk?: number;
    potentialGainMmk?: number;
    unitsImpacted?: number;
    assumptions?: string;
  };
  recommendedAction: {
    actionType: string;
    title: string;
    description: string;
    requiresApproval: boolean;
    suggestedParams?: Record<string, unknown>;
  };
  warnings: string[];
  templateExplanation: {
    whyItMatters: string;
    actionRationale: string;
    expectedOutcome?: string;
    limitations?: string;
  };
}

export interface StrategyDeskResult {
  run: AnalyticsRun;
  opportunities: SalesOpportunity[];
  topPriority: SalesOpportunity | null;
  outcomes: OpportunityOutcome[];
}
