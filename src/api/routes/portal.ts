import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { portalTokens, contracts, invoices, events, songRequests, packages, appointments, notifications } from "../database/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

// ── Token validation helper ──────────────────────────────────────────────────
async function resolveToken(db: any, token: string) {
  const [pt] = await db.select().from(portalTokens).where(eq(portalTokens.token, token));
  return pt || null;
}

// GET /api/portal/token/:token — load full portal data
app.get("/token/:token", async (c) => {
  const db = drizzle(env.DB);
  const pt = await resolveToken(db, c.req.param("token"));
  if (!pt) return c.json({ error: "Invalid or expired token" }, 404);

  let event: any = null;
  if (pt.eventId) {
    const [ev] = await db.select().from(events).where(eq(events.id, pt.eventId));
    event = ev || null;
  }

  const [eventContracts, eventInvoices, allPackages, songReqs] = await Promise.all([
    pt.eventId ? db.select().from(contracts).where(eq(contracts.eventId, pt.eventId)) : [],
    pt.eventId ? db.select().from(invoices).where(eq(invoices.eventId, pt.eventId)) : [],
    db.select().from(packages).where(eq(packages.active, true)),
    pt.eventId ? db.select().from(songRequests).where(eq(songRequests.eventId, pt.eventId)) : [],
  ]);

  return c.json({
    client: {
      name: pt.clientName,
      email: pt.clientEmail,
      phone: pt.clientPhone || null,
      address: pt.clientAddress || null,
      notes: pt.clientNotes || null,
      socialLinks: pt.socialLinks ? JSON.parse(pt.socialLinks) : {},
    },
    event,
    contracts: eventContracts,
    invoices: eventInvoices,
    packages: allPackages,
    songRequests: songReqs,
    portalTokenId: pt.id,
  });
});

// PUT /api/portal/client/:token — update client info
app.put("/client/:token", async (c) => {
  const db = drizzle(env.DB);
  const token = c.req.param("token");
  const pt = await resolveToken(db, token);
  if (!pt) return c.json({ error: "Invalid token" }, 404);

  const body = await c.req.json();
  const { name, phone, address, notes, socialLinks } = body;

  await db.update(portalTokens).set({
    clientName: name || pt.clientName,
    clientPhone: phone !== undefined ? phone : pt.clientPhone,
    clientAddress: address !== undefined ? address : pt.clientAddress,
    clientNotes: notes !== undefined ? notes : pt.clientNotes,
    socialLinks: socialLinks !== undefined ? JSON.stringify(socialLinks) : pt.socialLinks,
  }).where(eq(portalTokens.token, token));

  // Also update event client info if linked
  if (pt.eventId && name) {
    await db.update(events).set({
      clientName: name,
      clientPhone: phone || undefined,
    }).where(eq(events.id, pt.eventId));
  }

  return c.json({ success: true });
});

// POST /api/portal/package-request — request a package addon
app.post("/package-request", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const { token, packageId, packageName, requestType, message } = body;

  const pt = await resolveToken(db, token);
  if (!pt) return c.json({ error: "Invalid token" }, 404);

  // Store as a song request with type="package_request" for now (reuses existing table)
  await db.insert(songRequests).values({
    id: nanoid(),
    eventId: pt.eventId || null,
    requestedBy: pt.clientName,
    title: `Package Request: ${packageName || packageId}`,
    artist: requestType || "addon",
    dedication: message || "",
    status: "pending",
  });

  // Create dashboard notification
  await db.insert(notifications).values({
    id: nanoid(),
    title: requestType === "selection" ? "Package Selected" : "Package Add-on Request",
    message: `${pt.clientName} ${requestType === "selection" ? "selected" : "requested add-on for"} package: ${packageName || packageId}${message ? `. ${message}` : ""}`,
    type: "general",
    read: false,
  });

  return c.json({ success: true });
});

