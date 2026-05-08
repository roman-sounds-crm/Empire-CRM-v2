import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { invoices, contracts, portalTokens } from "../database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

const BRAND = "Roman Sounds / DJ Randy Roman";
const ACCENT = "#7C3AED";

function emailWrapper(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0F14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0F14;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#1C2030,#141824);border-radius:16px 16px 0 0;padding:32px;border-bottom:3px solid ${ACCENT};">
        <table width="100%" cellpadding="0" cellspacing="0"><tr><td>
          <span style="display:inline-block;width:42px;height:42px;background:linear-gradient(135deg,#7C3AED,#9D6FEF);border-radius:10px;text-align:center;line-height:42px;font-size:20px;color:white;vertical-align:middle;">🎵</span>
          <span style="font-size:20px;font-weight:800;color:white;vertical-align:middle;margin-left:12px;">Roman Sounds</span>
        </td></tr>
        <tr><td style="padding-top:4px;padding-left:54px;"><span style="font-size:11px;color:#9D6FEF;">DJ Randy Roman · Professional DJ Services</span></td></tr>
        </table>
      </td></tr>
      <tr><td style="background:#141824;padding:32px;border-radius:0 0 16px 16px;border:1px solid #252A3A;border-top:none;">${content}</td></tr>
      <tr><td style="padding:24px;text-align:center;">
        <p style="font-size:11px;color:#334155;margin:0;">Randy Delgado dba DJ Randy Roman — Roman Sounds</p>
        <p style="font-size:11px;color:#334155;margin:4px 0 0;">romansounds.com</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const apiKey = (env as any).RESEND_API_KEY;
    if (!apiKey) return { ok: false, error: "RESEND_API_KEY not configured" };
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Randy Roman <noreply@romansounds.com>",
        to,
        subject,
        html,
      }),
    });
    if (res.ok) return { ok: true };
    const errText = await res.text();
    return { ok: false, error: errText };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// POST /api/email/portal-link
app.post("/portal-link", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const { eventId, clientName, clientEmail } = body;

  if (!clientEmail || !clientName) return c.json({ error: "clientEmail and clientName required" }, 400);

  const token = nanoid(48);
  await db.insert(portalTokens).values({ id: nanoid(), token, eventId: eventId || null, clientEmail, clientName });

  const origin = new URL(c.req.url).origin;
  const portalUrl = `${origin}/portal?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color:white;font-size:22px;font-weight:800;margin:0 0 8px;">Your Client Portal is Ready 🎉</h2>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 28px;">Hi ${clientName}, here's your private link to access your event details, contracts, and payments.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C2030;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #252A3A;">
      <tr><td>
        <p style="color:#7C3AED;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 16px;">Your Portal Access Link</p>
        <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#9D6FEF);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">Access My Portal →</a>
      </td></tr>
    </table>
    <p style="color:#475569;font-size:12px;">From your portal you can view event details, sign contracts, make payments, and submit song requests.</p>
    <p style="color:#334155;font-size:11px;margin-top:24px;padding-top:16px;border-top:1px solid #252A3A;">This link is unique to you. Reply to this email with any questions.</p>
  `, `Access your Roman Sounds client portal`);

  const result = await sendEmail(clientEmail, `Your Roman Sounds Client Portal — ${clientName}`, html);
  return c.json({ success: result.ok, url: portalUrl, token, ...(result.error ? { error: result.error } : {}) });
});

