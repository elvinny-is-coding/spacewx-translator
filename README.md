````
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

Meet **Kairo**, your AI space weather guide — a persistent chat assistant embedded in every page, ready to answer questions, explain concepts, and provide real‑time insights tailored to your needs.

---

## Why Aura?

An aura is the visible phenomenon that surrounds the Sun and the Earth during space weather events — the aurora borealis and australis. Our AI‑powered platform brings that same clarity to space weather data, making the invisible visible and the complex understandable.

---

## Challenge Theme Alignment

**Theme: Advance Space Exploration with AI (August 2026)**

Aura directly addresses the challenge's call for solutions that "transform space exploration from data‑heavy to insight‑driven systems":

- **Predictive spacecraft monitoring** — anomaly readiness monitor for satellite subsystems
- **Satellite analysis & anomaly detection** — event timeline correlating flares, CMEs, and storms
- **Public education & engagement** — Mission Control Classroom with live and historical decision simulations
- **Decision support** — mission go/no‑go guidance, risk scorecards, and polar route briefs
- **Data accessibility** — AI‑powered plain‑language translation of cryptic NOAA alert codes

---

## Features

### 🧠 AI‑Powered Intelligence

- **Kairo** — persistent AI assistant in a collapsible sidebar with audience‑specific chat (Public, Educator, Operations)
- **Daily briefings** — precomputed every 12 hours via Cloudflare Workers AI, served instantly with glossary tooltips
- **Suggested prompts** — context‑aware follow‑up questions generated from live data
- **AI evaluation** — classroom decision simulator with deterministic verdict comparison and Kairo‑narrated explanations

### 🌌 Real‑Time Space Weather

- **Kp gauge** — animated arc‑fill proportional to current Kp, with severity color and NOAA G‑scale alignment
- **Solar wind dashboard** — speed and Bz with categorisation (Normal / Elevated / Southward / etc.)
- **R‑scale and S‑scale monitoring** — radio blackout and radiation storm scales displayed alongside G‑scale
- **Status bar** — severity badge, last‑updated timestamp, partial‑data warnings

### 🗺️ Interactive Aurora Map

- **OVATION aurora oval** — bilinearly‑sampled canvas overlay with smooth gradient
- **Geolocation** — tap anywhere or use your location for a "Will I see it?" prediction
- **Calendar export** — download `.ics` files for upcoming aurora windows based on forecast and geomagnetic latitude
- **CME countdown** — live timer with AI‑generated impact narrative for notable Earth‑directed CMEs

### 📊 Historical & Forecast Data

- **7‑day Kp forecast** — trend chart from NOAA's 3‑hour forecast
- **Historical Kp** — 24h / 7d / 30d / custom range chart from Supabase snapshots
- **Event timeline** — solar flares, CMEs, geomagnetic storms, radiation storms, and Kp spikes
- **Storm post‑mortem reports** — AI‑generated incident debriefs automatically created when a storm ends
- **Active alerts** — click‑to‑expand detail modals with full NOAA alert messages

### 🛠️ Operations Center

- **Mission Window Advisor** — go/no‑go recommendations for 6 mission types (CubeSat Launch, HF Operation, Balloon Flight, Aurora Photography, Satellite Maintenance, Telescope Observation)
- **Mission Impact Simulator** — custom mission profiles with time window, altitude, risk tolerance, and AI risk analysis
- **Operational Risk Scorecard** — 5‑system risk matrix (HF Communications, GNSS, LEO Satellite Drag, Power Grid, Polar Aviation)
- **Anomaly Readiness Monitor** — spacecraft subsystem readiness (GNSS, Star Tracker, Communications, Drag, Radiation SEU)
- **Polar Route Brief** — dispatcher‑facing route status with hazard analysis and alternatives
- **HF Band Propagation** — band‑by‑band propagation assessment for ham radio operators

### 🎓 Mission Control Classroom

- **Role‑based decision simulation** — students take on operational roles (Satellite Operator, Flight Dispatcher, Mission Planner, Ham Radio Operator, ISS EVA Planner)
- **Historical scenario library** — curated events including the Gannon Storm, Halloween Storms, Quebec Blackout, Starlink launch loss, and quiet‑but‑tempting days
- **Live data mode** — practice with today's actual space weather conditions
- **Deterministic evaluation** — student choices are compared against the same operational logic used by the risk scorecard; Kairo explains the reasoning

