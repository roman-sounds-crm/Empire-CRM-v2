import { Hono } from "hono";
import { env } from "cloudflare:workers";

const app = new Hono();

const ADMIN_EMAIL = "randy@romansounds.com";
const SECRET = "romansounds-bootstrap-2025";

app.post("/", async (c) => {
  if (c.req.query("secret") !== SECRET) return c.json({ error: "Invalid secret" }, 403);

  const DB = (env as any).DB;

  // Step 1: add role column if missing (safe to run multiple times)
  try {
    await DB.exec("ALTER TABLE user ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  } catch (_) {
    // column already exists — fine
  }

  // Step 2: check the account exists
  const check = await DB.prepare("SELECT id, email, role FROM user WHERE email = ?")
    .bind(ADMIN_EMAIL)
    .first();

  if (!check) {
    return c.json({
      error: `No account found for ${ADMIN_EMAIL}. Make sure you have signed up first.`
    }, 404);
  }

  if (check.role === "admin") {
    return c.json({ success: true, message: "Already admin — you're good! Go sign in." });
  }

  // Step 3: promote to admin
  await DB.prepare("UPDATE user SET role = 'admin' WHERE email = ?")
    .bind(ADMIN_EMAIL)
    .run();

  return c.json({ success: true, message: `✅ Done! ${ADMIN_EMAIL} is now admin. Go sign in.` });
});

export const bootstrapRoutes = app;
