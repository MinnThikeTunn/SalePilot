# SalePilot AI — Project Submission

AI-powered conversational commerce platform for Myanmar businesses. Shop owners manage products, orders and delivery zones in a web dashboard, while customers shop through **Telegram** (and Facebook Messenger) with a Google Gemini-powered assistant.

This submission contains **two projects** that work together:

| Folder | Role | Stack |
|---|---|---|
| [`SalePilot/`](./SalePilot) | Main project: web dashboard + Supabase database & Edge Functions | React 19, TypeScript, Vite 6, Tailwind CSS 4, Supabase, Gemini |
| [`Omnichannel_backend/`](./Omnichannel_backend) | Telegram / Messenger bot service + Delivery Matrix API | Python 3.11+, FastAPI, aiogram, Supabase, Gemini |

Original repositories:
- https://github.com/MinnThikeTunn/SalePilot
- https://github.com/MinnThikeTunn/Omnichannel_backend

---

## Folder Structure

```text
.
├── README.md                 # This file
├── SalePilot/                # Frontend + Supabase (main project)
│   ├── src/                  # React app
│   ├── supabase/             # schema, migrations, Edge Functions
│   ├── docs/                 # Architecture & deployment docs
│   └── .env.example
└── Omnichannel_backend/      # Telegram bot service (FastAPI)
    ├── main.py               # App entry point
    ├── telegram_router.py    # Telegram handlers
    ├── core_logic.py         # Bot logic
    ├── ai/                   # Gemini service
    ├── api/                  # Delivery Matrix REST API
    └── .env.example
```

---

## How the Pieces Fit Together

```text
Shop owner ──► SalePilot dashboard (React, :3000) ──► Supabase (DB, Auth, Storage, Edge Functions)
                        │  /api proxy                          ▲
                        ▼                                      │
Customer ──► Telegram ──► Omnichannel_backend (FastAPI, :8000) ┘
                              └─► Gemini AI
```

- The dashboard and the bot service **share the same Supabase project**, so use the **same Supabase URL/keys** in both `.env` files.
- In development, the dashboard proxies `/api` requests to `http://127.0.0.1:8000` (the bot backend).
- Telegram account linking uses a one-time deep link (`/start link_<token>`) generated from the dashboard and verified by the backend against Supabase.

---

## Prerequisites

