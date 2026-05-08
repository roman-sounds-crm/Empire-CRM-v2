import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { leads } from "../database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const leadsRoutes = new Hono();

leadsRoutes.get("/", async (c) => {
  const db = drizzle(env.DB);
  const all = await db.select().from(leads).orderBy(leads.createdAt);
  return c.json(all);
});

leadsRoutes.post("/", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const id = nanoid();
  const [created] = await db.insert(leads).values({ id, ...body }).returning();
  return c.json(created, 201);
});

leadsRoutes.put("/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  const body = await c.req.json();
  const [updated] = await db.update(leads).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(leads.id, id)).returning();
  return c.json(updated);
});

leadsRoutes.delete("/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  await db.delete(leads).where(eq(leads.id, id));
  return c.json({ success: true });
});
