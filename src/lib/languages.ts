export const LANGUAGES = [
  { id: "english", label: "English (simple)", short: "EN" },
  { id: "kiswahili", label: "Kiswahili", short: "SW" },
  { id: "sheng", label: "Sheng-flavoured English", short: "Sheng" },
  { id: "mix", label: "Mix (English + Kiswahili)", short: "Mix" },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export const DEFAULT_LANGUAGE: LanguageId = "english";

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === "string" && LANGUAGES.some((l) => l.id === value);
}

export function languageLabel(id: LanguageId): string {
  return LANGUAGES.find((l) => l.id === id)?.label ?? "English (simple)";
}
