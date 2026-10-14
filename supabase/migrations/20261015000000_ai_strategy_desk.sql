-- ==============================================================================
-- SalePilot AI — AI Strategy Desk Schema Migration
-- Implements tables and constraints required by docs/AI_Strategy_Feature.md
-- ==============================================================================

-- 1. Extend products with deterministic economic & inventory metadata
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT 0;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 3;

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS safety_stock_threshold INTEGER DEFAULT 5;

-- 2. Analytics Runs Table
CREATE TABLE IF NOT EXISTS public.analytics_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_window_start TIMESTAMPTZ NOT NULL,
    analysis_window_end TIMESTAMPTZ NOT NULL,
    comparison_window_start TIMESTAMPTZ,
    comparison_window_end TIMESTAMPTZ,
    timezone TEXT NOT NULL DEFAULT 'Asia/Yangon',
    currency TEXT NOT NULL DEFAULT 'MMK',
    data_quality_status TEXT NOT NULL CHECK (data_quality_status IN ('good', 'limited', 'insufficient')),
    data_quality_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    metric_version TEXT NOT NULL DEFAULT 'v1.0',
    scoring_version TEXT NOT NULL DEFAULT 'v1.0',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'limited')),
    source_watermark TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_runs_owner ON public.analytics_runs(owner_id);
CREATE INDEX IF NOT EXISTS idx_analytics_runs_shop ON public.analytics_runs(shop_id);
CREATE INDEX IF NOT EXISTS idx_analytics_runs_created ON public.analytics_runs(created_at DESC);

ALTER TABLE public.analytics_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own analytics runs" ON public.analytics_runs;
DROP POLICY IF EXISTS "Owners can insert own analytics runs" ON public.analytics_runs;
DROP POLICY IF EXISTS "Owners can delete own analytics runs" ON public.analytics_runs;

CREATE POLICY "Owners can view own analytics runs"
ON public.analytics_runs FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own analytics runs"
ON public.analytics_runs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own analytics runs"
ON public.analytics_runs FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 3. Sales Opportunities Table
CREATE TABLE IF NOT EXISTS public.sales_opportunities (
    id TEXT PRIMARY KEY DEFAULT ('opp-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
    shop_id TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    run_id UUID REFERENCES public.analytics_runs(id) ON DELETE SET NULL,
    opportunity_key TEXT NOT NULL,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('sales_decline', 'stock_risk', 'cancellation_risk', 'conversion_gap', 'unconverted_inquiries', 'margin_opportunity', 'repeat_purchase')),
    title TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    priority_score NUMERIC(5,2) NOT NULL CHECK (priority_score >= 0 AND priority_score <= 100),
    score_breakdown JSONB NOT NULL DEFAULT '{"impact": 0, "evidence": 0, "urgency": 0, "actionability": 0}'::jsonb,
    evidence_confidence TEXT NOT NULL CHECK (evidence_confidence IN ('high', 'medium', 'low')),
    evidence_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    expected_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
    recommended_action JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_quality_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    ai_explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'dismissed', 'in_progress', 'completed', 'expired')),
    dismissed_reason TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_owner ON public.sales_opportunities(owner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_shop ON public.sales_opportunities(shop_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.sales_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_key ON public.sales_opportunities(opportunity_key);
CREATE INDEX IF NOT EXISTS idx_opportunities_score ON public.sales_opportunities(priority_score DESC);

ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage sales opportunities" ON public.sales_opportunities;

CREATE POLICY "Owners can manage sales opportunities"
ON public.sales_opportunities FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 4. Opportunity Outcomes Table
CREATE TABLE IF NOT EXISTS public.opportunity_outcomes (
    id TEXT PRIMARY KEY DEFAULT ('outc-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
    opportunity_id TEXT NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
    opportunity_key TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    baseline_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    observed_metrics JSONB DEFAULT '{}'::jsonb,
    observation_period_days INTEGER NOT NULL DEFAULT 7,
    outcome_status TEXT NOT NULL DEFAULT 'monitoring' CHECK (outcome_status IN ('monitoring', 'measured', 'inconclusive')),
    attribution_method TEXT NOT NULL DEFAULT 'pre_post_comparison',
    notes TEXT,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outcomes_owner ON public.opportunity_outcomes(owner_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_shop ON public.opportunity_outcomes(shop_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_opportunity ON public.opportunity_outcomes(opportunity_id);

ALTER TABLE public.opportunity_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage opportunity outcomes" ON public.opportunity_outcomes;

CREATE POLICY "Owners can manage opportunity outcomes"
ON public.opportunity_outcomes FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- 5. Realtime publication registration
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND tablename = 'sales_opportunities'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_opportunities;
    END IF;
END $$;
