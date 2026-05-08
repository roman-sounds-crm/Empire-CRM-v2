import type { Plugin } from "vite";
import { execSync } from "child_process";

/**
 * Vite plugin that adds a /__email_relay endpoint.
 * The Cloudflare Worker can't run CLI commands, so it calls this Node-side endpoint instead.
 */
export default function emailRelayPlugin(): Plugin {
  return {
    name: "email-relay",
    configureServer(server) {
      server.middlewares.use("/__email_relay", async (req, res) => {
        if (req.method !== "POST") {
          res.writeHead(405);
          res.end("Method Not Allowed");
          return;
        }

        let body = "";
        req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
        req.on("end", () => {
          try {
            const { to, subject, html } = JSON.parse(body);
            if (!to || !subject || !html) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "to, subject, html required" }));
              return;
            }

            // Use the send-email CLI
            execSync(`send-email --to "${to}" --subject "${subject.replace(/"/g, "'")}" --html -`, {
              input: html,
              encoding: "utf8",
              stdio: ["pipe", "pipe", "pipe"],
            });

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: true }));
          } catch (err: any) {
            console.error("[email-relay] Error:", err.message);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}
