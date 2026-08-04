# Space Weather Translator

AI-powered insights for space weather — turning complex NOAA/NASA data into plain-language briefings, aurora forecasts, and real-time alerts.

> Built for the IBM AI Builders Challenge — August 2026: Advance Space Exploration with AI.

![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

---

# Table of Contents

- [Space Weather Translator](#space-weather-translator)
- [Table of Contents](#table-of-contents)
- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [AI Architecture \& Approach](#ai-architecture--approach)
  - [Daily Briefing Pipeline](#daily-briefing-pipeline)
  - [On-Demand Chat](#on-demand-chat)
  - [AI Summary Card](#ai-summary-card)
  - [Key AI Principles](#key-ai-principles)
    - [Pre-filter before prompting](#pre-filter-before-prompting)
    - [Structural guardrails](#structural-guardrails)
    - [Cost efficiency](#cost-efficiency)
- [Challenge Theme Alignment](#challenge-theme-alignment)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [IBM Bob Usage](#ibm-bob-usage)
- [Data Sources](#data-sources)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run Locally](#run-locally)
  - [Supabase Tables](#supabase-tables)
  - [Deploy](#deploy)
  - [GitHub Actions](#github-actions)
- [Project Structure](#project-structure)
- [Demo Video](#demo-video)
- [Team](#team)
- [License](#license)

---

# Problem Statement

Space weather — solar flares, coronal mass ejections (CMEs), geomagnetic storms, and radiation events — directly impacts satellite operations, astronaut safety, radio communications, power grids, and aurora visibility.

Despite this, publicly available space weather data remains cryptic, fragmented, and inaccessible to non-specialists.

Mission operators, educators, amateur radio operators, and aurora chasers all face the same problem: raw NOAA alerts and numeric indices don't tell a story.

The gap between:

> "Kp index is 4"

and

> "Should I worry about my satellite's orbit tonight?"

is filled by domain expertise that most people lack.

---

# Solution Overview

Space Weather Translator is an AI-powered web application that turns raw, multi-source space weather data into audience-tailored, actionable insights.

Features include:

- Current Kp index dashboard
- Solar wind monitoring
- Aurora probability
- Active NOAA alerts
- AI-generated briefings (Cloudflare Workers AI / IBM watsonx)
- Interactive aurora map
- Historical charts
- Event timeline
- Alert thresholds
- Calendar exports

The goal is a single source of truth that transforms complex space weather data into understandable decision support.

---

# AI Architecture & Approach

## Daily Briefing Pipeline

Runs every 12 hours using GitHub Actions.

Pipeline:

1. Calls `/api/cron/daily-summaries`
2. Downloads:
   - NOAA alerts
   - Kp index
   - Solar wind
   - DONKI flares
   - DONKI CMEs
   - NOAA G/R/S scales
3. Filters notable events
4. Builds audience-specific prompts
5. Sends prompts to:
   - Cloudflare Workers AI
   - IBM watsonx (fallback)
6. Stores summaries in Supabase

---

## On-Demand Chat

The public API receives:

- User question
- Current space weather context
- Conversation history

Models generate audience-specific responses while prompt guardrails reduce hallucinations.

Conversation history is stored in `sessionStorage`.

---

## AI Summary Card

Frontend behavior:

1. Load cached summary from Supabase
2. If unavailable:
   - Generate instant rule-based summary
3. Allow follow-up AI chat

---

## Key AI Principles

### Pre-filter before prompting

Raw NOAA data is deduplicated and summarized before reaching the LLM.

### Structural guardrails

Examples:

- Never claim "no significant impacts" during an X-class flare.
- Reconcile quiet Kp with radiation storms.

### Cost efficiency

- Cached summaries
- Lightweight Cloudflare models
- Under 50k tokens/day

---

# Challenge Theme Alignment

**Theme**

> Advance Space Exploration with AI

Project goals include:

- Predictive spacecraft monitoring
- Satellite anomaly detection
- Collision awareness
- Public education
- Decision support
- Accessibility of space weather data

---

# Features

- AI-generated briefings
- Three audience modes
- Interactive aurora map
- Live Kp gauge
- 7-day Kp forecast
- Historical Kp charts
- Event timeline
- NOAA alerts
- User-defined alert thresholds
- Calendar (.ics) exports
- Cached data layer
- Graceful degradation
- Responsive dark UI

---

# Tech Stack

| Layer         | Technology            |
| ------------- | --------------------- |
| Framework     | Next.js 16            |
| React         | React 19              |
| Language      | TypeScript            |
| Database      | Supabase PostgreSQL   |
| AI            | Cloudflare Workers AI |
| Fallback AI   | IBM watsonx           |
| Backup AI     | Groq                  |
| Styling       | Tailwind CSS v4       |
| Components    | shadcn/ui             |
| Charts        | Recharts              |
| Maps          | Leaflet               |
| Scheduler     | GitHub Actions        |
| Notifications | Sonner                |
| Hosting       | Vercel                |

---

# IBM Bob Usage

IBM Bob was used throughout development for:

- Code scaffolding
- React components
- API routes
- TypeScript interfaces
- Debugging
- NOAA API migrations
- Next.js caching bugs
- Hydration issues
- Supabase permissions
- AI prompt engineering
- Data pipeline planning

Bob IDE and CLI were used for development, testing, and deployment.

---

# Data Sources

| Source              | Endpoint                             |
| ------------------- | ------------------------------------ |
| NOAA K-index        | noaa-planetary-k-index.json          |
| NOAA Forecast       | noaa-planetary-k-index-forecast.json |
| NOAA Solar Wind     | rtsw_wind_1m.json                    |
| NOAA Magnetic Field | rtsw_mag_1m.json                     |
| NOAA Alerts         | alerts.json                          |
| NOAA Scales         | noaa-scales.json                     |
| NOAA Aurora         | ovation_aurora_latest.json           |
| NASA DONKI Flares   | DONKI/FLR                            |
| NASA DONKI CMEs     | DONKI/CME                            |
| NASA DONKI Storms   | DONKI/GST                            |

NOAA APIs require no key.

NASA DONKI requires a free API key.

---

# Getting Started

## Prerequisites

- Node.js ≥ 24
- npm ≥ 10
- Supabase
- Cloudflare account
- GitHub account

---

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/spacewx-translator.git

cd spacewx-translator

npm install
```

---

## Environment Variables

Create `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PUBLISHABLE_KEY=

# Cloudflare Workers AI
CLOUDFLARE_WORKER_AI_API_KEY=
CLOUDFLARE_WORKER_AI_ACCOUNT_ID=

# IBM watsonx
WATSONX_API_KEY=
WATSONX_PROJECT_ID=
WATSONX_MODEL_ID=mistralai/mistral-small-3-1-24b-instruct-2503

# NASA
NASA_API_KEY=

# GitHub Actions
CRON_SECRET=
```

---

## Run Locally

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## Supabase Tables

Create:

- space_weather_snapshots
- daily_summaries
- latest_alerts
- latest_ovation
- donki_events
- user_thresholds

Enable:

- pg_net
- pg_cron

---

## Deploy

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables
4. Deploy

---

## GitHub Actions

Runs every 12 hours:

```
POST /api/cron/snapshot

POST /api/cron/daily-summaries

POST /api/cron/sync-donki
```

---

# Project Structure

```text
spacewx-translator/
├── app/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── hooks/
├── lib/
│   ├── ai/
│   ├── spacewx/
│   ├── supabase/
│   └── ...
├── types/
├── config/
├── scripts/
├── .github/workflows/
├── public/
└── README.md
```

---

# Demo Video

Showcase includes:

- AI briefings
- Aurora map
- Historical charts
- Event timeline
- Custom alerts
- Calendar exports
- AI follow-up chat

---

# Team

**Your Name**

Developer • AI Integration • Full Stack

(Add additional team members if needed.)

---

# License

MIT © 2026 Space Weather Translator

Built with ❤️ for the IBM AI Builders Challenge.
