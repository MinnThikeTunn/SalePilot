-- ==============================================================================
-- SalePilot AI — Clean Unified Database Schema
-- Run this in your Supabase Project: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Enable UUID Extension (standard in PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. Shops Table (SME merchant profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id VARCHAR(100) UNIQUE,
    shop_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    phone TEXT,
    address TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_profile JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_shop_id ON public.shops(shop_id);

ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own shop" ON public.shops;
DROP POLICY IF EXISTS "Owners can insert own shop" ON public.shops;
DROP POLICY IF EXISTS "Owners can update own shop" ON public.shops;
DROP POLICY IF EXISTS "Owners can delete own shop" ON public.shops;
DROP POLICY IF EXISTS "Public can view shops by shop_id" ON public.shops;

CREATE POLICY "Owners can view own shop"
ON public.shops FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own shop"
ON public.shops FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own shop"
ON public.shops FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own shop"
ON public.shops FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Public can view shops by shop_id"
ON public.shops FOR SELECT
TO public
USING (true);


-- ==============================================================================
-- 3. Products Table (Catalog items)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 8)),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT DEFAULT '',
    "Varies" JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_on_demand BOOLEAN DEFAULT FALSE,
    waiting_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_owner_id ON public.products(owner_id);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON public.products(shop_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view own products" ON public.products;
DROP POLICY IF EXISTS "Owners can insert own products" ON public.products;
DROP POLICY IF EXISTS "Owners can update own products" ON public.products;
DROP POLICY IF EXISTS "Owners can delete own products" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;

CREATE POLICY "Owners can view own products"
ON public.products FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert own products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own products"
ON public.products FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own products"
ON public.products FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Public can view products"
ON public.products FOR SELECT
TO public
USING (true);


-- ==============================================================================
-- 4. Orders Table (Sales orders & payment receipts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
    invoice_id TEXT NOT NULL,
    shop_id TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_telegram_id TEXT,
    township TEXT NOT NULL,
    address_details TEXT,
    delivery_fee INTEGER NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    total_amount INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    payment_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON public.orders(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_id ON public.orders(invoice_id);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view order by invoice" ON public.orders;

CREATE POLICY "Owners can manage orders"
ON public.orders FOR ALL
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Public can place orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view order by invoice"
ON public.orders FOR SELECT
TO public
USING (true);


-- ==============================================================================
-- 5. Delivery Zones Table (Township shipping fees)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id TEXT PRIMARY KEY DEFAULT ('zone-' || floor(extract(epoch from now()))::text || '-' || substr(md5(random()::text), 1, 6)),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id TEXT,
    township_name TEXT NOT NULL,
    rate INTEGER NOT NULL DEFAULT 0,
    estimated_transit_timeline TEXT DEFAULT '1-2 Days',
    region TEXT DEFAULT 'Yangon',
    division TEXT DEFAULT 'Yangon',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_zones_owner ON public.delivery_zones(owner_id);

ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage delivery zones" ON public.delivery_zones;
DROP POLICY IF EXISTS "Public can view delivery zones" ON public.delivery_zones;

CREATE POLICY "Owners can manage delivery zones"
ON public.delivery_zones FOR ALL
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Public can view delivery zones"
ON public.delivery_zones FOR SELECT
TO public
USING (true);


-- ==============================================================================
-- 6. Storage Bucket for Per-Shop State (`shop-states`)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'shop-states',
    'shop-states',
    false,
    10485760,
    ARRAY['application/json']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['application/json'];

DROP POLICY IF EXISTS "shop_states_select_own" ON storage.objects;
DROP POLICY IF EXISTS "shop_states_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "shop_states_update_own" ON storage.objects;
DROP POLICY IF EXISTS "shop_states_delete_own" ON storage.objects;

CREATE POLICY "shop_states_select_own"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'shop-states'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "shop_states_insert_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'shop-states'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "shop_states_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'shop-states'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'shop-states'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "shop_states_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'shop-states'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