### ⚙️ Custom Alert Thresholds

- **Personal thresholds** — set limits for Kp, solar wind speed, and Bz
- **Persistent storage** — stored in Supabase with anonymous device ID
- **Presets** — educational preset thresholds with descriptions
- **Breach banner** — solar‑amber alert when conditions cross your defined limits

---

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

### AI Design Principles
- **AI narrates, doesn't invent** — all safety‑critical decisions are made by deterministic functions derived from NOAA scales
- **Pre‑filter before prompting** — raw alerts and flares are deduplicated and classified before reaching the LLM
- **Structural guardrails** — rules like "never say no significant impacts during an X‑class flare" are embedded in system prompts
- **Cost efficiency** — summaries precomputed and cached; per‑user chat uses free‑tier Cloudflare models
- **Resilience** — multi‑provider fallback chain (Cloudflare → watsonx → deterministic)
- **Verifiable correctness** — classroom evaluations and risk scorecards compare student/operator choices against deterministic ground truth, not AI opinion

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, React 19, TypeScript, Turbopack) |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) |
| AI (primary) | Cloudflare Workers AI (Llama 3.2‑1B, Llama 3.1‑8B, Mistral Small 3.1‑24B) |
| AI (fallback) | IBM watsonx (Mistral Small via Chat API) |
| AI (backup) | Groq (Llama 3.1‑8B Instant) |
| Styling | Tailwind CSS v4, shadcn/ui |
| Charts | Recharts |
| Maps | Leaflet + react‑leaflet |
| Job Scheduling | GitHub Actions (cron every 12 hours) |
| Notifications | Sonner (toasts) |
| Authentication | Anonymous device ID (UUID via localStorage) |

---

## IBM Bob Usage

**IBM Bob** served as the primary development environment throughout the project. The platform was used for:

- **Code scaffolding and generation** — initial project structure, API route handlers, React components, TypeScript interfaces
- **Debugging and troubleshooting** — NOAA API endpoint changes (deprecation of solar‑wind‑1‑day.json, migration to RTSW products), infinite refresh loops caused by Next.js caching bugs, nested button hydration errors in shadcn UI dialogs, Supabase Row‑Level Security permission issues
- **AI prompt design** — multi‑audience briefing prompts, guardrails, context‑building logic, alert triage prompts, classroom evaluation prompts
- **Data pipeline architecture** — snapshot/cron/cache architecture, DONKI event backfill strategy, rate‑limiting design
- **Accessibility audit** — ARIA labels, keyboard navigation, focus management, reduced‑motion support
- **Feature ideation** — verification and validation of feature proposals against real user needs and existing data constraints

Bob's IDE and CLI shell were used for all development, testing, and deployment activities.

---

## Data Sources

| Source | Endpoint |
|--------|----------|
| NOAA SWPC – Planetary K‑index | `noaa-planetary-k-index.json` |
| NOAA SWPC – Kp forecast | `noaa-planetary-k-index-forecast.json` |
| NOAA SWPC – Solar wind plasma (RTSW) | `rtsw_wind_1m.json` |
| NOAA SWPC – Solar wind magnetic field (RTSW) | `rtsw_mag_1m.json` |
| NOAA SWPC – Alerts | `alerts.json` |
| NOAA SWPC – NOAA Scales (G/S/R) | `noaa-scales.json` |
| NOAA SWPC – OVATION aurora model | `ovation_aurora_latest.json` |
| NOAA SWPC – ICAO Space Weather Advisories | `icao-space-weather-advisories.json` |
| NASA DONKI – Flares | `DONKI/FLR` |
| NASA DONKI – CMEs | `DONKI/CME` |
| NASA DONKI – Geomagnetic storms | `DONKI/GST` |

