-- ==============================================================================
-- Sales Brain Team: Migration 20261018000000_sales_team_proposals_and_decisions.sql
-- Tables: team_proposals, team_debates, team_decisions, team_approvals
-- Enforces UUID shop-scoped foreign keys and tenant-isolated RLS
-- ==============================================================================

-- 1. team_proposals table
CREATE TABLE IF NOT EXISTS public.team_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    agent_key TEXT NOT NULL CHECK (agent_key IN ('scout', 'muse', 'guardian', 'echo', 'commander')),
    title TEXT NOT NULL,
    hypothesis TEXT NOT NULL,
    evidence_refs TEXT[] NOT NULL DEFAULT '{}',
    assumptions TEXT[] NOT NULL DEFAULT '{}',
    estimated_impact JSONB NOT NULL DEFAULT '{}'::jsonb,
    risks TEXT[] NOT NULL DEFAULT '{}',
    recommended_action TEXT NOT NULL,
    campaign_payload JSONB DEFAULT '{}'::jsonb,
    requires_owner_approval BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'audited', 'revised', 'rejected', 'accepted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (session_id, shop_id) REFERENCES public.team_sessions(id, shop_id) ON DELETE CASCADE,
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_team_proposals_session ON public.team_proposals(session_id, created_at);

ALTER TABLE public.team_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own team proposals" ON public.team_proposals;
DROP POLICY IF EXISTS "Owners can manage own team proposals" ON public.team_proposals;

CREATE POLICY "Owners can view own team proposals"
ON public.team_proposals FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own team proposals"
ON public.team_proposals FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

-- 2. team_debates table
CREATE TABLE IF NOT EXISTS public.team_debates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL,
    challenger TEXT NOT NULL CHECK (challenger IN ('scout', 'muse', 'guardian', 'echo', 'commander')),
    objection_code TEXT NOT NULL,
    evidence_refs TEXT[] NOT NULL DEFAULT '{}',
    notes TEXT NOT NULL,
    revision_attempt INT NOT NULL DEFAULT 1 CHECK (revision_attempt <= 3),
    resolution TEXT NOT NULL DEFAULT 'pending' CHECK (resolution IN ('pending', 'revised', 'escalated_to_owner', 'withdrawn', 'consensus')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (session_id, shop_id) REFERENCES public.team_sessions(id, shop_id) ON DELETE CASCADE,
    FOREIGN KEY (proposal_id, shop_id) REFERENCES public.team_proposals(id, shop_id) ON DELETE CASCADE,
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_team_debates_session ON public.team_debates(session_id, created_at);

ALTER TABLE public.team_debates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own team debates" ON public.team_debates;
DROP POLICY IF EXISTS "Owners can manage own team debates" ON public.team_debates;

CREATE POLICY "Owners can view own team debates"
ON public.team_debates FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own team debates"
ON public.team_debates FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

-- 3. team_decisions table
CREATE TABLE IF NOT EXISTS public.team_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    executive_summary TEXT NOT NULL,
    primary_proposal_id UUID,
    alternatives JSONB NOT NULL DEFAULT '[]'::jsonb,
    opportunity_score NUMERIC(5,2) NOT NULL DEFAULT 0.0,
    score_breakdown JSONB NOT NULL DEFAULT '{"impact": 0, "confidence": 0, "urgency": 0, "feasibility": 0}'::jsonb,
    evidence_refs TEXT[] NOT NULL DEFAULT '{}',
    assumptions TEXT[] NOT NULL DEFAULT '{}',
    risks TEXT[] NOT NULL DEFAULT '{}',
    next_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'ready_for_review' CHECK (status IN ('ready_for_review', 'needs_more_data', 'approved', 'rejected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (session_id, shop_id) REFERENCES public.team_sessions(id, shop_id) ON DELETE CASCADE,
    FOREIGN KEY (primary_proposal_id, shop_id) REFERENCES public.team_proposals(id, shop_id) ON DELETE SET NULL,
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_team_decisions_session ON public.team_decisions(session_id, created_at);

ALTER TABLE public.team_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own team decisions" ON public.team_decisions;
DROP POLICY IF EXISTS "Owners can manage own team decisions" ON public.team_decisions;

CREATE POLICY "Owners can view own team decisions"
ON public.team_decisions FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own team decisions"
ON public.team_decisions FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

-- 4. team_approvals table
CREATE TABLE IF NOT EXISTS public.team_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_payload JSONB NOT NULL,
    approved_payload_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'invalidated', 'executed')),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    FOREIGN KEY (decision_id, shop_id) REFERENCES public.team_decisions(id, shop_id) ON DELETE CASCADE,
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_team_approvals_decision ON public.team_approvals(decision_id, status);

ALTER TABLE public.team_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own team approvals" ON public.team_approvals;
DROP POLICY IF EXISTS "Owners can manage own team approvals" ON public.team_approvals;

CREATE POLICY "Owners can view own team approvals"
ON public.team_approvals FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own team approvals"
ON public.team_approvals FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);
