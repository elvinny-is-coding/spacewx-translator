# Aura – AI Space Weather Intelligence

**Real‑time aurora forecasts, solar storm tracking, and space weather insights powered by AI.**

Built for the **IBM AI Builders Challenge — August 2026: Advance Space Exploration with AI**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)](https://vercel.com/)

---

## Mission

Aura bridges the gap between raw space weather data and human understanding. Using advanced AI models, we transform complex NOAA and NASA data into:

- **Plain‑language briefings** for the public and aurora chasers
- **Educational content** for teachers and students
- **Operational intelligence** for satellite operators, pilots, and radio engineers

## Why Aura?

An aura is the visible phenomenon that surrounds the Sun and the Earth during space weather events — the aurora borealis and australis. Our AI‑powered platform brings that same clarity to space weather data, making the invisible visible and the complex understandable.

Meet **Kairo**, your AI space weather guide embedded in every page — ready to answer questions, explain concepts, and provide real‑time insights tailored to your needs.

## Challenge Theme Alignment

**Theme: Advance Space Exploration with AI (August 2026)**

Aura directly addresses the challenge's call for solutions that "transform space exploration from data‑heavy to insight‑driven systems":

- **Predictive spacecraft monitoring** – custom alert thresholds for Kp, solar wind speed, and Bz
- **Satellite analysis & anomaly detection** – event timeline correlating flares, CMEs, and geomagnetic storms
- **Public education & engagement** – audience‑tailored AI summaries, interactive aurora map, calendar integration
- **Decision support** – operational briefs with G/R/S‑scale reconciliation and impact assessment
- **Data accessibility** – AI‑powered plain‑language translation of cryptic NOAA alert codes

## Features

### AI‑Powered Briefings

- **Kairo** – persistent AI assistant in a collapsible sidebar, available on every page
- **Three audience modes** – Public, Educator, and Operations — each with tailored language and depth
- **Daily summaries** – precomputed every 12 hours via Cloudflare Workers AI, served instantly with zero per‑user token cost
- **Suggested prompts** – context‑aware follow‑up questions generated from live data
- **Glossary tooltips** – 20+ space‑weather terms with hover definitions, keyboard‑accessible

### Real‑Time Space Weather

- **Kp gauge** – animated arc‑fill proportional to current Kp, with severity color and NOAA G‑scale alignment
- **Solar wind dashboard** – speed and Bz with categorisation (Normal / Elevated / Southward / etc.)
- **R‑scale and S‑scale monitoring** – radio blackout and radiation storm scales displayed alongside G‑scale
- **Status bar** – severity badge, last‑updated timestamp, partial‑data warnings

### Interactive Aurora Map

- **OVATION aurora oval** – bilinearly‑sampled canvas overlay with smooth gradient
- **Geolocation** – tap anywhere or use your location for a "Will I see it?" prediction
- **Calendar export** – download `.ics` files for upcoming aurora windows based on forecast and geomagnetic latitude
- **Oval overlay** – simplified Kp‑based oval boundary on the map

### Historical & Forecast Data

- **7‑day Kp forecast** – trend chart from NOAA's 3‑hour forecast
- **Historical Kp** – 24h / 7d / 30d / custom range chart from Supabase snapshots
- **Event timeline** – solar flares, CMEs, geomagnetic storms, radiation storms, and Kp spikes — from DONKI (2‑year backfill) and NOAA alerts
- **Active alerts** – click‑to‑expand detail modals with full NOAA alert messages

### Custom Alert Thresholds

- **Personal thresholds** – set limits for Kp, solar wind speed, and Bz
- **Persistent storage** – stored in Supabase with anonymous device ID
- **Presets** – educational preset thresholds with descriptions
- **Breach banner** – solar‑amber alert when conditions cross your defined limits

## AI Architecture

### Daily Briefing Pipeline (cron‑driven)

1. GitHub Actions workflow runs every 12 hours → `POST /api/cron/daily-summaries`
2. Fetches NOAA alerts, Kp, solar wind, DONKI flares/CMEs, and G/R/S scales
3. Pre‑filters notable events (X‑class / M5+ flares, fast or Earth‑directed CMEs)
4. Builds structured `DailyBriefingInput` with guardrails
5. Generates audience‑specific summaries via **Cloudflare Workers AI** (primary) → **IBM watsonx** (fallback) → deterministic templates
6. Stores summaries + suggested prompts in Supabase `daily_summaries`

### On‑Demand Chat

- `POST /api/chat` receives user questions with conversation history
- Context block built from pre‑filtered events, scales, and alerts
- Per‑audience model selection (Llama 3.2‑1B / 3.1‑8B / Mistral Small 3.1‑24B) via Cloudflare Workers AI
- Rate‑limited (10 requests/minute/IP) with `X‑RateLimit‑*` headers

### Key AI Principles

- **Pre‑filter before prompting** – raw alerts and flares are deduplicated and classified before reaching the LLM
- **Structural guardrails** – rules like "never say no significant impacts during an X‑class flare" are embedded in the system prompt
- **Cost efficiency** – summaries precomputed and cached; per‑user chat uses free‑tier Cloudflare models
- **Resilience** – multi‑provider fallback chain (Cloudflare → watsonx → deterministic)

## Tech Stack

| Layer          | Technology                                                                |
| -------------- | ------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, React 19, TypeScript, Turbopack)                  |
| Hosting        | Vercel                                                                    |
| Database       | Supabase (PostgreSQL)                                                     |
| AI (primary)   | Cloudflare Workers AI (Llama 3.2‑1B, Llama 3.1‑8B, Mistral Small 3.1‑24B) |
| AI (fallback)  | IBM watsonx (Mistral Small via Chat API)                                  |
| AI (backup)    | Groq (Llama 3.1‑8B Instant)                                               |
| Styling        | Tailwind CSS v4, shadcn/ui                                                |
| Charts         | Recharts                                                                  |
| Maps           | Leaflet + react‑leaflet                                                   |
| Job Scheduling | GitHub Actions (cron every 12 hours)                                      |
| Notifications  | Sonner (toasts)                                                           |
| Authentication | Anonymous device ID (UUID via localStorage)                               |

