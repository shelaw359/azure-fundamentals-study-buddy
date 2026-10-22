import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  AlertTriangle,
  Languages,
  LifeBuoy,
  Menu,
  RotateCcw,
  ShieldAlert,
  SquarePen,
} from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.png";
import { useOnline } from "@/hooks/use-online";
import { usePersistentState } from "@/hooks/use-persistent-state";
import { DEFAULT_LANGUAGE, isLanguageId, LANGUAGES, type LanguageId } from "@/lib/languages";
import { registerAppServiceWorker } from "@/lib/pwa";
import { parseAnswer } from "@/lib/quiz";
import { CHAT_LIMITS } from "@/lib/rate-limit";
import { ChatMessage, messageText } from "./ChatMessage";
import { GlossarySheet } from "./GlossarySheet";
import { InstallButton } from "./InstallButton";
import { OfflineBanner } from "./OfflineBanner";
import { ScoreRing } from "./ScoreRing";
import { ThemeToggle } from "./ThemeToggle";
import { TopicNav } from "./TopicNav";
import { WelcomeCard } from "./WelcomeCard";

const CHAT_KEY = "az900-chat";
const DEFAULT_TOPIC = "General AZ-900";
const LEARN_URL = "https://learn.microsoft.com/credentials/certifications/azure-fundamentals/";

const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number";
const isAnswers = (v: unknown): v is Record<string, number> =>
  !!v && typeof v === "object" && Object.values(v).every((x) => typeof x === "number");

/** Turns transport/stream errors into a friendly sentence. */
function describeError(error: Error): string {
  let msg = error.message ?? "";
  try {
    const parsed = JSON.parse(msg) as { error?: unknown };
    if (typeof parsed.error === "string") msg = parsed.error;
  } catch {
    /* not JSON */
  }
  msg = msg.replace(/^(RATE_LIMIT|CREDITS|BLOCKED):\s*/, "");
  if (/failed to fetch|networkerror|load failed|network/i.test(msg)) {
    return "Can't reach the Study Buddy. Check your internet connection and try again.";
  }
  return msg.trim() || "Something went wrong, please try again.";
}

async function celebrate() {
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 120,
    spread: 75,
    origin: { y: 0.7 },
    colors: ["#0f6b78", "#f2b544", "#2fa36b", "#ffffff"],
  });
}

