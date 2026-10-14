-- ==============================================================================
-- Sales Brain Team: Migration 20261019000000_business_memory.sql
-- Table: business_memory
-- Stores verified shop lessons, owner corrections, and past decision outcomes
-- Enforces UUID shop-scoped foreign keys and tenant-isolated RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.business_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('policy', 'verified_fact', 'experiment_result', 'owner_correction')),
    content TEXT NOT NULL,
    source_refs TEXT[] NOT NULL DEFAULT '{}',
    confidence TEXT NOT NULL DEFAULT 'high' CHECK (confidence IN ('high', 'medium', 'low')),
    is_verified BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (id, shop_id)
);

CREATE INDEX IF NOT EXISTS idx_business_memory_shop ON public.business_memory(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_memory_type ON public.business_memory(shop_id, memory_type);

ALTER TABLE public.business_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own business memory" ON public.business_memory;
DROP POLICY IF EXISTS "Owners can manage own business memory" ON public.business_memory;

CREATE POLICY "Owners can view own business memory"
ON public.business_memory FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can manage own business memory"
ON public.business_memory FOR ALL
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);
