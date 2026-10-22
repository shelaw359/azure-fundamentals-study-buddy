// Server-only: streams tutor answers through Lovable AI Gateway.
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, convertToModelMessages, streamText, type UIMessage } from "ai";

import { isLanguageId, languageLabel } from "@/lib/languages";
import { CHAT_LIMITS, createRateLimiter } from "@/lib/rate-limit";
import { buildInstructions } from "./tutor-prompt";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "./run-id";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const limiter = createRateLimiter(CHAT_LIMITS.requestsPerWindow, CHAT_LIMITS.windowMs);

function json(status: number, body: Record<string, unknown>, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function clientKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "anonymous"
  );
}

function textOf(message: UIMessage): string {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
}

/** Keeps only user/assistant text parts and the most recent history. */
function sanitizeMessages(input: unknown): UIMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const cleaned: UIMessage[] = [];
  for (const raw of input.slice(-CHAT_LIMITS.maxHistoryMessages)) {
    if (!raw || typeof raw !== "object") return null;
    const m = raw as Partial<UIMessage>;
    if ((m.role !== "user" && m.role !== "assistant") || !Array.isArray(m.parts)) return null;
    const parts = m.parts
      .filter((p): p is { type: "text"; text: string } => p?.type === "text" && typeof (p as { text?: unknown }).text === "string")
      .map((p) => ({ type: "text" as const, text: p.text.slice(0, 6000) }));
    if (parts.length === 0) continue;
    cleaned.push({ id: String(m.id ?? crypto.randomUUID()), role: m.role, parts });
  }
  return cleaned.length > 0 ? cleaned : null;
}

function gatewayMessage(error: APICallError): string | undefined {
  try {
    const body = JSON.parse(error.responseBody ?? "") as { message?: unknown; error?: { message?: unknown } };
    const msg = body.message ?? body.error?.message;
    return typeof msg === "string" ? msg : undefined;
  } catch {
    return undefined;
  }
}

function friendlyError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) return "RATE_LIMIT: The study buddy is busy right now. Please wait a moment and try again.";
    if (error.statusCode === 402)
      return `CREDITS: ${gatewayMessage(error) ?? "AI credits for this app have run out. The app owner needs to add credits."}`;
    if (error.statusCode === 403)
      return `BLOCKED: ${gatewayMessage(error) ?? "AI access is currently blocked for this app."}`;
  }
  console.error("Tutor stream error", error);
  return "Something went wrong, please try again.";
}

export async function handleChat(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return json(500, { error: "The AI service is not configured yet." });

  const limit = limiter.check(clientKey(request));
  if (!limit.allowed) {
    return json(
      429,
      { error: `You're sending messages very fast. Please wait ${limit.retryAfterSeconds}s and try again.` },
      { "Retry-After": String(limit.retryAfterSeconds) },
    );
  }

  let body: { messages?: unknown; language?: unknown; topic?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages) return json(400, { error: "Please type a question first." });

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return json(400, { error: "Please type a question first." });
  if (textOf(last).length > CHAT_LIMITS.maxMessageChars) {
    return json(400, { error: `Please keep your message under ${CHAT_LIMITS.maxMessageChars} characters.` });
  }

  const language = isLanguageId(body.language) ? body.language : "english";
  const topic =
    typeof body.topic === "string" && body.topic.trim() ? body.topic.trim().slice(0, 120) : "General AZ-900";

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: provider.responses(MODEL),
    instructions: buildInstructions(languageLabel(language), topic),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return withLovableAiGatewayRunIdHeader(
    result.toUIMessageStreamResponse({
      originalMessages: messages,
      sendReasoning: true,
      onError: friendlyError,
    }),
    runIdFetch,
  );
}
