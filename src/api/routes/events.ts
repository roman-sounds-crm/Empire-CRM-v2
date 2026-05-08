import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { events } from "../database/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const eventsRoutes = new Hono();

eventsRoutes.get("/", async (c) => {
  const db = drizzle(env.DB);
  const all = await db.select().from(events).orderBy(events.date);
  return c.json(all);
});

eventsRoutes.post("/", async (c) => {
  const db = drizzle(env.DB);
  const body = await c.req.json();
  const id = nanoid();
  const [created] = await db.insert(events).values({ id, ...body }).returning();
  return c.json(created, 201);
});

eventsRoutes.put("/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  const body = await c.req.json();
  const [updated] = await db.update(events).set({ ...body, updatedAt: new Date().toISOString() }).where(eq(events.id, id)).returning();
  return c.json(updated);
});

eventsRoutes.delete("/:id", async (c) => {
  const db = drizzle(env.DB);
  const id = c.req.param("id");
  await db.delete(events).where(eq(events.id, id));
  return c.json({ success: true });
});
