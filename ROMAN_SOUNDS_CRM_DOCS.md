# Roman Sounds CRM — Full Project Documentation

**Project:** Roman Sounds Management Tool  
**Owner:** Randy Delgado — DJ Randy Roman  
**Live URL:** https://manage.romansounds.com  
**Platform:** Cloudflare Workers + D1 SQLite  
**Dev Port:** 6450  
**Last Updated:** May 2026

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [API Routes](#api-routes)
5. [Frontend Pages & Routes](#frontend-pages--routes)
6. [Third-Party Integrations](#third-party-integrations)
7. [Environment Variables](#environment-variables)
8. [All Implementations](#all-implementations)
9. [Bug Fixes Applied](#bug-fixes-applied)
10. [Known Issues & Limitations](#known-issues--limitations)
11. [Key Files Reference](#key-files-reference)
12. [Client Portal System](#client-portal-system)
13. [Email System](#email-system)
14. [Settings System](#settings-system)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Cloudflare Workers (edge) |
| Database | Cloudflare D1 (SQLite) |
| ORM | Drizzle ORM |
| API Framework | Hono.js |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + custom `empire-card` design system |
| Auth | better-auth (email/password) |
| Payments | Stripe (Checkout + Webhooks) |
| SMS | Twilio |
| Email | Resend API |
| AI | OpenAI or Compatible API |
| PDF | Puppeteer / PDF generation route |
| Routing | Wouter |
| Build Tool | Bun |
| Billing Plugin | Autumn (better-auth plugin) |

---

## Project Structure

```
empire-crm/
├── src/
│   ├── api/
│   │   ├── auth.ts                    # better-auth config + Autumn billing plugin
│   │   ├── index.ts                   # Hono app entrypoint, all route mounting
│   │   ├── middleware/
│   │   │   └── authentication.ts      # Session auth middleware
│   │   ├── database/
│   │   │   ├── schema.ts              # All Drizzle table definitions
│   │   │   ├── auth-schema.ts         # better-auth user/session tables
│   │   │   └── index.ts               # DB export
│   │   └── routes/
│   │       ├── ai.ts                  # AI revision/generation endpoints
│   │       ├── bootstrap.ts           # First-run admin setup
│   │       ├── email.ts               # Resend email sending (portal, contract, invoice)
│   │       ├── events.ts              # Events CRUD + custom logic
│   │       ├── generic.ts             # Generic CRUD factory (contracts, invoices, etc.)
│   │       ├── leads.ts               # Leads CRUD
│   │       ├── messaging.ts           # SMS send (Twilio) + email relay
│   │       ├── pdf.ts                 # PDF generation
│   │       ├── portal.ts              # Full client portal API
│   │       ├── seed.ts                # Dev data seeding
│   │       └── stripe.ts             # Stripe checkout + webhook handler
│   └── web/
│       ├── app.tsx                    # React router, all page routes
│       ├── main.tsx                   # React entry point
│       ├── components/
│       │   ├── AdminGuard.tsx         # Role-based route protection
│       │   ├── layout/
│       │   │   ├── Header.tsx         # Top bar + notifications bell
│       │   │   ├── Layout.tsx         # Main page layout wrapper
│       │   │   ├── NotificationsPanel.tsx  # Slide-out notifications
│       │   │   └── Sidebar.tsx        # Left nav sidebar
│       │   ├── provider.tsx           # React context providers
│       │   └── ui/
│       │       ├── CommandPalette.tsx # ⌘K global search
│       │       ├── Toast.tsx          # Toast notification component
│       │       └── ...
│       ├── lib/
│       │   ├── api.ts                 # Fetch wrapper (api.get/post/put/del)
│       │   ├── auth.ts                # better-auth client
│       │   ├── mock-data.ts           # Fallback mock data
│       │   └── toast.ts              # Toast helper
│       └── pages/
│           ├── dashboard.tsx          # Main dashboard — stats, events, leads
│           ├── events.tsx             # Events management + portal link sending
│           ├── leads.tsx              # Lead pipeline
│           ├── contracts.tsx          # Contract builder + PDF send
│           ├── invoices.tsx           # Invoice management + Stripe payment
│           ├── appointments.tsx       # Appointment scheduling
│           ├── calendar.tsx           # Calendar view (month + day)
│           ├── contractors.tsx        # Contractor roster
│           ├── team.tsx               # Team management (uses /contractors API)
│           ├── messaging.tsx          # SMS/email messaging hub
│           ├── packages.tsx           # DJ service packages
│           ├── song-requests.tsx      # Song request queue
│           ├── workflows.tsx          # Automation workflows
│           ├── analytics.tsx          # Charts + business analytics
│           ├── customers.tsx          # Customer CRM view
│           ├── forms.tsx              # Booking form builder
│           ├── settings.tsx           # Account settings (all tabs functional)
│           ├── sign-in.tsx            # Auth page
│           ├── bootstrap.tsx          # First-run admin setup page
│           └── portal/
│               ├── index.tsx          # Client portal (public, token-based)
│               ├── sign.tsx           # Contract signature page
│               ├── pay.tsx            # Invoice payment page
│               └── requests.tsx       # Song requests (portal-side)
├── website.config.json                # App config
├── .env.local                         # All secrets (not committed)
├── wrangler.json                      # Cloudflare Workers config
└── vite.config.ts                     # Vite build config
```

---

## Database Schema

All tables use Cloudflare D1 (SQLite) via Drizzle ORM. Primary keys are `nanoid()` strings.

### `events`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | nanoid |
| title | text | |
| type | text | wedding, quinceanera, corporate, etc. |
| date | text | |
| time | text | |
| venue | text | |
| status | text | pending, confirmed, completed, cancelled |
| client_name | text | |
| client_email | text | nullable |
| client_phone | text | nullable |
| value | real | dollar amount |
| contract_signed | boolean | |
| deposit_paid | boolean | |
| notes | text | nullable |
| package_id | text | FK to packages |
| contractor_id | text | FK to contractors |
| portal_token | text | linked portal token |
| created_at | text | |
| updated_at | text | |

### `leads`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text | |
| email | text | |
| phone | text | nullable |
| event | text | event type |
| event_date | text | nullable |
| budget | real | |
| status | text | new, contacted, quoted, booked, lost |
| source | text | website, referral, etc. |
| notes | text | |
| last_contact | text | |
| created_at / updated_at | text | |

### `contracts`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| title | text | |
| client_name | text | |
| client_email | text | nullable |
| event_id | text | FK to events |
| template | text | |
| content | text | full contract HTML/text |
| status | text | draft, sent, signed |
| value | real | |
| signed_at | text | timestamp |
| signed_ip | text | |
| signature_data | text | base64 signature image |
| sign_token | text | unique signing token |
| created_at | text | |

### `invoices`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| client_name | text | |
| client_email | text | nullable |
| event_id | text | FK |
| amount | real | total |
| paid | real | amount paid so far |
| due | real | amount remaining |
| due_date | text | |
| issued_date | text | |
| status | text | pending, partial, paid, overdue |
| notes | text | |
| stripe_payment_intent | text | |
| stripe_checkout_url | text | |
| pay_token | text | unique payment token |

### `contractors`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text | |
| email | text | |
| phone | text | |
| skills | text | comma-separated |
| rating | real | default 5.0 |
| status | text | active, inactive |
| events_completed | integer | |
| created_at | text | |

> **Note:** The Team page also uses this table — there is no separate `team` table.

### `messages`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| contact | text | phone or email |
| channel | text | sms, email |
| content | text | |
| direction | text | inbound, outbound |
| event_id | text | nullable FK |
| read | boolean | |
| created_at | text | |

### `song_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| event_id | text | nullable FK |
| title | text | |
| artist | text | |
| requested_by | text | client name |
| dedication | text | |
| status | text | pending, played, skipped |
| created_at | text | |

> **Dual use:** Package selection requests from portal are also stored here with `artist = "selection"` or `artist = "addon"` and `title = "Package Request: [name]"`.

### `packages`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| name | text | |
| description | text | |
| duration | text | e.g. "4 hours" |
| price | real | |
| includes | text | JSON array string |
| addons | text | JSON array string |
| popular | boolean | |
| active | boolean | |
| created_at | text | |

### `appointments`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| title | text | |
| client | text | |
| date | text | |
| time | text | |
| duration | text | |
| type | text | consultation, follow-up, etc. |
| status | text | upcoming, completed, cancelled |
| meeting_link | text | Zoom/Meet URL |
| created_at | text | |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| title | text | |
| message | text | |
| type | text | info, appointment, general, payment |
| read | boolean | |
| created_at | text | |

### `portal_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| token | text | unique 48-char nanoid |
| event_id | text | nullable FK to events |
| client_email | text | |
| client_name | text | |
| client_phone | text | nullable |
| client_address | text | nullable |
| client_notes | text | nullable |
| social_links | text | JSON string |
| expires_at | text | nullable |
| used_at | text | nullable |
| created_at | text | |

### Auth Tables (better-auth managed)
- `user` — id, name, email, emailVerified, image, role, createdAt, updatedAt
- `session` — id, expiresAt, token, userId, ...
- `account` — OAuth/credential accounts
- `verification` — email verification tokens

---

## API Routes

### Base path: `/api`

#### Auth — `/api/auth/*`
Handled entirely by better-auth. Endpoints include:
- `POST /api/auth/sign-in/email`
- `POST /api/auth/sign-up/email`
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session`
- `POST /api/auth/change-password`
- `POST /api/auth/update-user`

#### Misc
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/ping | Health check |
| GET | /api/me | Current user + role |

#### Events — `/api/events`
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/events | List all events |
| POST | /api/events | Create event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |

#### Leads — `/api/leads`
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/leads | List all leads |
| POST | /api/leads | Create lead |
| PUT | /api/leads/:id | Update lead |
| DELETE | /api/leads/:id | Delete lead |

#### Generic CRUD (same pattern for all)
Routes: `/api/contracts`, `/api/invoices`, `/api/contractors`, `/api/song-requests`, `/api/messages`, `/api/packages`, `/api/workflows`, `/api/appointments`, `/api/notifications`

Each supports: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`

#### Email — `/api/email`
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/email/portal-link | Send portal access link to client |
| POST | /api/email/contract | Send contract signing link |
| POST | /api/email/invoice | Send invoice + payment link |

> All emails sent via **Resend API** directly. From: `Randy Roman <noreply@romansounds.com>`

#### Portal — `/api/portal`
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/portal/token/:token | Load full portal data for client |
| PUT | /api/portal/client/:token | Update client info (phone, address, social links) |
| POST | /api/portal/package-request | Submit package selection or add-on request |
| POST | /api/portal/send-summary | Email event summary to client |
| POST | /api/portal/request-meeting | Client requests meeting → creates appointment + notification |
| GET | /api/portal/contract/:id/sign | Get contract for signing |
| POST | /api/portal/contract/:id/sign | Submit signed contract + signature data |
| GET | /api/portal/invoice/pay/:token | Get invoice for payment page |
| POST | /api/portal/song-request | Submit song request from portal |
| POST | /api/portal/generate-token | Create portal token (called from CRM events page) |

#### Stripe — `/api/stripe`
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/stripe/checkout | Create Stripe checkout session |
| POST | /api/stripe/webhook | Handle Stripe payment webhooks → marks invoice paid |

#### Messaging — `/api/messages`
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/messages/send-sms | Send SMS via Twilio |
| POST | /api/messages/send-email | Send outbound email |

#### AI — `/api/ai`
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/ai/revise | AI-revise existing content (contracts, emails) |
| POST | /api/ai/generate | AI-generate content from context |

#### Other
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/seed | Seed dev/demo data |
| POST | /api/bootstrap | First-run admin account creation |
| POST | /api/pdf | Generate PDF from HTML |

---

## Frontend Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | dashboard.tsx | Stats, upcoming events, leads, notifications |
| `/events` | events.tsx | Event list + detail panel + portal link sender |
| `/leads` | leads.tsx | Lead pipeline with status management |
| `/contracts` | contracts.tsx | Contract builder, AI assist, PDF, send |
| `/invoices` | invoices.tsx | Invoice list, payment tracking, Stripe send |
| `/appointments` | appointments.tsx | Appointment scheduling |
| `/calendar` | calendar.tsx | Month/day calendar view with delete |
| `/contractors` | contractors.tsx | Contractor roster CRUD |
| `/team` | team.tsx | Team management (uses /api/contractors) |
| `/messaging` | messaging.tsx | SMS/email conversation threads |
| `/song-requests` | song-requests.tsx | Song request queue |
| `/packages` | packages.tsx | Service package management |
| `/workflows` | workflows.tsx | Automation workflows |
| `/analytics` | analytics.tsx | Charts + business metrics |
| `/customers` | customers.tsx | Customer CRM |
| `/forms` | forms.tsx | Booking form builder |
| `/settings` | settings.tsx | Account settings (all tabs) |
| `/sign-in` | sign-in.tsx | Login page |
| `/setup` | bootstrap.tsx | First-run admin setup |
| `/portal` | portal/index.tsx | Client portal (public, no auth) |
| `/portal/sign/:id` | portal/sign.tsx | Contract signing page |
| `/portal/pay/:token` | portal/pay.tsx | Invoice payment page |
| `/portal/requests` | portal/requests.tsx | Song request page (portal) |

---

## Third-Party Integrations

### Resend (Email)
- **Usage:** Portal link emails, contract signing emails, invoice payment emails, event summaries
- **From address:** `Randy Roman <noreply@romansounds.com>`
- **Implementation:** Direct `fetch` to `https://api.resend.com/emails` with `Authorization: Bearer ${RESEND_API_KEY}`
- **File:** `src/api/routes/email.ts` → `sendEmail()` function
- **Previous issue:** Was using a localhost relay (`http://localhost:6450/__email_relay`) that only worked in dev — **fixed to use Resend directly**

### Twilio (SMS)
- **Usage:** Outbound SMS from Messaging page
- **Phone number:** +1 (844) 623-8775
- **File:** `src/api/routes/messaging.ts`

### Stripe (Payments)
- **Usage:** Invoice payment links, Stripe Checkout sessions
- **Webhook:** `POST /api/stripe/webhook` — marks invoice as paid when payment succeeds
- **File:** `src/api/routes/stripe.ts`
- **Mode:** Live (sk_live_...)

### better-auth (Authentication)
- **Usage:** Email/password auth, session management, password change, user updates
- **Plugin:** Autumn (billing integration)
- **Client methods used:** `authClient.useSession()`, `authClient.signOut()`, `authClient.updateUser()`, `authClient.changePassword()`
- **File:** `src/api/auth.ts`, `src/web/lib/auth.ts`

### AI Gateway (OpenAI Compatible)
- **Usage:** AI contract revision, AI content generation in contracts/messaging
- **File:** `src/api/routes/ai.ts`
- **Provider:** Use OpenAI or compatible API (e.g., Anthropic, Groq, etc.)

---

## Environment Variables

Stored in `.env.local` (dev) and deployment environment variables (production).

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend email sending |
| `STRIPE_SECRET_KEY` | Stripe payments (live key) |
| `TWILIO_ACCOUNT_SID` | Twilio SMS |
| `TWILIO_AUTH_TOKEN` | Twilio SMS |
| `TWILIO_PHONE_NUMBER` | +18446238775 |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `AI_GATEWAY_BASE_URL` | OpenAI API or compatible endpoint |
| `AI_GATEWAY_API_KEY` | OpenAI or compatible API key |
| `AUTUMN_SECRET_KEY` | Autumn billing plugin secret |

> ⚠️ Never commit `.env.local` — all secrets should be managed securely in your deployment platform.

---

## All Implementations

### Dashboard (`dashboard.tsx`)
- Real-time stats: total events, revenue, leads, active clients
- Upcoming events list — clicking a card navigates to `/events`
- Recent leads list — clicking a card navigates to `/leads`
- Notifications panel in header (bell icon)
- `useLocation` + `navigate` wired to event and lead cards

### Events (`events.tsx`)
- Full CRUD: create, edit, delete events
- Detail side panel with full event info
- Client phone + email displayed in detail panel
- **Email Portal Link button:** calls `/api/email/portal-link` → sends Resend email with magic link
- **Copy Link button:** calls `/api/portal/generate-token` → copies URL to clipboard (fallback: `document.execCommand('copy')` if `navigator.clipboard` fails)
- Compact card padding for better list density

### Leads (`leads.tsx`)
- Full CRUD with status pipeline
- Modal uses `items-start overflow-y-auto my-8` for proper scroll behavior

### Contracts (`contracts.tsx`)
- Contract builder with rich text
- AI revision button
- PDF generation + download
- Email send (contract signing link)
- Modal content area: `maxHeight: "50vh"`, `max-w-3xl`, scrollable

### Invoices (`invoices.tsx`)
- Invoice list with paid/due tracking
- Stripe payment link generation + email send
- Modal: `items-start overflow-y-auto`, `my-8`

### Appointments (`appointments.tsx`)
- Appointment scheduling with type + meeting link
- Modal: `items-start overflow-y-auto py-8`, inner div `my-8`

### Calendar (`calendar.tsx`)
- Month view + day detail modal
- Day view shows all events for selected date
- **Delete button** on each event in day view (Trash2 icon, calls `api.del`)
- Events sourced from appointments, events, and calendar entries

### Contractors (`contractors.tsx`)
- Contractor roster with skills, rating, status
- Add/edit/delete with modal (has `backdropFilter: blur(4px)`, `my-8`)

### Team (`team.tsx`)
- Reuses `/api/contractors` endpoint — no separate table
- Full CRUD: Invite Member (add), edit, delete
- Role info display (Admin, Sales Rep, Staff, Contractor)
- Stats: total, active, pending invites, roles defined
- All wired to real API — no mock data

### Messaging (`messaging.tsx`)
- Conversation threads grouped by contact + channel
- Send SMS via Twilio (`/api/messages/send-sms`)
- Delete thread: calls `api.del('/messages/${m.id}')` for each message in thread
- `api.del` is the correct method name (not `api.delete`) — matches `src/web/lib/api.ts`

### Packages (`packages.tsx`)
- Package management with includes + add-ons (JSON arrays)
- Active/inactive toggle

### Song Requests (`song-requests.tsx`)
- Queue management with status (pending → played/skipped)

### Analytics (`analytics.tsx`)
- Revenue, events, leads charts
- Business metrics overview

### Settings (`settings.tsx`) — Full rewrite
See [Settings System](#settings-system) section below.

### Client Portal (`portal/index.tsx`)
See [Client Portal System](#client-portal-system) section below.

---

## Bug Fixes Applied

### Round 1 — Modal & UI Fixes

| # | Page | Bug | Fix |
|---|------|-----|-----|
| 1 | `dashboard.tsx` | Event/lead cards non-clickable | Added `useLocation`, `navigate` — cards navigate to detail pages |
| 2 | `events.tsx` | Phone/email missing in detail panel | Added client phone + email fields to detail side panel |
| 3 | `events.tsx` | Copy link button error | Added `document.execCommand('copy')` fallback for non-HTTPS clipboard |
| 4 | `events.tsx` | Card padding too large | Reduced to compact padding |
| 5 | `contracts.tsx` | Modal content cut off | Content area `maxHeight: "50vh"`, modal `max-w-3xl`, scroll enabled |
| 6 | `invoices.tsx` | Modal partially hidden | Changed to `items-start overflow-y-auto`, added `my-8` |
| 7 | `appointments.tsx` | Modal cut off at bottom | Added `my-8` to inner modal div |
| 8 | `leads.tsx` | Add new lead modal too high | Modal backdrop: `items-start overflow-y-auto` |
| 9 | `contractors.tsx` | Modal cut off | Added `backdropFilter: blur(4px)`, confirmed `my-8` on inner div |
| 10 | `messaging.tsx` | Delete chat failing | Confirmed `api.del` is correct (not `api.delete`) — already correct |
| 11 | `team.tsx` | All mock data, buttons dead | Full rewrite — real CRUD via `/api/contractors` |
| 12 | `calendar.tsx` | No delete on events | Trash2 button added to each event in day view modal |

### Round 2 — Email Fix

| # | File | Bug | Fix |
|---|------|-----|-----|
| 13 | `src/api/routes/email.ts` | Emails broken in production | `sendEmail()` rewrote from localhost relay → direct Resend API fetch |

**Before (broken in production):**
```typescript
const reqUrl = "http://localhost:6450/__email_relay";
const res = await fetch(reqUrl, { method: "POST", ... });
```

**After (fixed):**
```typescript
const apiKey = (env as any).RESEND_API_KEY;
const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ from: "Randy Roman <noreply@romansounds.com>", to, subject, html }),
});
```

### Round 3 — Portal Notifications

| # | File | Bug | Fix |
|---|------|-----|-----|
| 14 | `src/api/routes/portal.ts` | Package selection/add-on didn't notify Randy | Added `db.insert(notifications)` to `/package-request` route for both `selection` and `addon` types |

### Round 4 — Settings Full Rewrite

| # | Tab | Bug | Fix |
|---|-----|-----|-----|
| 15 | Profile | `defaultValue` fields — data not saved | Rewrote with controlled state, saves via `authClient.updateUser()` + localStorage for extras |
| 16 | Notifications | Toggles not interactive / not persisted | Toggles wired to state, save to localStorage |
| 17 | Appearance | Theme/size selection not persisted | State-driven selection, saves to localStorage |
| 18 | Security | Change password did nothing | Wired to `authClient.changePassword()` with validation + show/hide toggle |
| 19 | Integrations | All fake "Connected" states | Corrected: Stripe/Twilio/Resend shown as connected; others show "coming soon" toast |
| 20 | Billing | Hardcoded plan info | Updated to reflect plan info management |

---

## Known Issues & Limitations

### Active Limitations
1. **Email "From" domain** — Resend requires `noreply@romansounds.com` to be a verified sender domain. If emails bounce, verify the domain in the Resend dashboard at resend.com.
2. **Profile email field** — Email changes via Settings are disabled (better-auth requires a verified email change flow). User must contact support.
3. **Appearance settings** — Theme color and sidebar size are saved to localStorage only. They don't actually restyle the app UI yet (visual only in settings). Full theme switching would require CSS variable injection.
4. **Notification preferences** — Saved to localStorage only. Not yet wired to suppress actual in-app or push notifications.
5. **2FA** — "Enable 2FA" button shows "coming soon" toast. Not implemented.
6. **Google Calendar / Zoom integrations** — Show "coming soon" toast. Not connected.
7. **Team page = Contractors** — No role differentiation between contractors and "team members" — both use the same DB table. If role-based access is needed later, a `role` column would need to be added to `contractors`.
8. **Workflows** — UI exists but automations don't actually trigger. Placeholder functionality only.
9. **Forms page** — Booking form builder is a UI scaffold — form submissions don't yet create leads automatically.

### Past Issues (Resolved)
- ~~Email relay only worked in dev (localhost:6450 not available in production)~~ → **Fixed: Resend API**
- ~~Team page had all mock data~~ → **Fixed: real CRUD**
- ~~Multiple modals cut off on screen~~ → **Fixed: my-8 + items-start + overflow-y-auto**
- ~~Settings save did nothing (fake 800ms delay)~~ → **Fixed: full real implementation**

---

## Key Files Reference

### `src/web/lib/api.ts`
```typescript
export const api = {
  get:  <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: any) => request<T>("POST", path, body),
  put:  <T>(path: string, body: any) => request<T>("PUT", path, body),
  del:  <T>(path: string) => request<T>("DELETE", path),  // NOTE: del, not delete
  revise:   (content, type, context?) => ...,
  generate: (type, context, tone?) => ...,
  seed:     () => ...,
};
```
> **Critical:** The delete method is `api.del()` — not `api.delete()`. Using `api.delete()` will throw a TypeError.

### `src/web/lib/auth.ts`
```typescript
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({ basePath: "/api/auth" });
```
Key methods: `authClient.useSession()`, `authClient.signOut()`, `authClient.updateUser({ name })`, `authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions })`

### `src/api/database/schema.ts`
Central file for all table definitions. Any schema change requires:
1. Edit `schema.ts`
2. Create migration SQL file
3. Apply during deployment (migrations run on deploy)

---

## Client Portal System

The client portal is a **public-facing, token-gated** page at `/portal?token=<48-char-token>`.

### How it works
1. Randy generates a portal link from the Events page (Email Portal or Copy Link button)
2. System creates a `portal_tokens` record with the token, client info, and optional `event_id`
3. Client visits `/portal?token=...` — no login required
4. Portal loads all data for that token: event details, contract, invoices, packages, appointments

### Portal Features (client-side)
- View event details (date, venue, package, status)
- Update personal info (phone, address, social links)
- View + sign contract (canvas signature)
- View + pay invoice (Stripe Checkout)
- Browse + select packages — sends notification to Randy's dashboard
- Select add-ons on packages — sends notification to Randy's dashboard
- Submit song requests
- Request a meeting (date/time/message) — creates appointment + dashboard notification
- View event summary + receive by email

### Portal API Flow
```
GET /api/portal/token/:token
  → Returns: event, contract, invoices, packages, appointments, portalToken record

POST /api/portal/request-meeting
  → Creates: appointments record (status: pending)
  → Creates: notifications record (type: appointment)
  → Randy sees notification in dashboard bell

POST /api/portal/package-request (requestType: "selection")
  → Creates: song_requests record (title: "Package Request: [name]", artist: "selection")
  → Creates: notifications record (title: "Package Selected")

POST /api/portal/package-request (requestType: "addon")
  → Creates: song_requests record
  → Creates: notifications record (title: "Package Add-on Request")

POST /api/portal/contract/:id/sign
  → Updates: contracts.status = "signed", signed_at, signed_ip, signature_data
```

---

## Email System

### Templates
All emails use `emailWrapper()` — a branded HTML template with:
- Roman Sounds header (purple gradient, 🎵 icon)
- Dark background (#0D0F14)
- Purple accent (#7C3AED)
- Footer: "Randy Delgado dba DJ Randy Roman — Roman Sounds"

### Email Types
| Trigger | Subject | Content |
|---------|---------|---------|
| Portal link sent | "Your Roman Sounds Client Portal — {name}" | Magic link button |
| Contract sent | "Sign Your DJ Services Agreement — Roman Sounds" | Contract details + sign button |
| Invoice sent | "Payment Due — Roman Sounds Invoice {id}" | Amount due + pay button |
| Event summary | "Your Roman Sounds Event Summary" | Full event details |

### `sendEmail()` function
```typescript
async function sendEmail(to, subject, html) {
  const apiKey = (env as any).RESEND_API_KEY;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "Randy Roman <noreply@romansounds.com>",
      to, subject, html,
    }),
  });
  // returns { ok: boolean, error?: string }
}
```

---

## Settings System

Fully rewritten in the latest session. Each tab is now a separate component.

### Profile Tab
- Controlled inputs (not `defaultValue`)
- Name saved via `authClient.updateUser({ name })`
- Phone, Business Name, Website saved to `localStorage` key `crm_profile_extras`
- Email field is read-only (requires auth verification flow)
- Avatar shows first letter of name with purple gradient

### Notifications Tab
- 8 toggles for different notification types
- State stored in `localStorage` key `crm_notification_prefs`
- Defaults defined in `DEFAULT_NOTIFS` array

### Appearance Tab
- 4 color themes (Empire Purple, Ocean Blue, Emerald, Gold Rush)
- 3 sidebar sizes (Compact, Normal, Wide)
- Saved to `localStorage` key `crm_appearance`
- Note: Visual theme application (CSS variable injection) is not yet implemented

### Integrations Tab
- Correctly marked as connected: Stripe ✓, Twilio ✓, Resend ✓
- Others show "coming soon" toast on click

### Security Tab
- Change Password wired to `authClient.changePassword()`
- Validates: all fields required, passwords match, minimum 8 chars
- Show/hide toggle on each password field
- 2FA shows "coming soon" toast

### Billing Tab
- Reflects that billing is managed separately
- Buttons show informational toast directing to platform settings

---

*Documentation generated May 2026 — Roman Sounds CRM v1.0*