- **Node.js** v18+ and **npm** v9+
- **Python** 3.11+ and **pip**
- A **Supabase** project (free tier is fine) — https://supabase.com
- A **Google Gemini API key** — https://aistudio.google.com/apikey
- A **Telegram bot token** from [@BotFather](https://t.me/BotFather)
- **ngrok** (or any public HTTPS tunnel) so Telegram can reach your local backend — https://ngrok.com
- *(Optional)* [Supabase CLI](https://supabase.com/docs/guides/cli) to deploy Edge Functions
- *(Optional)* Facebook Page + app credentials, only for Messenger

---

## Quick Start

Run the steps in this order: **Supabase → Backend → Frontend**.

### 1. Set up Supabase

1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run the schema from `SalePilot/supabase/schema.sql`
   (or the migration `SalePilot/supabase/migrations/20261012000000_initial_schema.sql`).
3. Copy these values from **Project Settings → API**:
   - Project URL
   - `anon` / publishable key
   - `service_role` key (keep secret, backend/Edge Functions only)
4. *(Optional)* Deploy the Edge Functions (`api`, `shop`, `chat-with-tools`, `telegram-webhook`):

   ```bash
   cd SalePilot
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase functions deploy
   supabase secrets set GEMINI_API_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> \
     ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

### 2. Run the Telegram backend (`Omnichannel_backend`)

```bash
cd Omnichannel_backend

# Create & activate a virtual environment
python -m venv venv
source venv/bin/activate          # macOS / Linux
# .\venv\Scripts\Activate.ps1     # Windows PowerShell
# source venv/Scripts/activate    # Windows Git Bash

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env              # Windows CMD: copy .env.example .env
```

Edit `Omnichannel_backend/.env`:

```env
# --- Required ---
BOT_TOKENS=123456:ABC-your-telegram-bot-token      # comma-separated for multiple bots
BASE_URL=https://your-ngrok-url.ngrok-free.app     # public HTTPS URL (see ngrok below)
GEMINI_API_KEY=your_gemini_api_key

# Supabase (same project as the frontend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key    # or SUPABASE_KEY / VITE_SUPABASE_PUBLISHABLE_KEY

# --- Optional ---
GEMINI_MODEL_NAME=gemini-2.5-flash-lite
DELIVERY_API_BASE=http://localhost:8000
DELIVERY_CACHE_TTL_SECONDS=300

# --- Facebook Messenger (only if using Messenger) ---
FB_VERIFY_TOKEN=your_facebook_verify_token
PAGE_ACCESS_TOKEN=your_facebook_page_access_token
MESSENGER_BOT_ID=your_facebook_page_id
MESSENGER_BOT_NAME=Messenger Bot
```

> `BOT_TOKENS` and the Supabase variables are read by the code but are not all listed in `.env.example`, so add them manually.

Start the server:

```bash
python -m uvicorn main:app --reload
```

The API is now on **http://localhost:8000**. In a **second terminal**, expose it publicly:

```bash
ngrok http 8000
```

Copy the `https://…ngrok-free.app` URL into `BASE_URL` in `.env` and **restart** the server. On startup the backend automatically registers the Telegram webhook (`{BASE_URL}/telegram/{token}`) for every token in `BOT_TOKENS`.

### 3. Run the dashboard (`SalePilot`)

```bash
cd SalePilot
npm install
cp .env.example .env              # Windows CMD: copy .env.example .env
```

Edit `SalePilot/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_KEY=your-gemini-api-key
VITE_OMNICHANNEL_URL=http://localhost:8000
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:3000**.

---

## Try It Out

1. Open the dashboard at http://localhost:3000 and sign up / log in.
2. Complete the onboarding wizard (shop name, products, delivery zones).
3. Link your Telegram bot from the dashboard, or open your bot in Telegram and send `/start`.
4. Chat with the bot — ask about products, place an order, or ask about delivery to a township.
5. Check **Orders** in the dashboard to see the order appear.

You can also use the built-in **Telegram Bot Simulator** in the dashboard to test conversations without a live bot.

Verify the backend is up:

```bash
curl "http://localhost:8000/api/v1/delivery-matrix?page=1&limit=5"
```

Interactive API docs (FastAPI): http://localhost:8000/docs

---

## Useful Commands

**SalePilot (frontend)**

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | TypeScript type check |

**Omnichannel_backend**

| Command | Description |
|---|---|
| `python -m uvicorn main:app --reload` | Start dev server on port 8000 |
| `python -m pytest -v` | Run the test suite |

---

## Troubleshooting

- **Bot doesn't reply** — Check that `BASE_URL` is your *current* ngrok URL (it changes each time ngrok restarts) and that you restarted the backend after updating it. Make sure the token is listed in `BOT_TOKENS`.
- **"No BOT_TOKENS configured" warning** — `BOT_TOKENS` is missing from `Omnichannel_backend/.env`.
- **Dashboard can't reach the backend** — Confirm the backend is running on port 8000 and `VITE_OMNICHANNEL_URL` is correct.
- **Supabase errors / empty data** — Confirm the schema was applied and both projects use the same Supabase URL and keys.
- **Gemini quota errors** — The backend applies a cooldown on `ResourceExhausted`; wait a moment or use another API key / model via `GEMINI_MODEL_NAME`.
- **Windows shell issues** — Use `python -m uvicorn ...` rather than calling `uvicorn` directly.

---

## Security Notes

- Never commit `.env` files. Only `.env.example` templates are tracked.
- The Supabase `service_role` key and bot tokens are secrets — keep them server-side only.

---

## More Documentation

- `SalePilot/README.md` — frontend details
- `SalePilot/docs/architecture.md` — system architecture
- `SalePilot/docs/DEPLOYMENT_CHECKLIST.md` — deployment checklist
- `Omnichannel_backend/product-design/architecture.md` — bot backend architecture
- `Omnichannel_backend/api-doc.md` — Delivery Matrix API reference

## License

MIT
