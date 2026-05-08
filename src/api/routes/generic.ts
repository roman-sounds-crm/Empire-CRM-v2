import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { contracts, invoices, contractors, songRequests, messages, packages, workflows, appointments, notifications } from "../database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

function crudRoutes(table: any) {
  const router = new Hono();
  router.get("/", async (c) => {
    const db = drizzle(env.DB);
    const all = await db.select().from(table);
    return c.json(all);
  });
  router.post("/", async (c) => {
    const db = drizzle(env.DB);
    const body = await c.req.json();
    const id = nanoid();
    const [created] = await db.insert(table).values({ id, ...body }).returning();
    return c.json(created, 201);
  });
  router.put("/:id", async (c) => {
    const db = drizzle(env.DB);
    const id = c.req.param("id");
    const body = await c.req.json();
    const [updated] = await db.update(table).set(body).where(eq(table.id, id)).returning();
    return c.json(updated);
  });
  router.delete("/:id", async (c) => {
    const db = drizzle(env.DB);
    const id = c.req.param("id");
    await db.delete(table).where(eq(table.id, id));
    return c.json({ success: true });
  });
  return router;
}

export const contractsRoutes = crudRoutes(contracts);
export const invoicesRoutes = crudRoutes(invoices);
export const contractorsRoutes = crudRoutes(contractors);
export const songRequestsRoutes = crudRoutes(songRequests);
export const messagesRoutes = crudRoutes(messages);
export const packagesRoutes = crudRoutes(packages);
export const workflowsRoutes = crudRoutes(workflows);
export const appointmentsRoutes = crudRoutes(appointments);
export const notificationsRoutes = crudRoutes(notifications);