// POST /api/email/contract
app.post("/contract", async (c) => {
  const db = drizzle(env.DB);
  const { contractId } = await c.req.json();
  if (!contractId) return c.json({ error: "contractId required" }, 400);

  const [contract] = await db.select().from(contracts).where(eq(contracts.id, contractId));
  if (!contract) return c.json({ error: "Contract not found" }, 404);
  if (!contract.clientEmail) return c.json({ error: "No client email on contract" }, 400);

  const origin = new URL(c.req.url).origin;
  const signUrl = `${origin}/portal/sign/${contractId}`;

  const html = emailWrapper(`
    <h2 style="color:white;font-size:22px;font-weight:800;margin:0 0 8px;">Your Contract is Ready to Sign ✍️</h2>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 28px;">Hi ${contract.clientName}, your DJ services agreement is ready for review and signature.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C2030;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #252A3A;">
      <tr><td>
        <p style="color:#7C3AED;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Contract Details</p>
        <p style="color:white;font-size:16px;font-weight:700;margin:0 0 4px;">${contract.title || "DJ Services Agreement"}</p>
        <p style="color:#94A3B8;font-size:13px;margin:0 0 20px;">Value: <strong style="color:white;">$${(contract.value || 0).toLocaleString()}</strong></p>
        <a href="${signUrl}" style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#9D6FEF);color:white;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:700;">Review & Sign Contract →</a>
      </td></tr>
    </table>
    <p style="color:#475569;font-size:12px;">Once signed, your booking is confirmed and a deposit invoice will follow. Reply to this email with questions.</p>
  `, `Your DJ services contract is ready to sign`);

  const result = await sendEmail(contract.clientEmail, `Sign Your DJ Services Agreement — Roman Sounds`, html);
  if (result.ok) {
    await db.update(contracts).set({ status: "sent" }).where(eq(contracts.id, contractId));
  }
  return c.json({ success: result.ok, signUrl, ...(result.error ? { error: result.error } : {}) });
});

// POST /api/email/invoice
app.post("/invoice", async (c) => {
  const db = drizzle(env.DB);
  const { invoiceId } = await c.req.json();
  if (!invoiceId) return c.json({ error: "invoiceId required" }, 400);

  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) return c.json({ error: "Invoice not found" }, 404);
  if (!invoice.clientEmail) return c.json({ error: "No client email on invoice" }, 400);

  const origin = new URL(c.req.url).origin;
  let payToken = invoice.payToken;
  let payUrl = invoice.stripeCheckoutUrl;

  if (!payToken || !payUrl) {
    payToken = `pay_${nanoid(16)}`;
    payUrl = `${origin}/portal/pay/${payToken}`;
    await db.update(invoices).set({ payToken, stripeCheckoutUrl: payUrl }).where(eq(invoices.id, invoiceId));
  }

  const dueAmount = invoice.due || (invoice.amount - invoice.paid);
  const statusColor = invoice.status === "overdue" ? "#EF4444" : "#F59E0B";

  const html = emailWrapper(`
    <h2 style="color:white;font-size:22px;font-weight:800;margin:0 0 8px;">Invoice & Payment Request 💳</h2>
    <p style="color:#94A3B8;font-size:14px;margin:0 0 28px;">Hi ${invoice.clientName}, here's your invoice from Roman Sounds.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1C2030;border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #252A3A;">
      <tr><td>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="color:#94A3B8;font-size:13px;padding:4px 0;">Invoice ID</td><td style="color:white;font-size:13px;text-align:right;font-family:monospace;">${invoice.id}</td></tr>
          <tr><td style="color:#94A3B8;font-size:13px;padding:4px 0;">Total</td><td style="color:white;font-size:13px;text-align:right;font-weight:700;">$${invoice.amount.toLocaleString()}</td></tr>
          <tr><td style="color:#94A3B8;font-size:13px;padding:4px 0;">Paid</td><td style="color:#10B981;font-size:13px;text-align:right;">$${invoice.paid.toLocaleString()}</td></tr>
          <tr><td style="color:#94A3B8;font-size:15px;font-weight:700;padding:8px 0 0;">Due</td><td style="color:white;font-size:20px;font-weight:800;text-align:right;padding:8px 0 0;">$${dueAmount.toLocaleString()}</td></tr>
        </table>
        ${invoice.dueDate ? `<p style="color:${statusColor};font-size:12px;margin:16px 0 0;">Due by: ${invoice.dueDate}</p>` : ""}
      </td></tr>
    </table>
    <a href="${payUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7C3AED,#9D6FEF);color:white;text-decoration:none;padding:16px;border-radius:12px;font-size:16px;font-weight:700;margin-bottom:16px;">Pay $${dueAmount.toLocaleString()} Now →</a>
    <p style="color:#334155;font-size:11px;text-align:center;">Secure payment powered by Stripe.</p>
  `, `Payment due $${dueAmount.toLocaleString()} — Roman Sounds`);

  const result = await sendEmail(invoice.clientEmail, `Payment Due — Roman Sounds Invoice ${invoice.id}`, html);
  return c.json({ success: result.ok, payUrl, ...(result.error ? { error: result.error } : {}) });
});

export const emailRoutes = app;
