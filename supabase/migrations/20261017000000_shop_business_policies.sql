-- ==============================================================================
-- SalePilot Team: Migration 20261017000000_shop_business_policies.sql
-- Table: shop_business_policies
-- Manages financial policy guardrails, discount caps, and contribution margin floors
-- Enforces UUID shop-scoped foreign key and tenant-isolated RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shop_business_policies (
    shop_id UUID PRIMARY KEY REFERENCES public.shops(id) ON DELETE CASCADE,
    min_contribution_margin_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (min_contribution_margin_pct >= 0 AND min_contribution_margin_pct <= 100),
    max_discount_pct NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (max_discount_pct >= 0 AND max_discount_pct <= 100),
    require_delivery_fee_coverage BOOLEAN NOT NULL DEFAULT true,
    max_cod_return_allowance_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (max_cod_return_allowance_pct >= 0 AND max_cod_return_allowance_pct <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_policies_shop ON public.shop_business_policies(shop_id);

ALTER TABLE public.shop_business_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own shop business policies" ON public.shop_business_policies;
DROP POLICY IF EXISTS "Owners can update own shop business policies" ON public.shop_business_policies;
DROP POLICY IF EXISTS "Owners can insert own shop business policies" ON public.shop_business_policies;

CREATE POLICY "Owners can view own shop business policies"
ON public.shop_business_policies FOR SELECT
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can insert own shop business policies"
ON public.shop_business_policies FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);

CREATE POLICY "Owners can update own shop business policies"
ON public.shop_business_policies FOR UPDATE
TO authenticated
USING (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
)
WITH CHECK (
    auth.uid() = (SELECT owner_id FROM public.shops WHERE id = shop_id)
);