## IBM Bob Usage

**IBM Bob** served as the primary development environment throughout the project. While the final code was developed with Bob's assistance, the platform was used for:

- **Code scaffolding and generation** – initial project structure, API route handlers, React components, TypeScript interfaces
- **Debugging and troubleshooting** – NOAA API endpoint changes (deprecation of solar‑wind‑1‑day.json, migration to RTSW products), infinite refresh loops caused by Next.js caching bugs, nested button hydration errors in shadcn UI dialogs, Supabase Row‑Level Security permission issues
- **AI prompt design** – multi‑audience briefing prompts, guardrails, context‑building logic, alert triage prompts
- **Data pipeline architecture** – snapshot/cron/cache architecture, DONKI event backfill strategy, rate‑limiting design
- **Accessibility audit** – ARIA labels, keyboard navigation, focus management, reduced‑motion support

Bob's IDE and CLI shell were used for all development, testing, and deployment activities.

## Data Sources

| Source                                       | Endpoint                               |
| -------------------------------------------- | -------------------------------------- |
| NOAA SWPC – Planetary K‑index                | `noaa-planetary-k-index.json`          |
| NOAA SWPC – Kp forecast                      | `noaa-planetary-k-index-forecast.json` |
| NOAA SWPC – Solar wind plasma (RTSW)         | `rtsw_wind_1m.json`                    |
| NOAA SWPC – Solar wind magnetic field (RTSW) | `rtsw_mag_1m.json`                     |
| NOAA SWPC – Alerts                           | `alerts.json`                          |
| NOAA SWPC – NOAA Scales (G/S/R)              | `noaa-scales.json`                     |
| NOAA SWPC – OVATION aurora model             | `ovation_aurora_latest.json`           |
| NASA DONKI – Flares                          | `DONKI/FLR`                            |
| NASA DONKI – CMEs                            | `DONKI/CME`                            |
| NASA DONKI – Geomagnetic storms              | `DONKI/GST`                            |

