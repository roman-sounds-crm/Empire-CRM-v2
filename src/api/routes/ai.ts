import { Hono } from "hono";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { env } from "cloudflare:workers";

export const aiRoutes = new Hono();

aiRoutes.post("/revise", async (c) => {
  const { content, type, context } = await c.req.json();

  if (!content) return c.json({ error: "Content required" }, 400);

  const openai = createOpenAI({
    baseURL: env.AI_GATEWAY_BASE_URL,
    apiKey: env.AI_GATEWAY_API_KEY,
  });

  const systemPrompt = `You are a professional DJ business communication assistant for Empire CRM. 
Your job is to revise and improve ${type || "messages"} to be professional, warm, and persuasive.
Context about the DJ business: ${context || "A professional mobile DJ service for weddings, corporate events, and private parties."}
Return ONLY the revised text, no explanations, no quotes around it.`;

  const { text } = await generateText({
    model: openai.chat("openai/gpt-5-mini"),
    system: systemPrompt,
    prompt: `Revise the following to be more professional and compelling:\n\n${content}`,
    maxTokens: 500,
  });

  return c.json({ revised: text });
});

aiRoutes.post("/generate", async (c) => {
  const { type, context, tone } = await c.req.json();

  const openai = createOpenAI({
    baseURL: env.AI_GATEWAY_BASE_URL,
    apiKey: env.AI_GATEWAY_API_KEY,
  });

  const prompts: Record<string, string> = {
    "follow-up-email": `Write a professional DJ services follow-up email for this context: ${context}. Tone: ${tone || "friendly and professional"}. Subject line first, then body.`,
    "sms": `Write a concise, friendly SMS message for a DJ business. Context: ${context}. Keep it under 160 characters.`,
    "contract-clause": `Write a professional contract clause for a DJ services agreement. Context: ${context}.`,
    "invoice-note": `Write a professional invoice note/message. Context: ${context}.`,
  };

  const { text } = await generateText({
    model: openai.chat("openai/gpt-5-mini"),
    prompt: prompts[type] || `Write professional DJ business content. Context: ${context}`,
    maxTokens: 600,
  });

  return c.json({ generated: text });
});
