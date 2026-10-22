// Parses the <quiz>{...}</quiz> block the tutor appends to answers.

export type Quiz = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ParsedAnswer = { text: string; quiz: Quiz | null };

function isQuiz(value: unknown): value is Quiz {
  if (!value || typeof value !== "object") return false;
  const { question, options, correctIndex, explanation } = value as Record<string, unknown>;
  return (
    typeof question === "string" &&
    Array.isArray(options) &&
    options.length >= 2 &&
    options.length <= 6 &&
    options.every((o) => typeof o === "string") &&
    typeof correctIndex === "number" &&
    Number.isInteger(correctIndex) &&
    correctIndex >= 0 &&
    correctIndex < options.length &&
    typeof explanation === "string"
  );
}

/**
 * Splits an assistant answer into visible text and an optional quiz.
 * While streaming, a partial `<quiz` tail is hidden. Invalid JSON never throws:
 * the block is stripped and the quiz is null.
 */
export function parseAnswer(raw: string): ParsedAnswer {
  const start = raw.indexOf("<quiz>");
  if (start === -1) {
    // Hide a partially streamed opening tag such as "<qu".
    const tail = raw.match(/<q?u?i?z?$/);
    const text = tail && tail[0].length > 0 ? raw.slice(0, tail.index) : raw;
    return { text: text.trimEnd(), quiz: null };
  }
  const end = raw.indexOf("</quiz>", start);
  const before = raw.slice(0, start).trimEnd();
  if (end === -1) return { text: before, quiz: null };

  const after = raw.slice(end + "</quiz>".length).trim();
  const body = raw
    .slice(start + "<quiz>".length, end)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  let quiz: Quiz | null = null;
  try {
    const parsed: unknown = JSON.parse(body);
    if (isQuiz(parsed)) quiz = parsed;
  } catch {
    quiz = null;
  }
  return { text: [before, after].filter(Boolean).join("\n\n"), quiz };
}

/** Strips a leading "A. " / "B) " style label so the UI can add its own. */
export function stripOptionLabel(option: string): string {
  return option.replace(/^\s*[A-Da-d][.):\-]\s+/, "");
}