export function StudyApp() {
  const online = useOnline();
  const [language, setLanguage] = usePersistentState<LanguageId>(
    "az900-language",
    DEFAULT_LANGUAGE,
    isLanguageId,
  );
  const [topic, setTopic] = usePersistentState<string>("az900-topic", DEFAULT_TOPIC, isString);
  const [answers, setAnswers] = usePersistentState<Record<string, number>>(
    "az900-answers",
    {},
    isAnswers,
  );
  const [streak, setStreak] = usePersistentState<number>("az900-streak", 0, isNumber);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [chatHydrated, setChatHydrated] = useState(false);

  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, setMessages, status, error, regenerate, stop, clearError } =
    useChat({
      id: "az900-main",
      transport,
    });
  const busy = status === "submitted" || status === "streaming";

  // Register the offline app-shell worker (no-op in preview/dev).
  useEffect(() => {
    void registerAppServiceWorker();
  }, []);

  // Restore saved chat once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as UIMessage[];
        if (Array.isArray(saved)) setMessages(saved);
      }
    } catch {
      /* ignore corrupt history */
    }
    setChatHydrated(true);
  }, [setMessages]);

  // Save chat whenever a reply finishes.
  useEffect(() => {
    if (!chatHydrated || busy) return;
    try {
      localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
    } catch {
      /* storage full */
    }
  }, [messages, busy, chatHydrated]);

  // Keep the composer focused on devices with a real keyboard.
  useEffect(() => {
    if (busy || !chatHydrated) return;
    if (window.matchMedia("(pointer: fine)").matches)
      document.getElementById("chat-input")?.focus();
  }, [busy, chatHydrated]);

  const score = useMemo(() => {
    let correct = 0;
    let answered = 0;
    for (const m of messages) {
      if (m.role !== "assistant" || answers[m.id] === undefined) continue;
      const quiz = parseAnswer(messageText(m)).quiz;
      if (!quiz) continue;
      answered += 1;
      if (answers[m.id] === quiz.correctIndex) correct += 1;
    }
    return { correct, answered };
  }, [messages, answers]);

  const ask = useCallback(
    (text: string, nextTopic?: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!online) {
        toast.error("You're offline. Reconnect to get new answers.");
        return;
      }
      if (busy) return;
      if (trimmed.length > CHAT_LIMITS.maxMessageChars) {
        toast.error(`Please keep your message under ${CHAT_LIMITS.maxMessageChars} characters.`);
        return;
      }
      if (nextTopic) setTopic(nextTopic);
      clearError();
      void sendMessage({ text: trimmed }, { body: { language, topic: nextTopic ?? topic } });
    },
    [online, busy, setTopic, clearError, sendMessage, language, topic],
  );

  const retry = () => {
    if (!online) {
      toast.error("You're still offline. Reconnect and try again.");
      return;
    }
    clearError();
    void regenerate({ body: { language, topic } });
  };

  const handleSubmit = (msg: PromptInputMessage) => ask(msg.text);

  const handleAnswer = (messageId: string, index: number, correct: boolean) => {
    if (answers[messageId] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [messageId]: index }));
    const next = correct ? streak + 1 : 0;
    setStreak(next);
    if (correct && next > 0 && next % 3 === 0) {
      void celebrate();
      toast.success(`${next} in a row! Hongera! 🎉`);
    }
  };

  const newChat = () => {
    void stop();
    setMessages([]);
    setAnswers({});
    setStreak(0);
    setTopic(DEFAULT_TOPIC);
    clearError();
    localStorage.removeItem(CHAT_KEY);
  };

  const selectTopic = (item: string, domain: string) => {
    setTopicsOpen(false);
    ask(`Explain ${item} (from "${domain}").`, item);
  };

  const hasAssistant = messages.some((m) => m.role === "assistant");
  const last = messages[messages.length - 1];

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:px-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full lg:hidden"
            aria-label="Open topics"
            onClick={() => setTopicsOpen(true)}
          >
            <Menu aria-hidden />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <img
              src={logo}
              alt="AZ-900 Study Buddy cloud logo"
              width={36}
              height={36}
              className="size-9 shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight sm:text-lg">
                AZ-900 Study Buddy
              </h1>
              <p className="truncate text-xs text-muted-foreground">Learn Azure the African way</p>
            </div>
          </div>
          <ScoreRing correct={score.correct} answered={score.answered} />
          <ThemeToggle />
          <div className="flex w-full items-center gap-1 sm:w-auto">
            <Select value={language} onValueChange={(v) => isLanguageId(v) && setLanguage(v)}>
              <SelectTrigger
                className="h-9 flex-1 gap-2 rounded-full sm:w-52 sm:flex-none"
                aria-label="Language"
              >
                <Languages className="size-4 shrink-0 text-primary" aria-hidden />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <GlossarySheet onPick={(term) => ask(`Explain the term "${term}".`, term)} />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="New chat"
              onClick={newChat}
            >
              <SquarePen aria-hidden />
            </Button>
            <InstallButton />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 border-t border-border bg-amber-soft px-3 py-1.5 text-center text-xs font-semibold text-amber-foreground dark:text-amber">
          <ShieldAlert className="size-3.5 shrink-0" aria-hidden />
          Unofficial study tool, not affiliated with Microsoft
        </div>
      </header>

      {!online && <OfflineBanner />}

      <div className="flex min-h-0 flex-1">
        {/* Desktop topic sidebar */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 lg:block">
          <TopicNav currentTopic={topic} onSelect={selectTopic} disabled={busy} />
        </aside>

        {/* Mobile topic drawer */}
        <Sheet open={topicsOpen} onOpenChange={setTopicsOpen}>
          <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto bg-sidebar p-4">
            <SheetHeader className="mb-2 p-0">
              <SheetTitle className="font-display">AZ-900 topics</SheetTitle>
              <SheetDescription>Pick a sub-topic to get a fresh explanation.</SheetDescription>
            </SheetHeader>
            <TopicNav currentTopic={topic} onSelect={selectTopic} disabled={busy} />
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col">
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-3 py-5 sm:px-6">
              {!chatHydrated ? (
                <div className="flex flex-col gap-3" aria-label="Loading your chat">
                  <Skeleton className="h-40 w-full rounded-3xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ) : messages.length === 0 ? (
                <WelcomeCard onPick={(p) => ask(p)} disabled={busy} />
              ) : (
                messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    streaming={status === "streaming" && m.id === last?.id}
                    busy={busy}
                    selected={answers[m.id]}
                    onAnswer={handleAnswer}
                    onAsk={(p) => ask(p)}
                  />
                ))
              )}

              {status === "submitted" && (
                <div className="flex items-center gap-2" aria-live="polite">
                  <img src={logo} alt="" width={24} height={24} className="size-6 rounded-md" />
                  <Shimmer>Study Buddy is thinking…</Shimmer>
                </div>
              )}

              {error && !busy && (
                <div
                  role="alert"
                  className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-danger-soft p-4 text-sm animate-rise sm:flex-row sm:items-center"
                >
                  <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden />
                  <p className="flex-1">{describeError(error)}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retry}
                    className="h-10 rounded-full px-4"
                  >
                    <RotateCcw aria-hidden /> Retry
                  </Button>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Composer */}
          <div className="border-t border-border bg-background/95 px-3 pb-3 pt-2 sm:px-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="amber"
                  size="sm"
                  className="h-9 rounded-full px-4"
                  disabled={!hasAssistant || busy}
                  onClick={() =>
                    ask(
                      "I'm lost. Please re-explain your last answer using a much simpler analogy and shorter sentences.",
                    )
                  }
                >
                  <LifeBuoy aria-hidden /> I'm lost
                </Button>
                <span className="truncate text-xs text-muted-foreground">
                  Topic: <span className="font-semibold text-foreground">{topic}</span>
                </span>
              </div>
              <PromptInput onSubmit={handleSubmit} className="rounded-2xl bg-card shadow-soft">
                <PromptInputTextarea
                  id="chat-input"
                  placeholder="Ask about any AZ-900 topic…"
                  maxLength={CHAT_LIMITS.maxMessageChars}
                  aria-label="Your question"
                  className="text-[15px]"
                />
                <PromptInputFooter className="justify-between">
                  <span className="pl-1 text-[11px] text-muted-foreground">
                    Enter to send · Shift+Enter for a new line
                  </span>
                  <PromptInputSubmit
                    status={status}
                    onStop={() => void stop()}
                    aria-label={busy ? "Stop" : "Send"}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </main>
      </div>

      <footer className="border-t border-border bg-card px-3 py-2 text-center text-[11px] text-muted-foreground">
        Unofficial study aid. Always confirm details on{" "}
        <a
          href={LEARN_URL}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-primary underline underline-offset-2"
        >
          Microsoft Learn
        </a>
        .
      </footer>
    </div>
  );
}