// POST /api/portal/send-summary — send client their event summary by email
app.post("/send-summary", async (c) => {
  const db = drizzle(env.DB);
  const { token } = await c.req.json();
  const pt = await resolveToken(db, token);
  if (!pt) return c.json({ error: "Invalid token" }, 404);

  let event: any = null;
  if (pt.eventId) {
    const [ev] = await db.select().from(events).where(eq(events.id, pt.eventId));
    event = ev;
  }

  const origin = new URL(c.req.url).origin;
  const portalUrl = `${origin}/portal?token=${token}`;

  const socialLinks = pt.socialLinks ? JSON.parse(pt.socialLinks) : {};
  const socialHtml = Object.entries(socialLinks).filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;text-transform:capitalize;">${k}</td><td style="color:white;font-size:13px;">${v}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0F14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0F14;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="background:linear-gradient(135deg,#1C2030,#141824);border-radius:16px 16px 0 0;padding:32px;border-bottom:3px solid #7C3AED;">
    <span style="font-size:20px;font-weight:800;color:white;">🎵 Roman Sounds — Your Event Summary</span>
  </td></tr>
  <tr><td style="background:#141824;padding:32px;border-radius:0 0 16px 16px;border:1px solid #252A3A;border-top:none;">
    <h2 style="color:white;margin:0 0 6px;">Hi ${pt.clientName}!</h2>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 24px;">Here's a summary of your event and profile information.</p>
    ${event ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C2030;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #252A3A;">
    <tr><td>
      <p style="color:#7C3AED;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Event Details</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Event</td><td style="color:white;font-size:13px;">${event.title}</td></tr>
        <tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Date</td><td style="color:white;font-size:13px;">${event.date}</td></tr>
        <tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Time</td><td style="color:white;font-size:13px;">${event.time}</td></tr>
        <tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Venue</td><td style="color:white;font-size:13px;">${event.venue}</td></tr>
      </table>
    </td></tr></table>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C2030;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #252A3A;">
    <tr><td>
      <p style="color:#7C3AED;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your Contact Info</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Name</td><td style="color:white;font-size:13px;">${pt.clientName}</td></tr>
        <tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Email</td><td style="color:white;font-size:13px;">${pt.clientEmail}</td></tr>
        ${pt.clientPhone ? `<tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Phone</td><td style="color:white;font-size:13px;">${pt.clientPhone}</td></tr>` : ""}
        ${pt.clientAddress ? `<tr><td style="color:#94A3B8;font-size:13px;padding:3px 0;">Address</td><td style="color:white;font-size:13px;">${pt.clientAddress}</td></tr>` : ""}
        ${socialHtml}
      </table>
    </td></tr></table>
    ${pt.clientNotes ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#1C2030;border-radius:12px;padding:20px;margin-bottom:20px;border:1px solid #252A3A;">
    <tr><td>
      <p style="color:#7C3AED;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px;">Your Notes</p>
      <p style="color:#94A3B8;font-size:13px;white-space:pre-wrap;">${pt.clientNotes}</p>
    </td></tr></table>` : ""}
    <a href="${portalUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#9D6FEF);color:white;text-decoration:none;padding:14px;border-radius:10px;font-size:15px;font-weight:700;">View Your Portal →</a>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;

  try {
    const res = await fetch("http://localhost:6450/__email_relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: pt.clientEmail,
        subject: `Your Roman Sounds Event Summary — ${pt.clientName}`,
        html,
      }),
    });
    if (!res.ok) return c.json({ error: await res.text() }, 400);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/portal/request-meeting — client requests a meeting with Randy
app.post("/request-meeting", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const { token, date, time, message } = body;

  const pt = await resolveToken(db, token);
  if (!pt) return c.json({ error: "Invalid token" }, 404);

  // Create appointment record
  await db.insert(appointments).values({
    id: nanoid(),
    title: `Meeting Request: ${pt.clientName}${message ? ` — ${message}` : ""}`,
    client: pt.clientName,
    date: date || "",
    time: time || "",
    type: "consultation",
    status: "pending",
  });

  // Create dashboard notification
  await db.insert(notifications).values({
    id: nanoid(),
    title: "Meeting Request",
    message: `${pt.clientName} has requested a meeting${date ? ` on ${date}${time ? ` at ${time}` : ""}` : ""}.${message ? ` Note: ${message}` : ""}`,
    type: "appointment",
    read: false,
  });

  return c.json({ success: true });
});

// GET /api/portal/contract/:id/sign
app.get("/contract/:id/sign", async (c) => {
  const db = drizzle(env.DB);
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, c.req.param("id")));
  if (!contract) return c.json({ error: "Not found" }, 404);
  return c.json(contract);
});

// POST /api/portal/contract/:id/sign
app.post("/contract/:id/sign", async (c) => {
  const db = drizzle(env.DB);
  const { signature } = await c.req.json();
  if (!signature) return c.json({ error: "Signature required" }, 400);
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, c.req.param("id")));
  if (!contract) return c.json({ error: "Not found" }, 404);
  if (contract.status === "signed") return c.json({ error: "Already signed" }, 400);
  const signedAt = new Date().toISOString();
  await db.update(contracts).set({ signatureData: signature, signedAt, status: "signed" }).where(eq(contracts.id, c.req.param("id")));
  return c.json({ success: true, signedAt });
});

// GET /api/portal/invoice/pay/:token
app.get("/invoice/pay/:token", async (c) => {
  const db = drizzle(env.DB);
  const [inv] = await db.select().from(invoices).where(eq(invoices.payToken, c.req.param("token")));
  if (!inv) return c.json({ error: "Invalid payment link" }, 404);
  return c.json(inv);
});

// POST /api/portal/song-request
app.post("/song-request", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const { eventId, clientName, songTitle, artist, requestType, token } = body;
  await db.insert(songRequests).values({
    id: nanoid(),
    eventId: eventId || null,
    requestedBy: clientName || "Client",
    title: songTitle || "",
    artist: artist || "",
    status: "pending",
  });
  return c.json({ success: true });
});

// POST /api/portal/generate-token — create portal link for client (used from CRM)
app.post("/generate-token", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const { eventId, clientName, clientEmail } = body;
  if (!clientEmail || !clientName) return c.json({ error: "clientEmail and clientName required" }, 400);

  const token = nanoid(48);
  await db.insert(portalTokens).values({
    id: nanoid(),
    token,
    eventId: eventId || null,
    clientEmail,
    clientName,
  });

  const url = `${new URL(c.req.url).origin}/portal?token=${token}`;
  return c.json({ token, url });
});

export const portalRoutes = app;
