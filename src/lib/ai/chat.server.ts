
 // Server-only: streams tutor answers through the Groq API.
 // The API key and tutor instructions stay on the server.

import { createOpenAI } from "@ai-sdk/openai";
import {
  APICallError,
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import { isLanguageId, languageLabel } from "@/lib/languages";
import { CHAT_LIMITS, createRateLimiter } from "@/lib/rate-limit";
import { buildInstructions } from "./tutor-prompt";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Replacement for the deprecated Llama 3.3 70B model.
const DEFAULT_MODEL = "openai/gpt-oss-120b";

const limiter = createRateLimiter(
  CHAT_LIMITS.requestsPerWindow,
  CHAT_LIMITS.windowMs,
);

function json(
  status: number,
  body: Record<string, unknown>,
  headers?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
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
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** Keep only user/assistant text and the most recent messages. */
function sanitizeMessages(input: unknown): UIMessage[] | null {
  if (!Array.isArray(input) || input.length === 0) {
    return null;
  }

  const cleaned: UIMessage[] = [];

  for (const raw of input.slice(-CHAT_LIMITS.maxHistoryMessages)) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const message = raw as Partial<UIMessage>;

    if (
      (message.role !== "user" && message.role !== "assistant") ||
      !Array.isArray(message.parts)
    ) {
      return null;
    }

    const parts = message.parts
      .filter(
        (part): part is { type: "text"; text: string } =>
          part?.type === "text" &&
          typeof (part as { text?: unknown }).text === "string",
      )
      .map((part) => ({
        type: "text" as const,
        text: part.text.slice(0, 6000),
      }));

    if (parts.length === 0) {
      continue;
    }

    cleaned.push({
      id: String(message.id ?? crypto.randomUUID()),
      role: message.role,
      parts,
    });
  }

  return cleaned.length > 0 ? cleaned : null;
}

function friendlyError(error: unknown): string {
  if (APICallError.isInstance(error)) {
    if (error.statusCode === 429) {
      return "RATE_LIMIT: The study buddy is busy right now. Please wait a moment and try again.";
    }

    if (error.statusCode === 401) {
      return "BLOCKED: The AI service key was rejected. Please check GROQ_API_KEY.";
    }

    if (error.statusCode === 402 || error.statusCode === 403) {
      return "BLOCKED: The Groq account does not have access to this request. Check your account and model access.";
    }

    if (error.statusCode === 404) {
      return "MODEL_ERROR: The configured Groq model was not found or is unavailable to your account. Check GROQ_MODEL and use an active model ID.";
    }
  }

  console.error("Tutor stream error", error);

  if (APICallError.isInstance(error)) {
    const detail = String(error.message ?? "")
      .replace(/\s+/g, " ")
      .slice(0, 160);

    return `Something went wrong, please try again. (AI service ${error.statusCode ?? "error"}: ${detail})`;
  }

  return "Something went wrong, please try again.";
}

export async function handleChat(request: Request): Promise<Response> {
  const apiKey =
    process.env["GROQ_API_KEY"] ??
    process.env["Groq_API_Key"];

  if (!apiKey) {
    return json(500, {
      error: "The AI service is not configured yet.",
    });
  }

  // An environment variable overrides the default model.
  // Ensure GROQ_MODEL does not still contain the deprecated model ID.
  const model =
    process.env["GROQ_MODEL"]?.trim() || DEFAULT_MODEL;

  const limit = limiter.check(clientKey(request));

  if (!limit.allowed) {
    return json(
      429,
      {
        error: `You're sending messages very fast. Please wait ${limit.retryAfterSeconds}s and try again.`,
      },
      {
        "Retry-After": String(limit.retryAfterSeconds),
      },
    );
  }

  let body: {
    messages?: unknown;
    language?: unknown;
    topic?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid request." });
  }

  const messages = sanitizeMessages(body.messages);

  if (!messages) {
    return json(400, {
      error: "Please type a question first.",
    });
  }

  const last = messages[messages.length - 1];

  if (!last || last.role !== "user") {
    return json(400, {
      error: "Please type a question first.",
    });
  }

  if (textOf(last).length > CHAT_LIMITS.maxMessageChars) {
    return json(400, {
      error: `Please keep your message under ${CHAT_LIMITS.maxMessageChars} characters.`,
    });
  }

  const language = isLanguageId(body.language)
    ? body.language
    : "english";

  const topic =
    typeof body.topic === "string" && body.topic.trim()
      ? body.topic.trim().slice(0, 120)
      : "General AZ-900";

  const provider = createOpenAI({
    baseURL: GROQ_BASE_URL,
    apiKey,
  });

  const result = streamText({
    model: provider.chat(model),
    instructions: buildInstructions(
      languageLabel(language),
      topic,
    ),
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onError: friendlyError,
  });
}
