# Roman Sounds CRM — Integration Setup Guide

**Last Updated:** May 8, 2026  
**Version:** 1.0

---

## Live & Active Integrations ✅

### Stripe (Payment Processing)

**Status:** Live & Configured  
**Purpose:** Invoice payments, checkout sessions, payment tracking

**Setup Steps:**
1. Go to [stripe.com](https://stripe.com)
2. Create account or sign in
3. Navigate to Developers > API keys
4. Copy your **Live Secret Key** (`sk_live_...`)
5. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxx
   ```
6. Configure in your deployment environment variables

**Testing:**
- Create invoice in app
- Click "Send Payment Link"
- Client receives email with Stripe checkout
- Complete test payment
- Verify invoice marked as paid

**Troubleshooting:**
- **Emails not sending:** Check Resend configuration (see below)
- **Webhook failing:** Verify endpoint URL in Stripe dashboard
- **Test vs Live:** Use `sk_test_` for development, `sk_live_` for production

**Files:**
- Backend: `src/api/routes/stripe.ts`
- Frontend: `src/web/pages/invoices.tsx`

---

### Twilio (SMS Messaging)

**Status:** Live & Configured  
**Purpose:** Send SMS to clients from Messaging page

**Setup Steps:**
1. Go to [twilio.com](https://twilio.com)
2. Sign in to console
3. Get your **Account SID** and **Auth Token** from dashboard
4. Get your assigned **Phone Number** (e.g., +1-844-623-8775)
5. Add to `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   ```
6. Configure in your deployment environment variables

**Testing:**
- Go to Messaging page
- Create new message
- Select SMS channel
- Enter client phone number
- Send test message
- Verify delivery in Twilio console

**Troubleshooting:**
- **SMS not sending:** Verify account has credits
- **Invalid phone number:** Must include country code (+1 for US)
- **Auth errors:** Check SID and Auth Token exactly

**Cost:**
- Pay-as-you-go: ~$0.0075 per SMS in US
- Monitor usage in Twilio console

**Files:**
- Backend: `src/api/routes/messaging.ts`
- Frontend: `src/web/pages/messaging.tsx`

---

### Resend (Email Delivery)

**Status:** Live & Configured  
**Purpose:** Send transactional emails (portal links, contracts, invoices, summaries)

**Setup Steps:**
1. Go to [resend.com](https://resend.com)
2. Create account
3. Get API Key from dashboard (`re_xxxxx`)
4. **Verify sender domain:**
   - Go to Domains > Add Domain
   - Enter `romansounds.com`
   - Add CNAME records to your DNS provider
   - Wait 24-48 hours for propagation
5. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxx
   ```
6. Configure in your deployment environment variables

**Sender Format:**
- From: `Randy Roman <noreply@romansounds.com>`
- Must match verified domain

**Testing:**
- Go to Events page
- Create new event
- Click "Email Portal Link"
- Check client email for message
- Verify in Resend dashboard (Logs tab)

**Troubleshooting:**
- **Emails bouncing:** Domain not verified, verify in Resend dashboard
- **Slow delivery:** Check spam folder, may take 1-2 min
- **Auth error:** Verify RESEND_API_KEY exactly

**Cost:**
- Free: 100 emails/day
- Paid: $20/month for unlimited
- Monitor usage in Resend dashboard

**Files:**
- Backend: `src/api/routes/email.ts`
- Templates: HTML email wrapper with branding

---

## Future Integrations (Coming Soon)

### Google Calendar

**Status:** Planned  
**Purpose:** Sync appointments to Google Calendar, bi-directional sync

**Planned Features:**
- OAuth2 authentication
- Auto-create calendar events from appointments
- Sync attendees and meeting details
- Send invitations to clients

**Setup (When Available):**
1. Create project in Google Cloud Console
2. Enable Google Calendar API
3. Create OAuth2 credentials
4. Configure in app settings

---

### Zoom

**Status:** Planned  
**Purpose:** Generate Zoom meeting links for virtual appointments

**Planned Features:**
- Auto-generate meeting link when appointment created
- Include Zoom link in confirmation email
- Calendar integration with meeting details
- Recording availability tracking

---

### Google Meet

**Status:** Planned  
**Purpose:** Alternative video meeting platform

**Planned Features:**
- Generate Meet links for appointments
- Email integration
- Recording support

---

### Spotify

**Status:** Planned  
**Purpose:** Parse Spotify playlists for song requests

**Planned Features:**
- Browse Spotify playlists
- Extract track list
- Auto-populate song requests from playlist
- Show track popularity and duration

---

### Microsoft 365

**Status:** Planned  
**Purpose:** Teams, Outlook calendar, email integration

**Planned Features:**
- Outlook calendar sync
- Teams meeting creation
- Email forwarding integration
- Shared mailbox support

---

## Testing Integrations

### Backend Testing (Curl)

**Stripe Webhook:**
```bash
curl -X POST http://localhost:6450/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {"object": {"id": "pi_test_123"}}
  }'
```

**Twilio SMS:**
```bash
curl -X POST http://localhost:6450/api/messages/send-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+14155552671",
    "message": "Test SMS from Roman Sounds"
  }'
```

**Resend Email:**
```bash
curl -X POST http://localhost:6450/api/email/portal-link \
  -H "Content-Type: application/json" \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "John Doe"
  }'
```

### Frontend Testing

**1. Stripe (Invoice Payment)**
- Create invoice → Click "Send Payment Link" → Check email
- Click link → Stripe checkout loads → Complete test payment
- Verify invoice status changes to "Paid"

**2. Twilio (SMS)**
- Go to Messaging → Create message → Select SMS
- Enter phone number → Send
- Verify SMS arrives on phone

**3. Resend (Email)**
- Go to Events → Create event → Click "Email Portal Link"
- Check email inbox → Link should arrive
- Click link → Portal should load

### End-to-End Workflow

**Complete Client Journey:**
1. Create event in admin
2. Generate portal link → Email to client
3. Client signs contract in portal
4. Create invoice
5. Send payment link → Client pays via Stripe
6. Request song from portal
7. Song appears in admin request queue
8. Admin sends SMS reminder about event
9. Event day arrives
10. Client accesses portal to submit notes

---

## Troubleshooting Guide

### Emails Not Sending

**Problem:** Portal links not arriving  
**Causes:**
- Resend API key invalid
- Sender domain not verified
- Email address typo
- Resend account out of credits

**Solutions:**
1. Verify `RESEND_API_KEY` in .env.local
2. Go to Resend > Domains > Check verification status
3. Check email address format (must be valid)
4. Monitor Resend dashboard for bounces
5. Verify email limit not exceeded (100/day free tier)

**Test:**
```bash
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Randy Roman <noreply@romansounds.com>",
    "to": "test@example.com",
    "subject": "Test",
    "html": "<p>Test email</p>"
  }'
```

---

### SMS Not Sending

**Problem:** Twilio SMS fails to deliver  
**Causes:**
- Invalid phone number format
- Account out of credits
- Auth token expired
- Phone number not supported in region

**Solutions:**
1. Verify phone number format: `+1XXXXXXXXXX` (include country code)
2. Check Twilio account balance > $0
3. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
4. Check Twilio console for error details
5. Ensure recipient phone number is valid

**Test:**
```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "From=$TWILIO_PHONE_NUMBER&To=+14155552671&Body=Test"
```

---

### Stripe Webhooks Not Triggering

**Problem:** Invoice doesn't mark as paid after payment  
**Causes:**
- Webhook URL incorrect
- Webhook signing key mismatch
- Payment event not subscribed
- Endpoint disabled in Stripe dashboard

**Solutions:**
1. Go to Stripe > Webhooks > Check endpoint URL
2. Verify endpoint is publicly accessible
3. Check event subscriptions include `payment_intent.succeeded`
4. Test webhook from Stripe dashboard
5. Review Stripe event log for errors

**Test:**
```bash
# Send test webhook from Stripe dashboard
Developers > Webhooks > Select endpoint > Send test webhook
```

---

### Integration Not Appearing in Settings

**Problem:** Connected service shows "Coming Soon"  
**Causes:**
- Service not yet integrated
- Feature flag disabled
- Incomplete setup

**Status:**
- ✅ Stripe: Connected & Working
- ✅ Twilio: Connected & Working
- ✅ Resend: Connected & Working
- ⏳ Google Calendar: Coming Soon
- ⏳ Zoom: Coming Soon
- ⏳ Google Meet: Coming Soon
- ⏳ Spotify: Coming Soon
- ⏳ Microsoft 365: Coming Soon

---

## Adding New Integrations

### Step 1: Backend Route

Create `src/api/routes/new-service.ts`:

```typescript
import { Hono } from "hono";
import { env } from "cloudflare:workers";

const app = new Hono();

app.post("/action", async (c) => {
  const apiKey = (env as any).NEW_SERVICE_API_KEY;
  if (!apiKey) return c.json({ error: "Not configured" }, 400);
  
  const body = await c.req.json();
  
  // Call external API
  const res = await fetch("https://api.newservice.com/endpoint", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  
  return c.json(await res.json());
});

export const newServiceRoutes = app;
```

### Step 2: Mount Route

In `src/api/index.ts`:

```typescript
import { newServiceRoutes } from "./routes/new-service";

app.use("/api/new-service", newServiceRoutes);
```

### Step 3: Frontend Hook

In `src/web/pages/settings.tsx`:

```typescript
const INTEGRATIONS = [
  ...existing,
  { 
    name: "New Service", 
    desc: "Description here", 
    connected: true,  // or false for placeholder
    color: "#XXXXX" 
  },
];
```

### Step 4: Document

Add section to this guide with setup steps, testing, troubleshooting.

---

## Security Best Practices

1. **Never commit secrets** — Use .env.local (gitignored)
2. **Rotate keys regularly** — Monthly for each service
3. **Use separate test keys** — Don't use production keys in dev
4. **Enable webhooks carefully** — Verify source before processing
5. **Rate limit API calls** — Prevent abuse
6. **Log sensitive actions** — But never log passwords/keys
7. **Test in staging** — Before deploying to production

---

## Support & Resources

| Service | Docs | Support | Status Page |
|---------|------|---------|------------|
| Stripe | https://stripe.com/docs | https://support.stripe.com | https://status.stripe.com |
| Twilio | https://twilio.com/docs | https://support.twilio.com | https://status.twilio.com |
| Resend | https://resend.com/docs | https://resend.com/support | https://status.resend.com |

---

*Guide maintained by: Roman Sounds Dev Team*  
*Last Updated: May 8, 2026*
