import { Hono } from "hono";
import { env } from "cloudflare:workers";

const app = new Hono();

// POST /api/messages/send-sms
app.post("/send-sms", async (c) => {
  const { to, body } = await c.req.json();
  if (!to || !body) return c.json({ error: "to and body required" }, 400);

  const sid = (env as any).TWILIO_ACCOUNT_SID;
  const token = (env as any).TWILIO_AUTH_TOKEN;
  const from = (env as any).TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    return c.json({ error: "Twilio not configured" }, 503);
  }

  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    });
    const data = await res.json() as any;
    if (!res.ok) return c.json({ error: data.message || "Twilio error" }, 400);
    return c.json({ success: true, sid: data.sid });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /api/messages/send-email — thin wrapper around email relay
app.post("/send-email", async (c) => {
  const { to, subject, body } = await c.req.json();
  if (!to || !body) return c.json({ error: "to and body required" }, 400);

  try {
    const res = await fetch("http://localhost:6450/__email_relay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject: subject || "Message from Roman Sounds",
        html: `<div style="font-family:sans-serif;background:#0D1117;color:#F1F5F9;padding:32px;border-radius:12px;">
          <p style="font-size:16px;">${body.replace(/\n/g, "<br/>")}</p>
          <p style="font-size:12px;color:#475569;margin-top:24px;">— Randy Roman · Roman Sounds DJ Services</p>
        </div>`,
      }),
    });
    if (!res.ok) return c.json({ error: await res.text() }, 400);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export const messagingRoutes = app;
