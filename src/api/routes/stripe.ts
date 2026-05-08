import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { invoices } from "../database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

// POST /api/stripe/checkout — create a Stripe checkout session for an invoice
app.post("/checkout", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const { invoiceId, amount, clientEmail, clientName, description } = body;

  if (!amount || amount <= 0) {
    return c.json({ error: "Invalid amount" }, 400);
  }

  const stripeKey = (env as any).STRIPE_SECRET_KEY;

  if (!stripeKey) {
    // Return a demo payment link if no Stripe key configured
    const demoToken = `demo_${Date.now()}_${nanoid(8)}`;
    const origin = new URL(c.req.url).origin;
    const demoUrl = `${origin}/portal/pay/${demoToken}`;

    if (invoiceId) {
      const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
      if (inv) {
        await db.update(invoices)
          .set({ payToken: demoToken, stripeCheckoutUrl: demoUrl })
          .where(eq(invoices.id, invoiceId));
      }
    }

    return c.json({ url: demoUrl, token: demoToken, mode: "demo" });
  }

  // Real Stripe checkout session
  try {
    const params = new URLSearchParams({
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": description || `Invoice ${invoiceId}`,
      "line_items[0][price_data][unit_amount]": String(Math.round(amount * 100)),
      "line_items[0][quantity]": "1",
      "mode": "payment",
      "success_url": `${new URL(c.req.url).origin}/portal/pay-success?invoice=${invoiceId}`,
      "cancel_url": `${new URL(c.req.url).origin}/invoices`,
      "metadata[invoice_id]": invoiceId || "",
      "metadata[client_name]": clientName || "",
    });

    if (clientEmail) params.set("customer_email", clientEmail);

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      return c.json({ error: err?.error?.message || "Stripe error" }, 500);
    }

    const session = await res.json() as any;
    const token = nanoid(32);

    if (invoiceId) {
      await db.update(invoices)
        .set({ payToken: token, stripeCheckoutUrl: session.url, stripePaymentIntent: session.payment_intent })
        .where(eq(invoices.id, invoiceId));
    }

    return c.json({ url: session.url, token, sessionId: session.id });
  } catch (e: any) {
    return c.json({ error: e?.message || "Stripe error" }, 500);
  }
});

// POST /api/stripe/webhook
app.post("/webhook", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.text();

  try {
    const event = JSON.parse(body) as any;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
        if (inv) {
          await db.update(invoices)
            .set({ paid: inv.amount, due: 0, status: "paid" })
            .where(eq(invoices.id, invoiceId));
        }
      }
    }

    return c.json({ received: true });
  } catch {
    return c.json({ error: "Invalid payload" }, 400);
  }
});

export const stripeRoutes = app;
