import { Hono } from 'hono';
import { cors } from "hono/cors";
import { env } from "cloudflare:workers";
import { createAuth } from "./auth";
import { eventsRoutes } from "./routes/events";
import { leadsRoutes } from "./routes/leads";
import { contractsRoutes, invoicesRoutes, contractorsRoutes, songRequestsRoutes, messagesRoutes, packagesRoutes, workflowsRoutes, appointmentsRoutes, notificationsRoutes } from "./routes/generic";
import { seedRoutes } from "./routes/seed";
import { aiRoutes } from "./routes/ai";
import { stripeRoutes } from "./routes/stripe";
import { pdfRoutes } from "./routes/pdf";
import { portalRoutes } from "./routes/portal";
import { emailRoutes } from "./routes/email";
import { bootstrapRoutes } from "./routes/bootstrap";
import { messagingRoutes } from "./routes/messaging";

type Variables = {
  user: any;
  session: any;
};

const app = new Hono<{ Variables: Variables }>().basePath('api');

app.use(cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET","POST","PUT","DELETE","OPTIONS"] }));

// Auth routes
app.all("/auth/*", async (c) => {
  const auth = createAuth(`${new URL(c.req.url).protocol}//${new URL(c.req.url).host}`);
  return auth.handler(c.req.raw);
});

// Ping
app.get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }));

// GET /api/me — returns current user + role
app.get('/me', async (c) => {
  try {
    const auth = createAuth(`${new URL(c.req.url).protocol}//${new URL(c.req.url).host}`);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ user: null });
    // Read role directly from DB since betterAuth may not include custom fields
    const DB = (env as any).DB;
    const row = await DB.prepare("SELECT role FROM user WHERE id = ?")
      .bind(session.user.id)
      .first()
      .catch(() => null);
    return c.json({ user: { ...session.user, role: row?.role ?? "user" } });
  } catch {
    return c.json({ user: null });
  }
});

// Resource routes
app.route("/events", eventsRoutes);
app.route("/leads", leadsRoutes);
app.route("/contracts", contractsRoutes);
app.route("/invoices", invoicesRoutes);
app.route("/contractors", contractorsRoutes);
app.route("/song-requests", songRequestsRoutes);
app.route("/messages", messagesRoutes);
app.route("/messages", messagingRoutes);
app.route("/packages", packagesRoutes);
app.route("/workflows", workflowsRoutes);
app.route("/appointments", appointmentsRoutes);
app.route("/notifications", notificationsRoutes);
app.route("/seed", seedRoutes);
app.route("/ai", aiRoutes);
app.route("/stripe", stripeRoutes);
app.route("/pdf", pdfRoutes);
app.route("/portal", portalRoutes);
app.route("/email", emailRoutes);
app.route("/bootstrap", bootstrapRoutes);

export default app;
