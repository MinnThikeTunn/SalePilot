-- ==============================================================================
-- Telegram Deep-Linking Handshake Tokens
-- Enables authenticated merchants and customers to link their Telegram account
-- to their Sale Brain shop profile via /start link_<token>
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.telegram_auth_tokens (
    token VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed BOOLEAN DEFAULT FALSE,
    telegram_user_id BIGINT,
    telegram_username TEXT
);

CREATE INDEX IF NOT EXISTS idx_tg_auth_tokens_token ON public.telegram_auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_tg_auth_tokens_user_id ON public.telegram_auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tg_auth_tokens_consumed ON public.telegram_auth_tokens(consumed);

-- Enable RLS
ALTER TABLE public.telegram_auth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own link tokens" ON public.telegram_auth_tokens;
DROP POLICY IF EXISTS "Users can view their own tokens" ON public.telegram_auth_tokens;

-- Authenticated merchants/users can insert link tokens for their own account
CREATE POLICY "Users can create their own link tokens"
ON public.telegram_auth_tokens FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated merchants/users can view their own tokens (needed for Supabase Realtime)
CREATE POLICY "Users can view their own tokens"
ON public.telegram_auth_tokens FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Public / Anonymous service (using publishable key) can read tokens to verify them
DROP POLICY IF EXISTS "Public can verify link tokens" ON public.telegram_auth_tokens;
CREATE POLICY "Public can verify link tokens"
ON public.telegram_auth_tokens FOR SELECT
TO public
USING (true);

-- Public / Anonymous service can update tokens to consume them upon verification
DROP POLICY IF EXISTS "Public can consume link tokens" ON public.telegram_auth_tokens;
CREATE POLICY "Public can consume link tokens"
ON public.telegram_auth_tokens FOR UPDATE
TO public
USING (consumed = false)
WITH CHECK (true);

-- Ensure Realtime publication includes telegram_auth_tokens for reactive frontend updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND tablename = 'telegram_auth_tokens'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.telegram_auth_tokens;
    END IF;
END $$;
