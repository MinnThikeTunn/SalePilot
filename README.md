<p align="center">
  <img width="1200" height="475" alt="Sales Brain AI Banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</p>

# Sales Brain AI

AI-powered conversational commerce platform for Myanmar businesses. Enable your shop to sell products via Telegram and Facebook Messenger with automated customer service powered by Google Gemini AI.

---

## 📋 Description

**Sales Brain AI** is a modern full-stack web application designed for Myanmar SMEs. Shop owners can manage their product catalog, track orders, configure delivery zones, run AI marketing campaigns, and automate customer conversations via Telegram.

Built for Myanmar businesses, featuring:
- Multi-language support (English / Burmese)
- AI-powered customer service via Google Gemini
- Real-time order management & ledger tracking
- Interactive Telegram bot simulator for testing
- Township-based shipping fee matrix

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion, Lucide React |
| **Backend & BaaS** | Supabase (PostgreSQL with `pgvector`, Auth, Storage) |
| **Serverless Functions**| Supabase Edge Functions (`api`, `telegram-webhook`, `chat-with-tools`, `shop`) |
| **AI / LLM** | Google Gemini API (Gemini 2.0 Flash, `text-embedding-004`) |

---

## ✨ Features

- **Multi-step Onboarding Wizard** — Shop setup in minutes
- **Product Catalog Management** — Full product CRUD with variants & images
- **Order Management** — Status tracking from pending to completed with payment slip verification
- **Telegram Bot Simulator** — Test conversations without needing a live Telegram bot
- **AI Marketing Campaigns** — Generate social marketing copy with Gemini AI
- **Delivery Zone Management** — Configure township-based shipping fees across Myanmar

---

## 📁 Project Structure

```text
Sale-Brain-main/
├── .agents/                 # AI development instructions and agent guidelines
├── docs/                    # Centralized project documentation
│   ├── architecture.md      # System architecture & data flow
│   ├── design.md            # UI/UX theme and styling specification
│   ├── DEPLOYMENT_CHECKLIST.md # Deployment verification checklist
│   └── auth-implementation-plan.md
├── decision-log/            # Architectural Decision Records (ADRs)
│   ├── DEC-001.md ~ DEC-007.md
│   └── README.md            # ADR index table
├── scripts/                 # Utility scripts
│   └── test-tool-chat.cjs   # Edge Function test script
├── src/                     # React 19 SPA source code
│   ├── components/          # Dashboard, shop, and onboarding components
│   ├── contexts/            # React AuthContext
│   ├── data/                # Seed state & Myanmar townships data
│   │   ├── seedState.json   # Default shop seed state
│   │   ├── defaultState.ts  # State initializers
│   │   └── townships.ts     # Townships dataset
│   ├── pages/               # Application pages
│   ├── services/            # Supabase services and API client
│   ├── utils/               # Supabase client singleton
│   ├── App.tsx              # Main dashboard application
│   ├── main.tsx             # React entry point
│   └── types.ts             # TypeScript definitions
├── supabase/                # Supabase configuration & migrations
│   ├── config.toml          # Supabase project configuration
│   ├── functions/           # Deno Edge Functions
│   └── migrations/          # PostgreSQL database migrations
├── .env.example             # Environment variable template
├── .gitignore               # Git ignore rules
├── index.html               # Vite entry HTML
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel SPA routing
└── vite.config.ts           # Vite build configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **npm** (v9+)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
```

### Configuration

Edit `.env` (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### Running the Application

```bash
# Start local development server (http://localhost:3000)
npm run dev

# Run TypeScript type check
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

---

## 💻 Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build production assets into `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Clean `dist/` build directory |

---

## 📄 License

MIT License