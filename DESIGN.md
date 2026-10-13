---
name: Sales Brain AI
description: Curated Conversational Commerce for Independent Merchants
colors:
  primary: "#0069FF"
  primary-hover: "#0052CC"
  primary-light: "#EFF6FF"
  primary-sky: "#70B4FF"
  neutral-dark: "#0A1B2A"
  neutral-bg: "#FAF8F5"
  surface-card: "#FFFFFF"
  surface-card-subtle: "#F4F2EC"
  surface-footer: "#FAF8F5"
  surface-pure: "#FFFFFF"
  border-soft: "#E2E8F0"
  border-subtle: "rgba(226, 232, 240, 0.8)"
  text-primary: "#0A1B2A"
  text-secondary: "#475569"
  text-muted: "#64748B"
  success: "#10B981"
  success-surface: "#ECFDF5"
  success-text: "#047857"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, Cambria, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 5vw, 3.5rem)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Playfair Display, Georgia, Cambria, 'Times New Roman', serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Playfair Display, Georgia, Cambria, 'Times New Roman', serif"
    fontSize: "1.25rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.15em"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-dark:
    backgroundColor: "{colors.neutral-dark}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 24px"
  button-secondary:
    backgroundColor: "{colors.surface-pure}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
---

# Design System: Sales Brain AI

## Overview

**Creative North Star: "The Modern Commerce Command"**

Sales Brain AI adopts an elevated, contemporary software aesthetic inspired by modern SaaS pioneers like Calendly and Perplexity. The design pairs a calming, warm porcelain canvas (`#FAF8F5`) with crisp Midnight Ink typography (`#0A1B2A`), high-voltage Electric Cobalt accents (`#0069FF`), luminous Sky Blue announcement gradients (`#70B4FF`), and generous `rounded-[32px]` containers.

The visual system projects utmost institutional confidence, speed, and precision for Myanmar SME merchants. It elevates chat automation, mobile wallet slip audit (KBZPay, WavePay), and township logistics from manual chaos into a pristine, trustworthy workflow.

**Key Characteristics:**
- **Warm Porcelain Canvas:** A soothing `#FAF8F5` foundational background that eliminates harsh clinical glare while retaining physical presence.
- **Electric Cobalt Accent:** High-energy Royal Azure (`#0069FF`) reserved for primary focal actions, interactive tabs, active highlights, and verified bot states.
- **Luminous Sky Blue Ribbon:** Ethereal `#70B4FF` top announcement bar and soft gradient glow backdrops.
- **Midnight Ink Contrast:** Confident, dark navy-charcoal (`#0A1B2A`) for high-contrast primary CTA buttons, headings, and prominent navigation elements.
- **Perplexity Micro-Aesthetic:** Font-black display headings, increased negative space, `rounded-[32px]` framing, and silky micro-interactions.

---

## Colors

The palette balances clean software vibrancy with grounded, human warmth:

### Primary Accents
- **Electric Cobalt** (`#0069FF`): The signature brand accent. Used for primary CTAs, active tab selections, live bot badges, and interactive controls.
- **Deep Cobalt Hover** (`#0052CC`): The hover/active feedback state for cobalt actions.
- **Ice Blue Tint** (`#EFF6FF`): Soft luminous tint used for selected radio states, active pill fills, and icon pill backings.
- **Sky Ribbon Blue** (`#70B4FF`): Atmospheric banner accent and soft ambient glow gradient layer.

### Neutral & Surfaces
- **Warm Porcelain Canvas** (`#FAF8F5`): Global background canvas across the dashboard, storefront, and landing page.
- **Pure White Surface** (`#FFFFFF`): Elevated content cards, modal windows, and input surfaces.
- **Subtle Surface** (`#F4F2EC`): Secondary container fill and subtle grouping tiles.
- **Midnight Ink** (`#0A1B2A`): Primary text color, bold headings, and authoritative dark CTA buttons ("Get started for free").
- **Slate Secondary** (`#475569`): Descriptive subtitles, metadata labels, and inactive navigation items.
- **Muted Slate** (`#64748B`): Timestamps, placeholder text, and subtle captions.
- **Delicate Hairline Border** (`#E2E8F0` / `stone-200/60`): Clean container definition without visual noise.

### Status & Feedback
- **Slip Verified Emerald** (`#10B981` / text `#047857` / bg `#ECFDF5`): Confirmed payment audit and verified orders.
- **Warning Amber** (`#F59E0B`): Pending reviews and inventory stock alerts.

