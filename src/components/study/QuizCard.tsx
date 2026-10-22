import { CheckCircle2, HelpCircle, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { stripOptionLabel, type Quiz } from "@/lib/quiz";
import { cn } from "@/lib/utils";

type Props = {
  quiz: Quiz;
  selected: number | undefined;
  onAnswer: (index: number) => void;
  onNext: () => void;
  onExplainMore: () => void;
  busy: boolean;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Interactive multiple-choice check question with instant feedback. */
export function QuizCard({ quiz, selected, onAnswer, onNext, onExplainMore, busy }: Props) {
  const answered = selected !== undefined;
  const correct = answered && selected === quiz.correctIndex;

  return (
    <section
      aria-label="Check question"
      className="mt-2 w-full rounded-2xl border border-border bg-card p-4 shadow-soft animate-rise"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <HelpCircle className="size-4" aria-hidden />
        Check your understanding
      </div>
      <p className="mb-3 font-display text-base font-semibold leading-snug">{quiz.question}</p>
      <div className="flex flex-col gap-2" role="radiogroup">
        {quiz.options.map((option, i) => {
          const isCorrect = i === quiz.correctIndex;
          const isPicked = i === selected;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={answered}
              onClick={() => onAnswer(i)}
              className={cn(
                "flex min-h-12 items-start gap-3 rounded-xl border border-border bg-background p-3 text-left text-sm transition-all",
                !answered && "hover:border-primary/60 hover:bg-teal-soft active:scale-[0.99]",
                answered && isCorrect && "border-success bg-success-soft",
                answered && isPicked && !isCorrect && "border-destructive bg-danger-soft",
                answered && !isCorrect && !isPicked && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold",
                  answered && isCorrect && "bg-success text-success-foreground",
                  answered && isPicked && !isCorrect && "bg-destructive text-destructive-foreground",
                )}
              >
                {LETTERS[i]}
              </span>
              <span className="pt-0.5">{stripOptionLabel(option)}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 animate-rise" aria-live="polite">
          <div
            className={cn(
              "flex items-start gap-2 rounded-xl p-3 text-sm",
              correct ? "bg-success-soft" : "bg-danger-soft",
            )}
          >
            {correct ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            )}
            <div>
              <p className="font-semibold">{correct ? "Correct — well done!" : `Not quite. The answer is ${LETTERS[quiz.correctIndex]}.`}</p>
              <p className="mt-1 text-foreground/85">{quiz.explanation}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={onNext} disabled={busy} className="h-10 rounded-full px-4">
              Next question
            </Button>
            <Button size="sm" variant="outline" onClick={onExplainMore} disabled={busy} className="h-10 rounded-full px-4">
              Explain more
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
