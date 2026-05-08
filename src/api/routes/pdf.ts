import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { invoices, contracts, events } from "../database/schema";
import { eq } from "drizzle-orm";

const app = new Hono();

const BRAND = "Randy Delgado dba DJ Randy Roman — Roman Sounds";
const BRAND_EMAIL = "randy@romansounds.com";
const BRAND_PHONE = "(555) 123-4567";
const BRAND_WEB = "romansounds.com";

const baseCSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 48px; }
h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
h2 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
h3 { font-size: 14px; font-weight: 600; }
p, td, th { font-size: 13px; line-height: 1.6; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #7C3AED; }
.brand-name { font-size: 22px; font-weight: 800; color: #7C3AED; }
.brand-tag { font-size: 11px; color: #6b7280; margin-top: 2px; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
.badge-paid { background: #d1fae5; color: #065f46; }
.badge-pending { background: #dbeafe; color: #1e40af; }
.badge-overdue { background: #fee2e2; color: #991b1b; }
.badge-partial { background: #fef3c7; color: #92400e; }
.badge-signed { background: #d1fae5; color: #065f46; }
.badge-draft { background: #f3f4f6; color: #374151; }
.badge-confirmed { background: #d1fae5; color: #065f46; }
.badge-cancelled { background: #fee2e2; color: #991b1b; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
th { background: #f8f7ff; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7C3AED; border-bottom: 2px solid #e8e0ff; }
td { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; }
.total-row td { font-weight: 700; font-size: 15px; background: #f8f7ff; }
.section { margin-bottom: 32px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
.info-block { }
.info-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9ca3af; margin-bottom: 6px; }
.info-value { font-size: 13px; color: #1a1a2e; }
.info-value strong { font-size: 16px; }
.footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 11px; color: #9ca3af; }
.sig-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; min-height: 80px; margin-top: 12px; background: #fafafa; }
.sig-img { max-height: 70px; }
@media print { body { padding: 32px; } }
`;

// GET /api/pdf/invoice/:id
app.get("/invoice/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id));
  if (!inv) return c.json({ error: "Not found" }, 404);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${inv.id}</title><style>${baseCSS}</style></head><body>
  <div class="header">
    <div>
      <div class="brand-name">Roman Sounds</div>
      <div class="brand-tag">${BRAND}</div>
      <div class="brand-tag" style="margin-top:4px">${BRAND_EMAIL} · ${BRAND_PHONE} · ${BRAND_WEB}</div>
    </div>
    <div style="text-align:right">
      <h1 style="color:#7C3AED">INVOICE</h1>
      <div style="font-size:14px;color:#6b7280;margin-top:4px">${inv.id}</div>
      <div style="margin-top:8px"><span class="badge badge-${inv.status || "pending"}">${inv.status || "pending"}</span></div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-block">
      <div class="info-label">Bill To</div>
      <div class="info-value"><strong>${inv.clientName}</strong></div>
      ${inv.clientEmail ? `<div class="info-value">${inv.clientEmail}</div>` : ""}
    </div>
    <div class="info-block" style="text-align:right">
      <div class="info-label">Invoice Date</div>
      <div class="info-value">${inv.issuedDate ? new Date(inv.issuedDate as string).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) : "—"}</div>
      ${inv.dueDate ? `<div class="info-label" style="margin-top:12px">Due Date</div><div class="info-value" style="color:#dc2626;font-weight:700">${new Date(inv.dueDate as string).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>` : ""}
    </div>
  </div>
  <table>
    <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
    <tbody>
      <tr><td>DJ Services${inv.eventId ? ` — Event #${inv.eventId}` : ""}${inv.notes ? `<br><small style="color:#6b7280">${inv.notes}</small>` : ""}</td><td style="text-align:right;font-weight:600">$${(inv.amount||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
    </tbody>
  </table>
  <div style="text-align:right;margin-top:8px">
    <table style="width:auto;margin-left:auto">
      <tr><td style="padding:6px 14px;color:#6b7280">Subtotal</td><td style="padding:6px 14px;text-align:right">$${(inv.amount||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
      <tr><td style="padding:6px 14px;color:#6b7280">Amount Paid</td><td style="padding:6px 14px;text-align:right;color:#10b981">-$${(inv.paid||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
      <tr class="total-row"><td style="padding:10px 14px">Balance Due</td><td style="padding:10px 14px;text-align:right;color:${(inv.due||0)>0?"#dc2626":"#10b981"}">$${(inv.due||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
    </table>
  </div>
  ${inv.stripeCheckoutUrl ? `<div style="margin-top:24px;padding:16px;background:#f8f7ff;border-radius:8px;border:1px solid #e8e0ff"><p style="font-size:12px;color:#6b7280;margin-bottom:6px">Pay online:</p><p style="color:#7C3AED;font-weight:600;word-break:break-all">${inv.stripeCheckoutUrl}</p></div>` : ""}
  <div class="footer"><span>${BRAND} · ${BRAND_WEB}</span><span>Thank you for your business!</span></div>
  </body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoice-${inv.id}.html"`,
    },
  });
});

// GET /api/pdf/contract/:id
app.get("/contract/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
  if (!contract) return c.json({ error: "Not found" }, 404);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Contract ${contract.id}</title><style>${baseCSS}</style></head><body>
  <div class="header">
    <div>
      <div class="brand-name">Roman Sounds</div>
      <div class="brand-tag">${BRAND}</div>
      <div class="brand-tag" style="margin-top:4px">${BRAND_EMAIL} · ${BRAND_PHONE} · ${BRAND_WEB}</div>
    </div>
    <div style="text-align:right">
      <h1 style="color:#7C3AED">DJ SERVICE CONTRACT</h1>
      <div style="font-size:14px;color:#6b7280;margin-top:4px">${contract.id}</div>
      <div style="margin-top:8px"><span class="badge badge-${contract.status || "draft"}">${contract.status || "draft"}</span></div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-block">
      <div class="info-label">Client</div>
      <div class="info-value"><strong>${contract.clientName}</strong></div>
      ${contract.clientEmail ? `<div class="info-value">${contract.clientEmail}</div>` : ""}
      ${contract.clientPhone ? `<div class="info-value">${contract.clientPhone}</div>` : ""}
    </div>
    <div class="info-block" style="text-align:right">
      <div class="info-label">Event Date</div>
      <div class="info-value" style="font-weight:700">${contract.eventDate ? new Date(contract.eventDate as string).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}) : "—"}</div>
      <div class="info-label" style="margin-top:12px">Venue</div>
      <div class="info-value">${(contract as any).venue || "—"}</div>
    </div>
  </div>
  <div class="section">
    <h2>Services</h2>
    <table>
      <thead><tr><th>Item</th><th>Details</th></tr></thead>
      <tbody>
        <tr><td>Template</td><td>${contract.template || "Custom"}</td></tr>
        <tr><td>Event ID</td><td>${contract.eventId || "—"}</td></tr>
      </tbody>
    </table>
  </div>
  ${contract.content ? `<div class="section"><h2>Contract Content</h2><pre style="line-height:1.8;color:#374151;font-family:inherit;font-size:12px;white-space:pre-wrap">${contract.content}</pre></div>` : ""}
  <div class="section">
    <h2>Payment</h2>
    <table>
      <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr><td>Total Contract Value</td><td style="text-align:right;font-weight:700">${(contract.value||0).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
        <tr><td>Deposit (50%)</td><td style="text-align:right">${((contract.value||0)/2).toLocaleString("en-US",{minimumFractionDigits:2})}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="section">
    <h2>Signatures</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:16px">
      <div>
        <div class="info-label">Client Signature</div>
        <div class="sig-box">${(contract as any).signatureData ? `<img src="${(contract as any).signatureData}" class="sig-img" alt="Client signature" />` : "<p style='color:#9ca3af;font-size:12px'>Not yet signed</p>"}</div>
        <div style="margin-top:8px;font-size:12px;color:#6b7280">${contract.signedAt ? `Signed: ${new Date(contract.signedAt as string).toLocaleString()}` : "Awaiting signature"}</div>
      </div>
      <div>
        <div class="info-label">Service Provider</div>
        <div class="sig-box"><p style="font-size:16px;font-family:Georgia,serif;color:#1a1a2e">Randy Delgado</p><p style="font-size:11px;color:#6b7280;margin-top:4px">DJ Randy Roman / Roman Sounds</p></div>
      </div>
    </div>
  </div>
  <div class="footer"><span>${BRAND} · ${BRAND_WEB}</span><span>Contract ID: ${contract.id}</span></div>
  </body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="contract-${contract.id}.html"`,
    },
  });
});

// GET /api/pdf/event/:id
app.get("/event/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) return c.json({ error: "Not found" }, 404);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Event Sheet — ${event.title}</title><style>${baseCSS}</style></head><body>
  <div class="header">
    <div>
      <div class="brand-name">Roman Sounds</div>
      <div class="brand-tag">${BRAND}</div>
      <div class="brand-tag" style="margin-top:4px">${BRAND_EMAIL} · ${BRAND_PHONE} · ${BRAND_WEB}</div>
    </div>
    <div style="text-align:right">
      <h1 style="color:#7C3AED">EVENT SHEET</h1>
      <div style="font-size:14px;color:#6b7280;margin-top:4px">${event.id}</div>
      <div style="margin-top:8px"><span class="badge badge-${event.status || "pending"}">${event.status || "pending"}</span></div>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-block">
      <div class="info-label">Event</div>
      <div class="info-value"><strong style="font-size:18px">${event.title}</strong></div>
      ${event.type ? `<div class="info-value" style="color:#7C3AED">${event.type}</div>` : ""}
    </div>
    <div class="info-block" style="text-align:right">
      <div class="info-label">Date & Time</div>
      <div class="info-value"><strong>${event.date ? new Date(event.date as string).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}) : "—"}</strong></div>
      ${event.time ? `<div class="info-value">${event.time}</div>` : ""}
    </div>
  </div>
  <table>
    <thead><tr><th>Field</th><th>Details</th></tr></thead>
    <tbody>
      <tr><td>Client</td><td><strong>${event.clientName || "—"}</strong></td></tr>
      ${event.clientEmail ? `<tr><td>Client Email</td><td>${event.clientEmail}</td></tr>` : ""}
      ${(event as any).clientPhone ? `<tr><td>Client Phone</td><td>${(event as any).clientPhone}</td></tr>` : ""}
      <tr><td>Venue</td><td>${event.venue || "—"}</td></tr>
      ${event.address ? `<tr><td>Address</td><td>${event.address}</td></tr>` : ""}
      ${event.duration ? `<tr><td>Duration</td><td>${event.duration}</td></tr>` : ""}
      ${event.guestCount ? `<tr><td>Guest Count</td><td>${event.guestCount}</td></tr>` : ""}
      ${event.package ? `<tr><td>Package</td><td>${event.package}</td></tr>` : ""}
      ${event.amount ? `<tr><td>Event Value</td><td><strong>$${(event.amount||0).toLocaleString()}</strong></td></tr>` : ""}
    </tbody>
  </table>
  ${event.notes ? `<div class="section" style="margin-top:24px"><h2>Notes</h2><p style="line-height:1.8;color:#374151;white-space:pre-wrap">${event.notes}</p></div>` : ""}
  <div class="footer"><span>${BRAND} · ${BRAND_WEB}</span><span>Printed: ${new Date().toLocaleDateString()}</span></div>
  </body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="event-${event.id}.html"`,
    },
  });
});

export const pdfRoutes = app;
