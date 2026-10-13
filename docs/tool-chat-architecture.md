# Architecture Overview

> **Project:** Sales Brain AI — AI-Powered Conversational Commerce Platform  
> **Architecture Pattern:** Decoupled Jamstack SPA + Serverless BaaS (Supabase)

---

## 1. High-Level Architecture

Sales Brain AI is structured as a client-side Single Page Application (SPA) powered by Supabase services for backend functionality, persistent storage, and AI orchestration.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 SPA (Vite)                  │
│                                                        │
│   • Merchant Dashboard (`App.tsx`)                     │
│   • Onboarding Wizard (`Onboarding.tsx`)               │
│   • Storefront & Cart (`ShopStorefront.tsx`)           │
│   • Telegram Bot Simulator (`TelegramSimulator.tsx`)   │
│   • Smart Marketing Campaigns (`SmartMarketing.tsx`)   │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
       Supabase Client SDK        HTTP Function Call
                │                        │
                ▼                        ▼
┌───────────────────────────┐   ┌──────────────────────────┐
│     Supabase BaaS         │   │  Supabase Edge Functions │
│                           │   │  (Deno Runtime)          │
│ • Supabase Auth           │   │                          │
│ • PostgreSQL (RLS tables) │   │ • `api/`                 │
│ • Supabase Storage        │   │ • `telegram-webhook/`    │
│   (`shop-states` bucket)  │   │ • `chat-with-tools/`     │
│ • pgvector Knowledge Store│   │ • `shop/`                │
└───────────────────────────┘   └─────────────┬────────────┘
                                              │
                                     Google Gemini API
                                              │
                                              ▼
                                ┌──────────────────────────┐
                                │   Google Gemini 2.0      │
                                │   • Flash / Flash-Lite   │
                                │   • Text Embedding 004   │
                                └──────────────────────────┘
```

---

## 2. Directory Structure

```text
Sale-Brain-main/
├── .agents/                 # AI development guidelines and agent skills
├── docs/                    # Centralized project documentation
│   ├── architecture.md      # This document
│   ├── design.md            # UI/UX theme and styling specification
│   ├── DEPLOYMENT_CHECKLIST.md # Step-by-step production rollout guide
│   ├── auth-implementation-plan.md # Supabase Auth setup guide
│   ├── tool-chat-architecture.md   # Gemini tool-calling engine architecture
│   ├── tool-chat-examples.md       # Integration code examples
│   └── TOOL_CHAT.md         # Detailed tool-based chat specification
├── decision-log/            # Architectural Decision Records (ADRs)
│   ├── DEC-001.md ~ DEC-007.md
│   └── README.md            # ADR index table
├── scripts/                 # Utility and verification scripts
│   └── test-tool-chat.cjs   # Manual test script for tool-based chat function
├── src/                     # React 19 Frontend application
│   ├── components/          # Reusable dashboard, shop, and auth UI components
│   ├── contexts/            # React Context providers (AuthContext)
│   ├── data/                # Default seed states and Myanmar township data
│   │   ├── seedState.json   # Seed data for new shops
│   │   ├── defaultState.ts  # State initializers
│   │   └── townships.ts     # Township delivery data
│   ├── pages/               # Page views (e.g. FacebookCallback)
│   ├── services/            # API clients, local persistence, Supabase services
│   ├── utils/               # Supabase client singleton and helpers
│   ├── App.tsx              # Main dashboard application
│   ├── main.tsx             # React entry point and router
│   ├── types.ts             # Domain TypeScript definitions
│   └── index.css            # Tailwind CSS styling
├── supabase/                # Backend BaaS configuration
│   ├── config.toml          # Local Supabase CLI configuration
│   ├── functions/           # Edge Functions (Deno runtime)
│   │   ├── api/             # Core API endpoints
│   │   ├── chat-with-tools/ # Gemini tool-calling chat handler
│   │   ├── shop/            # Public shop data API
│   │   ├── telegram-webhook/# Telegram bot webhook processor
│   │   └── _shared/         # Shared auth, Gemini, and Telegram utilities
│   └── migrations/          # PostgreSQL migrations (pgvector, tables, RLS)
├── .env.example             # Environment variable template
├── .gitignore               # Ignored build and secret files
├── package.json             # NPM dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vercel.json              # Vercel SPA routing configuration
└── vite.config.ts           # Vite build and dev server configuration
```

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript 5.8, Vite 6, Tailwind CSS 4, Motion, Lucide React
- **Backend & Database:** Supabase (PostgreSQL with `pgvector`, Supabase Auth, Supabase Storage)
- **Serverless API:** Supabase Edge Functions (Deno runtime)
- **AI Engine:** Google Gemini API (`@google/genai`, Gemini 2.0 Flash, `text-embedding-004`)
- **Messaging:** Telegram Bot API (via Edge Function webhook)
