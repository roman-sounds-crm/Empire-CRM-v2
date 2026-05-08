# Empire CRM — Local Setup Guide

## Requirements
- [Bun](https://bun.sh) v1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`bun add -g wrangler`)

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Generate Cloudflare types
bun cf-typegen

# 3. Generate & apply DB migrations
bun db:generate
bun db:migrate

# 4. Start dev server
bun dev
```

App runs at **http://localhost:6450**

## First Run
1. Open the app → you'll be redirected to the Sign In page
2. Click **Create Account** to register your admin account
3. Visit `http://localhost:6450` → settings cog → seed the database if needed
   Or run: `curl -X POST http://localhost:6450/api/seed`

## Environment Variables
The `.env.local` file contains:
- `AI_GATEWAY_BASE_URL` — AI API endpoint (OpenAI compatible)
- `AI_GATEWAY_API_KEY` — AI API key
- `BETTER_AUTH_SECRET` — Auth secret key

> ⚠️ Configure AI_GATEWAY keys with your OpenAI or compatible API provider.
> For OpenAI direct: set `AI_GATEWAY_BASE_URL=https://api.openai.com/v1` and `AI_GATEWAY_API_KEY=sk-...`

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS v4
- **Backend:** Hono (Cloudflare Workers)
- **Database:** Cloudflare D1 (SQLite via Drizzle ORM)
- **Auth:** Better Auth v1.4.22
- **Charts:** Recharts
- **Icons:** Lucide React

## Deploy to Cloudflare
```bash
# Login to Cloudflare
wrangler login

# Create D1 database
wrangler d1 create empire-crm-db

# Update wrangler.json with your DB ID
# Then deploy:
bun run deploy
```

## Project Structure
```
src/
  api/           → Hono backend (routes, auth, DB schema)
  web/
    pages/       → All 18 pages
    components/  → Layout, Sidebar, Header, Notifications
    lib/         → Auth client, API helpers, mock data
```