All NOAA endpoints are public and require no API key. NASA DONKI requires a free API key (register at [api.nasa.gov](https://api.nasa.gov)).

## Getting Started

### Prerequisites

- Node.js ≥ 24
- npm ≥ 10
- A [Supabase](https://supabase.com) project
- A [Cloudflare](https://cloudflare.com) account (Workers AI)
- A [GitHub](https://github.com) account (for Actions)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/aura.git
cd aura
npm install
```

### Environment Variables

## Create a .env.local file:

# Supabase

NEXT*PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret*...
SUPABASE*PUBLISHABLE_KEY=sb_publishable*...

# Cloudflare Workers AI

CLOUDFLARE*WORKER_AI_API_KEY=cfat*...
CLOUDFLARE_WORKER_AI_ACCOUNT_ID=...

# IBM watsonx (fallback)

WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
WATSONX_MODEL_ID=mistralai/mistral-small-3-1-24b-instruct-2503

# NASA DONKI

NASA_API_KEY=...

# GitHub Actions Cron Secret

CRON_SECRET=...

### Run Locally

```bash
npm run dev
```

Open http://localhost:3000.

## Supabase Setup

Create the following tables in your Supabase project:

- `space_weather_snapshots` — Historical Kp data
- `daily_summaries` — AI-generated briefings + suggested prompts
- `latest_alerts` — Cached NOAA alerts (singleton)
- `latest_ovation` — Cached OVATION aurora grid (singleton)
- `donki_events` — NASA DONKI flare/CME/storm history
- `user_thresholds` — Custom alert thresholds

Run the appropriate SQL grants for the service role:

```sql
GRANT ALL ON public.space_weather_snapshots TO service_role;
GRANT ALL ON public.daily_summaries TO service_role;
GRANT ALL ON public.latest_alerts TO service_role;
GRANT ALL ON public.latest_ovation TO service_role;
GRANT ALL ON public.donki_events TO service_role;
GRANT ALL ON public.user_thresholds TO service_role;
```

---

## Deploy to Vercel

1. Push your repository to GitHub.
2. Connect the repository to Vercel.
3. Set all required environment variables in the Vercel project settings.
4. Deploy.

---

## GitHub Actions Cron

The `.github/workflows/snapshot.yml` workflow runs every **12 hours** and calls:

- `POST /api/cron/snapshot`
- `POST /api/cron/daily-summaries`
- `POST /api/cron/sync-donki`

Set `CRON_SECRET` in **GitHub Secrets**.

The `backfill-donki.yml` workflow can be triggered manually to perform a **one-time two-year DONKI backfill**.

---

## Project Structure

```text
aura/
├── app/
│   ├── api/               # API routes (spacewx, ai-summary, chat, snapshots, events, ovation, alerts, thresholds, cron, health)
│   ├── aurora/            # Aurora map page
│   ├── forecast/          # Forecast + historical charts page
│   ├── events/            # Event timeline + alerts page
│   ├── alerts/            # Custom thresholds page
│   ├── layout.tsx
│   ├── page.tsx           # Overview page
│   └── globals.css
├── components/
│   ├── layout/            # NavBar, AiSidebar, ClientLayout
│   ├── ui/                # shadcn/ui primitives
│   └── ...                # Feature components
├── hooks/                 # Custom hooks
├── lib/
│   ├── ai/                # AI clients and prompts
│   ├── spacewx/           # NOAA/NASA fetchers, normalizers, cache
│   ├── supabase/          # Supabase client
│   └── ...                # Utilities
├── providers/
├── types/
├── config/
├── scripts/
├── .github/workflows/
├── public/
└── README.md
```

---

## Demo Video

▶️ **Watch the demo (≤ 3 minutes)**

The video showcases:

- AI-powered hero briefing for all three audiences
- Interactive aurora map with geolocation and tap-to-check
- Historical Kp chart and event timeline
- Custom alert threshold creation
- Calendar export for upcoming aurora events
- **Kairo**, the AI assistant, answering follow-up questions
- Glossary tooltips explaining space-weather terminology

---

## Team

Built for the **IBM AI Builders Challenge**.

---

## License

MIT

---

### Notes

The `README.md` has been fully updated with:

- Aura rebrand
- Kairo AI assistant
- Complete feature set
- Current technology stack
- AI architecture
- IBM AI Builders Challenge submission context

Ready for review.