All NOAA endpoints are public and require no API key. NASA DONKI requires a free API key (register at [api.nasa.gov](https://api.nasa.gov)).

---

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
````

### Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Cloudflare Workers AI
CLOUDFLARE_WORKER_AI_API_KEY=cfat_...
CLOUDFLARE_WORKER_AI_ACCOUNT_ID=...

# IBM watsonx (fallback)
WATSONX_API_KEY=...
WATSONX_PROJECT_ID=...
WATSONX_MODEL_ID=mistralai/mistral-small-3-1-24b-instruct-2503

# NASA DONKI
NASA_API_KEY=...

# GitHub Actions Cron Secret
CRON_SECRET=...
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase Setup

Create the following tables in your Supabase project:

- `space_weather_snapshots` – historical Kp data
- `daily_summaries` – AI‑generated briefings + suggested prompts
- `latest_alerts` – cached NOAA alerts (singleton)
- `latest_ovation` – cached OVATION aurora grid (singleton)
- `donki_events` – NASA DONKI flare/CME/storm history
- `user_thresholds` – custom alert thresholds
- `risk_scorecards` – cached risk assessments
- `mission_advisories` – cached mission advisories
- `postmortems` – AI‑generated storm incident reports

Run the appropriate SQL grants for the service role:

```sql
GRANT ALL ON public.space_weather_snapshots TO service_role;
GRANT ALL ON public.daily_summaries TO service_role;
GRANT ALL ON public.latest_alerts TO service_role;
GRANT ALL ON public.latest_ovation TO service_role;
GRANT ALL ON public.donki_events TO service_role;
GRANT ALL ON public.user_thresholds TO service_role;
GRANT ALL ON public.risk_scorecards TO service_role;
GRANT ALL ON public.mission_advisories TO service_role;
GRANT ALL ON public.postmortems TO service_role;
```

### Deploy to Vercel

1. Push your repository to GitHub.
2. Connect the repo to Vercel.
3. Set all environment variables in the Vercel project settings.
4. Deploy.

### GitHub Actions Cron

The `.github/workflows/snapshot.yml` workflow runs every 12 hours and calls:

- `POST /api/cron/snapshot`
- `POST /api/cron/daily-summaries`
- `POST /api/cron/sync-donki`
- `POST /api/cron/storm-postmortem`

Set `CRON_SECRET` in GitHub Secrets. The `backfill-donki.yml` workflow can be triggered manually for a one‑time 2‑year DONKI backfill.

---

## Project Structure

```text
aura/
├── app/
│   ├── api/               # API routes (spacewx, ai-summary, chat, snapshots, events, ovation, alerts, thresholds, cron, health, risk-scorecard, mission-advisory, hf-advisory, mission-impact, polar-route-brief, anomaly-readiness, classroom)
│   ├── aurora/            # Aurora map page
│   ├── forecast/          # Forecast + historical charts page
│   ├── events/            # Event timeline + alerts page
│   ├── alerts/            # Custom thresholds page
│   ├── ops/               # Operations Center page
│   ├── classroom/         # Mission Control Classroom page
│   ├── layout.tsx
│   ├── page.tsx           # Overview page
│   └── globals.css
├── components/
│   ├── layout/            # NavBar, AiSidebar, ClientLayout
│   ├── classroom/         # Role picker, scenario picker, briefing, decision panel, evaluation reveal
│   ├── ui/                # shadcn/ui primitives
│   └── ...                # Feature components
├── data/
│   └── scenarios/         # Historical classroom scenario fixtures (9 scenarios)
├── hooks/                 # Custom hooks
├── lib/
│   ├── ai/                # AI clients and prompts
│   ├── spacewx/           # NOAA/NASA fetchers, normalizers, cache
│   ├── supabase/          # Supabase client
│   └── ...                # Utilities
├── providers/             # React context providers
├── types/                 # TypeScript types
├── config/                # Constants
├── scripts/               # Backfill scripts
├── .github/workflows/     # GitHub Actions
├── public/                # Static assets (logo, favicon)
└── README.md
```

---

## Demo Video

[▶️ Watch the demo (≤ 3 minutes)](https://your-demo-video-link.com)

The video showcases:

- The AI‑powered hero briefing for all three audiences
- Interactive aurora map with geolocation and tap‑to‑check
- Operations Center with mission advisor, risk scorecard, and anomaly readiness monitor
- Mission Control Classroom with role selection, historical scenario, decision, and Kairo evaluation
- Kairo, the AI assistant, answering follow‑up questions
- Glossary tooltips explaining space‑weather terminology
- Custom alert threshold creation

---

## Team

Built for the IBM AI Builders Challenge.

## License

MIT
