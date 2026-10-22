import { describe, expect, it } from "vitest";

import { parseAnswer } from "@/lib/quiz";
import { CHAT_LIMITS, createRateLimiter } from "@/lib/rate-limit";
import { isLanguageId, LANGUAGES } from "@/lib/languages";
import { DOMAINS } from "@/lib/topics";
import { GLOSSARY } from "@/lib/glossary";
import { buildInstructions } from "@/lib/ai/tutor-prompt";

const QUIZ =
  '{"question":"Q?","options":["A. one","B. two","C. three","D. four"],"correctIndex":1,"explanation":"Because."}';

describe("quiz parsing", () => {
  it("extracts the quiz and strips it from visible text", () => {
    const r = parseAnswer(`Hello there.\n\n<quiz>${QUIZ}</quiz>`);
    expect(r.text).toBe("Hello there.");
    expect(r.quiz?.correctIndex).toBe(1);
    expect(r.quiz?.options).toHaveLength(4);
  });

  it("shows text without crashing when quiz JSON is invalid", () => {
    const r = parseAnswer("Answer text <quiz>{not json}</quiz>");
    expect(r.text).toBe("Answer text");
    expect(r.quiz).toBeNull();
  });

  it("rejects a quiz whose correctIndex is out of range", () => {
    const bad = QUIZ.replace('"correctIndex":1', '"correctIndex":7');
    expect(parseAnswer(`x <quiz>${bad}</quiz>`).quiz).toBeNull();
  });

  it("hides a partially streamed quiz block", () => {
    expect(parseAnswer('Text <quiz>{"question":"Q').text).toBe("Text");
    expect(parseAnswer("Text <qu").text).toBe("Text");
  });
});

describe("backend limits", () => {
  it("allows 15 requests per minute then blocks", () => {
    const limiter = createRateLimiter(CHAT_LIMITS.requestsPerWindow, CHAT_LIMITS.windowMs);
    for (let i = 0; i < 15; i++) expect(limiter.check("ip", 1000).allowed).toBe(true);
    const blocked = limiter.check("ip", 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(60);
    expect(limiter.check("ip", 1000 + 60_000).allowed).toBe(true);
  });

  it("caps learner messages at 1000 characters", () => {
    expect(CHAT_LIMITS.maxMessageChars).toBe(1000);
  });
});

describe("content rules", () => {
  it("offers the four required languages", () => {
    expect(LANGUAGES.map((l) => l.id)).toEqual(["english", "kiswahili", "sheng", "mix"]);
    expect(isLanguageId("klingon")).toBe(false);
  });

  it("uses the AZ-900 exam weightings", () => {
    expect(DOMAINS.map((d) => d.weight)).toEqual(["25–30%", "35–40%", "30–35%"]);
  });

  it("has about 30 glossary terms", () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(30);
  });

  it("appends language and topic to the system prompt", () => {
    const p = buildInstructions("Kiswahili", "Regions");
    expect(p.startsWith("You are AZ-900 Study Buddy")).toBe(true);
    expect(p.endsWith("Selected language: Kiswahili\nCurrent topic: Regions")).toBe(true);
  });
});
