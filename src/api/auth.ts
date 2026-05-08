import { env } from "cloudflare:workers";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { autumn } from "autumn-js/better-auth";
import * as schema from "./database/schema";

const db = drizzle(env.DB, { schema });

export const createAuth = (baseURL: string) =>
  betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    emailAndPassword: { enabled: true },
    secret: env.BETTER_AUTH_SECRET,
    baseURL,
    trustedOrigins: async (request) => {
      const origin = request?.headers.get("origin");
      if (origin) return [origin];
      return [];
    },
    plugins: [autumn()],
  });

export const auth = createAuth("https://localhost:6450");
