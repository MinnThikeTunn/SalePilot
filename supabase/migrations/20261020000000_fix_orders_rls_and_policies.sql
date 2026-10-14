-- ==============================================================================
-- Migration: 20261020000000_fix_orders_rls_and_policies.sql
-- Fix OWASP A01 data leak on orders table, allow public slip uploads,
-- and add atomic stock decrement function.
-- ==============================================================================

-- 1. Fix Orders RLS policies
DROP POLICY IF EXISTS "Public can view order by invoice" ON public.orders;
DROP POLICY IF EXISTS "Public can update order payment details" ON public.orders;
DROP POLICY IF EXISTS "Owners can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Public can place orders" ON public.orders;

-- Authenticated merchant has full access to their own store orders
CREATE POLICY "Owners can manage orders"
ON public.orders FOR ALL
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Public shoppers can insert new orders
CREATE POLICY "Public can place orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public shoppers can update payment details for their pending/verifying orders
CREATE POLICY "Public can update order payment details"
ON public.orders FOR UPDATE
TO anon, authenticated
USING (status IN ('pending', 'verifying'))
WITH CHECK (status IN ('pending', 'verifying'));

-- 2. Safe RPC function to retrieve a specific order by invoice ID without leaking the table
CREATE OR REPLACE FUNCTION public.get_order_by_invoice(p_invoice_id TEXT)
RETURNS SETOF public.orders AS $$
  SELECT * FROM public.orders WHERE invoice_id = p_invoice_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Atomic stock decrement RPC function to prevent race conditions & lost updates
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id TEXT,
  p_quantity INT,
  p_owner_id UUID DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_new_stock INT;
BEGIN
  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_product_id
    AND (p_owner_id IS NULL OR owner_id = p_owner_id)
  RETURNING stock INTO v_new_stock;
  
  RETURN COALESCE(v_new_stock, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
