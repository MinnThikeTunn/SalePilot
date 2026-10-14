-- ==============================================================================
-- SalePilot Team: Migration 20261016000000_sales_team_core_evidence.sql
-- Foundational Tables: team_sessions, team_agent_runs, team_evidence
-- Enforces UUID shop-scoped foreign keys and tenant-isolated RLS
-- ==============================================================================

-- 1. team_sessions table
CREATE TABLE IF NOT EXISTS public.team_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    goal TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN (
        'queued', 'investigating', 'debating', 'awaiting_approval', 'executing', 'completed', 'failed', 'cancelled'
    )),
    date_range_start TIMESTAMPTZ,
    date_range_end TIMESTAMPTZ,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    error_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_team_session_range CHECK (
        date_range_end IS NULL OR date_range_start IS NULL OR date_range_end >= date_range_start
    ),
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_team_sessions_shop ON public.team_sessions(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_sessions_status ON public.team_sessions(status);

ALTER TABLE public.team_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own team sessions" ON public.team_sessions;
DROP POLICY IF EXISTS "Owners can manage own team sessions" ON public.team_sessions;

CREATE POLICY "Owners can view own team sessions"
ON public.team_sessions FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own team sessions"
ON public.team_sessions FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

-- 2. team_agent_runs table
CREATE TABLE IF NOT EXISTS public.team_agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    agent_key TEXT NOT NULL CHECK (agent_key IN ('scout', 'muse', 'guardian', 'echo', 'commander')),
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped')),
    input_hash TEXT,
    output_json JSONB,
    model_name TEXT,
    token_usage JSONB NOT NULL DEFAULT '{"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}'::jsonb,
    error_code TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (session_id, shop_id) REFERENCES public.team_sessions(id, shop_id) ON DELETE CASCADE,
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_team_agent_runs_session ON public.team_agent_runs(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_team_agent_runs_agent ON public.team_agent_runs(agent_key);

ALTER TABLE public.team_agent_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own agent runs" ON public.team_agent_runs;
DROP POLICY IF EXISTS "Owners can manage own agent runs" ON public.team_agent_runs;

CREATE POLICY "Owners can view own agent runs"
ON public.team_agent_runs FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own agent runs"
ON public.team_agent_runs FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

-- 3. team_evidence table
CREATE TABLE IF NOT EXISTS public.team_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('order', 'product', 'inventory', 'inquiry', 'campaign', 'analytics')),
    source_id TEXT,
    metric_key TEXT NOT NULL,
    value JSONB,
    unit TEXT,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    quality JSONB NOT NULL DEFAULT '{"coverage": null, "missing_fields": [], "limitations": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (session_id, shop_id) REFERENCES public.team_sessions(id, shop_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_team_evidence_session ON public.team_evidence(session_id);
CREATE INDEX IF NOT EXISTS idx_team_evidence_metric ON public.team_evidence(metric_key);
CREATE INDEX IF NOT EXISTS idx_team_evidence_source ON public.team_evidence(source_type, source_id);

ALTER TABLE public.team_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own evidence" ON public.team_evidence;
DROP POLICY IF EXISTS "Owners can manage own evidence" ON public.team_evidence;

CREATE POLICY "Owners can view own evidence"
ON public.team_evidence FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own evidence"
ON public.team_evidence FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);