### Named Rules
- **The Cobalt Focal Rule.** Electric Cobalt (`#0069FF`) is reserved for intentional actions, active navigation items, and positive interactive feedback.
- **The High-Contrast Legibility Rule.** Small text and body copy must never use light blues; body text must lead in Midnight Ink (`#0A1B2A`) or Slate (`#475569`) to guarantee optimal reading comfort and WCAG AA compliance.

---

## Typography

**Display Font:** Playfair Display (Georgia, Cambria, serif)  
**Body Font:** Inter (`ui-sans-serif, system-ui, sans-serif`)  
**Burmese Font:** Noto Sans Myanmar / Pyidaungsu with relaxed leading (`1.65` body, `1.38` headings)  
**Data/Mono Font:** `font-mono` for invoice identifiers, phone numbers, and MMK prices.

### Hierarchy
- **Display** (400, `clamp(2.5rem, 5vw, 3.5rem)`, `line-height: 1.12`, `-0.02em`): Hero headlines and major section greetings.
- **Headline** (400/700, `2.25rem`, `line-height: 1.2`, `-0.01em`): Section titles and workflow highlights.
- **Title** (500/600, `1.25rem`, `line-height: 1.3`): Card headers, product titles, and modal headers.
- **Body** (400, `1rem`, `line-height: 1.6`): Explanatory paragraphs, product descriptions, and user chat messages.
- **Label / Micro** (700, `0.6875rem`, `letter-spacing: 0.15em`, uppercase): Eyebrows, category tags, step indicators, and table column headers.

---

## Layout

- **Max Container:** `max-w-7xl` (1280px) centered with responsive horizontal padding (`px-6` mobile, `px-12` desktop).
- **Rhythm & Spacing:** Generous whitespace with section padding `py-20` to `py-28`.
- **Top Announcement Ribbon:** Full-width fixed/sticky banner with Sky Blue fill (`#70B4FF`), Midnight text (`#0A1B2A`), and interactive action link.
- **Header:** Sticky top navigation with translucent backing `bg-[#FAF8F5]/90 backdrop-blur-sm` and subtle hairline border.

---

## Elevation & Depth

- **Subtle Surface** (`shadow-xs`): Default tactile grounding for buttons and active pills.
- **Elevated Card** (`shadow-sm`): Floating modals, payment slip previews, and dropdown mega menus.
- **Atmospheric Glow:** Subtle sky-blue ambient radial gradient (`bg-gradient-to-b from-[#70B4FF]/25 via-[#DCEBFF]/15 to-transparent`) illuminating key feature showcase frames.

---

## Shapes

- **Buttons & Form Fields:** Precision rounded corners (`rounded-xl` or `rounded-md`).
- **Cards & Dashboard Panels:** Tactile rounded corners (`rounded-2xl` to `rounded-[32px]`).
- **Feature Showcase Frames:** High-end `rounded-[32px]` container styling.
- **Badges & Tabs:** Fully rounded pill shapes (`rounded-full`).

---

## Components

### Buttons
- **Primary Cobalt:** `bg-[#0069FF] hover:bg-[#0052CC] text-white px-6 py-3 rounded-xl font-semibold shadow-xs transition`.
- **Authoritative Midnight Dark:** `bg-[#0A1B2A] hover:bg-[#1E293B] text-white px-6 py-3 rounded-xl font-semibold shadow-xs transition`.
- **Secondary / Outline:** `bg-white hover:bg-slate-50 text-[#0A1B2A] border border-slate-200 px-5 py-2.5 rounded-xl transition`.

### Feature & Workflow Cards
- **Card Container:** `bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-[#0069FF]/40 transition`.
- **Active Feature Icon:** `w-12 h-12 rounded-full bg-[#EFF6FF] text-[#0069FF] flex items-center justify-center`.

### Status Badges & Pills
- **Active / Verified:** `bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-semibold`.
- **Notice / System Pill:** `bg-[#EFF6FF] text-[#0069FF] border border-[#0069FF]/20 rounded-full px-3 py-1 text-xs font-semibold`.

---

## Do's and Don'ts

### Do:
- **Do** anchor the UI with the soothing Warm Porcelain canvas (`#FAF8F5`).
- **Do** use Electric Cobalt (`#0069FF`) for focal calls to action and active highlights.
- **Do** use Midnight Ink (`#0A1B2A`) for dark button alternatives and crisp, legible typography.
- **Do** apply generous whitespace and `rounded-[32px]` containers for hero and showcase frames.
- **Do** preserve relaxed leading and tracking resets on Myanmar (Burmese) text.

### Don't:
- **Don't** use dull, washed-out blues or muddy terracotta.
- **Don't** use pure stark `#000000` text when `#0A1B2A` gives richer, softer readability.
- **Don't** use low-contrast blue body text on white backgrounds.
- **Don't** remove existing fields, order workflows, or slip verification functionality.
