# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary User:** Myanmar SME business owners and social commerce merchants who sell products via Telegram, Facebook Messenger, and public web links. They need to manage product catalogs, calculate township delivery fees, verify mobile payment slips (KBZPay, WavePay), and track customer orders without spending all day manually chatting.
- **Secondary User:** Myanmar consumers and buyers browsing catalogs, placing orders, inquiring about stock and transit times, and submitting payment slips in Burmese or English.

## Product Purpose

Sales Brain AI enables Myanmar SMEs to automate conversational sales and order workflows using Google Gemini AI, reducing the overhead of manual chat handling while maintaining high customer trust through payment slip verification, accurate township shipping calculations, and human live support takeover.

## Positioning

Unlike generic global e-commerce platforms or basic chat ticketing tools, Sales Brain AI is tailored specifically for Myanmar's social commerce ecosystem:
- Native bilingual support (Burmese / English)
- Township-based shipping matrix covering Yangon and regional transit fees
- Specialized payment slip audit workflow for KBZPay, WavePay, CBPay, and AYA Pay alongside Cash on Delivery (COD)
- Telegram/Messenger bot simulation with instant manual support override ("Live Takeover")
- Dual offline-first architecture (browser localStorage demo mode + Supabase PostgreSQL cloud sync)

## Operating Context

- **Merchants:** Manage products, review order invoices, inspect payment screenshot proof, and generate AI marketing campaigns primarily on desktop or tablet web browsers.
- **Shoppers:** Interact via mobile devices (Telegram bots, Messenger, or responsive mobile web storefronts at `/shop/:shopId`) often on intermittent connections.

## Capabilities and Constraints

- **Core Capabilities:**
  - Onboarding wizard with profile configuration
  - Product catalog CRUD with variants, pricing, inventory alerts, and on-demand wait times
  - Township delivery rate matrix with transit estimations
  - Orders ledger tracking statuses (`pending`, `verifying`, `confirmed`, `completed`, `cancelled`) with payment slip audit modal
  - AI Strategy Desk & Smart Marketing campaign copy generation
  - Interactive Telegram client simulator sandbox
  - SME VIP Live Support room with automated-to-manual chat takeover
  - Public mobile-responsive storefront with "Candy" AI sales chatbot
- **Durable Constraints:**
  - Currency strictly in Myanmar Kyat (MMK)
  - Strict Unicode handling for Burmese script (no terminal encoding corruption)
  - Must strictly preserve all existing fields, components, data models, and tabs
  - Design aesthetic preference: high-end minimalist "Perplexity" UI (font-black headings, generous whitespace, rounded-[32px] containers, and subtle micro-animations)

## Brand Commitments

- **Product Name:** Sales Brain AI
- **Bot Persona:** "Candy" (warm, helpful, and culturally respectful AI sales assistant)
- **Voice & Tone:** Modern, professional, transparent, and approachable for local SME merchants

## Evidence on Hand

- Myanmar township dataset: `src/data/townships.ts`
- Seed state and demo catalog: `src/data/seedState.json` & `src/data/defaultState.ts`
- Existing design specifications: `docs/design.md`
- Supabase schema migrations: `supabase/migrations/20261012000000_initial_schema.sql`

## Product Principles

1. **Zero Social Commerce Friction:** Make the journey from customer chat inquiry to township delivery fee calculation and order generation completely seamless.
2. **Myanmar Operational Fit:** Deeply respect local commercial patterns—mobile wallet screenshot transfers, township-based couriers, and bilingual communication.
3. **Resilient & Offline Capable:** Demo state persists reliably in `localStorage`, and cloud syncing persists seamlessly in Supabase.
4. **Empowering Human-in-the-Loop:** AI automates the heavy lifting, but the merchant retains full oversight to audit payment slips and take over live chats at any moment.

## Accessibility & Inclusion

- Explicit readability rules for Burmese Unicode font rendering and contrast adjustments (`src/index.css`)
- Touch-friendly tap targets and mobile-responsive viewport scaling for simulated chat and storefronts
