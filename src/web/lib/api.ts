// API helper — thin wrapper over fetch for Empire CRM API
const BASE = "/api";

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: any) => request<T>("POST", path, body),
  put: <T>(path: string, body: any) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),

  // AI helpers
  revise: (content: string, type: string, context?: string) =>
    request<{ revised: string }>("POST", "/ai/revise", { content, type, context }),
  generate: (type: string, context: string, tone?: string) =>
    request<{ generated: string }>("POST", "/ai/generate", { type, context, tone }),

  // Seed
  seed: () => request("POST", "/seed", {}),
};
