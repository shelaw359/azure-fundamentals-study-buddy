import type { UIMessage } from "ai";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { parseAnswer } from "@/lib/quiz";
import { QuizCard } from "./QuizCard";

export const QUICK_ACTIONS = [
  { label: "Simpler", prompt: "Explain that again in simpler words." },
  { label: "Give another African example", prompt: "Give me another African example for that." },
  { label: "Quiz me", prompt: "Quiz me on this with another check question." },
  {
    label: "Compare with something similar",
    prompt: "Compare this with a similar Azure concept that learners often confuse it with.",
  },
  { label: "Explain in Swahili", prompt: "Please explain that in Kiswahili (keep the Azure terms in English)." },
];

export function messageText(message: UIMessage): string {
  return message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

type Props = {
  message: UIMessage;
  streaming: boolean;
  busy: boolean;
  selected: number | undefined;
  onAnswer: (messageId: string, index: number, correct: boolean) => void;
  onAsk: (prompt: string) => void;
};

export function ChatMessage({ message, streaming, busy, selected, onAnswer, onAsk }: Props) {
  if (message.role === "user") {
    return (
      <Message from="user" className="animate-rise">
        <MessageContent className="group-[.is-user]:rounded-2xl group-[.is-user]:rounded-br-md group-[.is-user]:bg-chat-user group-[.is-user]:text-chat-user-foreground text-[15px] leading-relaxed whitespace-pre-wrap">
          {messageText(message)}
        </MessageContent>
      </Message>
    );
  }

  const { text, quiz } = parseAnswer(messageText(message));
  const waitingForText = streaming && text.length === 0;

  return (
    <Message from="assistant" className="max-w-full animate-rise">
      <div className="flex items-center gap-2">
        <img src={logo} alt="" width={24} height={24} className="size-6 rounded-md" />
        <span className="text-xs font-semibold text-muted-foreground">Study Buddy</span>
      </div>
      <MessageContent className="w-full text-[15px] leading-relaxed">
        {waitingForText ? (
          <Shimmer>Study Buddy is thinking…</Shimmer>
        ) : (
          <MessageResponse isAnimating={streaming}>{text}</MessageResponse>
        )}
      </MessageContent>

      {!streaming && quiz && (
        <QuizCard
          quiz={quiz}
          selected={selected}
          busy={busy}
          onAnswer={(i) => onAnswer(message.id, i, i === quiz.correctIndex)}
          onNext={() => onAsk("Give me another check question on this topic.")}
          onExplainMore={() => onAsk("Explain more about the answer to that check question.")}
        />
      )}

      {!streaming && text && (
        <MessageActions className="flex-wrap gap-1.5">
          <MessageAction
            tooltip="Copy answer"
            label="Copy answer"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                toast.success("Copied to clipboard");
              } catch {
                toast.error("Couldn't copy. Please select the text instead.");
              }
            }}
          >
            <Copy className="size-4" />
          </MessageAction>
          {QUICK_ACTIONS.map((a) => (
            <Button
              key={a.label}
              variant="chip"
              size="xs"
              disabled={busy}
              onClick={() => onAsk(a.prompt)}
              className="h-8 px-3"
            >
              {a.label}
            </Button>
          ))}
        </MessageActions>
      )}
    </Message>
  );
}
