# AZ-900 Study Buddy (Unofficial)

> **Learn Azure the African way.**
> An unofficial AI study assistant for learners preparing for the Microsoft Azure Fundamentals (AZ-900) certification. Built for a learning hackathon.

---

## Problem statement

Cloud concepts like "elasticity", "availability zones" or "the shared responsibility model" are abstract. Most study material assumes a Western context and fluent technical English, which makes AZ-900 harder than it needs to be for many African learners.

## Solution overview

AZ-900 Study Buddy is a mobile-first chat tutor that:

- explains every concept in plain words, with a real-life African analogy (M-Pesa, SACCOs, matatus, mama mboga, dukas, farms, schools, banks);
- can answer in English, Kiswahili, Sheng-flavoured English or a mix — while always keeping official Azure terms in English so learners recognise them in the exam;
- ends every explanation with one original multiple-choice check question, rendered as an interactive card with instant feedback.

## Features

- **Topic navigator** based on the public AZ-900 skills outline, with exam weightings (25–30%, 35–40%, 30–35%). Collapsible drawer on mobile.
- **Streaming chat** with markdown, typing indicator, copy button and auto-scroll.
- **Quick actions** under every answer: Simpler · Give another African example · Quiz me · Compare with something similar · Explain in Swahili.
- **Check-question cards** (A–D) with correct/incorrect feedback, explanation, "Next question" and "Explain more".
- **Session score** with a progress ring in the header, and confetti for every 3 correct answers in a row.
- **"I'm lost" button** – re-explains the last answer with a much simpler analogy.
- **Mini glossary** – 36 searchable terms with original one-line definitions; tap to get a full explanation.
- **Language selector** – English (simple), Kiswahili, Sheng-flavoured English, Mix.
- **Dark / light mode.**
- **Saved progress** – chat history, topic, language and score are kept in the browser (localStorage). No login.
- **Installable app (PWA)** – "Install app" button when the browser supports it, teal theme, standalone display, cloud app icons (192 and 512 px).
- **Offline-friendly** – the app shell is cached by a service worker so it opens quickly; with no internet you see a friendly offline message, and your saved chat and glossary still work.
- Friendly loading skeletons, clear error messages with a Retry button, graceful handling of rate limits and network failure.

## Screenshots

_Add screenshots here (mobile 375px, desktop, dark mode, quiz card)._

## Tech stack

- **TanStack Start** (React 19 + TypeScript, SSR) on Vite
- **Tailwind CSS v4** + shadcn/ui + AI Elements chat components
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/openai`) streaming through **Lovable AI** (Lovable AI Gateway)
- **vite-plugin-pwa** (Workbox `generateSW`) for the service worker
- `canvas-confetti` for celebrations
- Vitest for rule tests

## Prompt engineering

The system prompt (`src/lib/ai/tutor-prompt.ts`) is used verbatim on the server and has five deliberate blocks:

1. **Scope** – only AZ-900 topics; politely steer off-topic questions back.
2. **Teaching style** – a fixed 5-step shape: one-sentence definition → one accurate African analogy (and where it breaks down) → how it appears in Azure with correct service names → an "Exam tip" line → under 200 words.
3. **Accuracy rules** – based on the public skills outline; admit uncertainty and point to Microsoft Learn; never invent services, prices, limits or SLAs; never reproduce real exam questions.
4. **Language rules** – reply in the selected language, keep Azure terms in English, keep Sheng light.
5. **Structured quiz output** – one original 4-option question at the end inside `<quiz>…</quiz>` as strict JSON (`question`, `options`, `correctIndex`, `explanation`). The frontend parses it, strips it from the visible text and renders the interactive card. If the JSON is invalid, the text is shown and nothing crashes.

On every request the server appends `Selected language: …` and `Current topic: …`.

## Setup

```sh
bun install
bun run dev
```

### Environment variables

| Name | Where | Purpose |
| --- | --- | --- |
| `LOVABLE_API_KEY` | server only | Authenticates calls to Lovable AI. Provisioned automatically in Lovable. Never exposed to the browser. |

The AI call lives in a server route (`/api/chat`). The key is read from the server environment inside the request handler.

### Backend safeguards

- Learner messages are limited to 1,000 characters; only the last 20 messages are sent to the model.
- Basic per-client rate limiting: 15 requests per minute (returns HTTP 429 with a friendly message).

## Deployment

1. Open the project in Lovable and click **Publish**.
2. The service worker and offline support only run on the published site (they are switched off in the editor preview on purpose).
3. On a phone, open the published link and tap **Install app** (Android/Chrome/Edge) or use **Share → Add to Home Screen** (iPhone).

Run tests with `bunx vitest run`.

## Limitations

- AI answers can be wrong — always confirm on [Microsoft Learn](https://learn.microsoft.com/credentials/certifications/azure-fundamentals/).
- New answers need an internet connection; offline mode shows saved content only.
- Rate limiting is in-memory per server instance, so it is a basic guard rather than a strict quota.
- Progress is saved per browser and is lost if browser data is cleared.

## Future improvements

- Spaced repetition for missed check questions
- More certifications (AI-900, SC-900, DP-900)
- Richer offline mode (downloadable topic packs)
- More African languages (Luganda, Kinyarwanda, Amharic, Yoruba, Zulu…)

## Disclaimer

**Unofficial, not affiliated with Microsoft.** AZ-900 Study Buddy is an independent study aid. Microsoft, Azure and related names are trademarks of Microsoft Corporation. No Microsoft logos or exam content are used. All explanations, glossary text and questions are original.
