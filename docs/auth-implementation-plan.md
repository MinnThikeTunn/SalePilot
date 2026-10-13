# Auth Implementation (No Express)

See project README for setup. Summary:

- **Auth:** Supabase email/password in React (`AuthContext`, `AuthPage`)
- **Data:** Per-user `shop-states/{userId}/state.json` in Supabase Storage (RLS)
- **Secrets / AI / Telegram:** Supabase Edge Functions `api` and `telegram-webhook`
- **Dev:** `npm run dev` (Vite on port 3000)

## Deploy Edge Functions

```bash
supabase login
supabase link --project-ref YOUR_REF
supabase db push
supabase secrets set GEMINI_API_KEY=... SUPABASE_SERVICE_ROLE_KEY=...
supabase functions deploy api
supabase functions deploy telegram-webhook
```

## Local functions

```bash
supabase start
supabase functions serve
```
