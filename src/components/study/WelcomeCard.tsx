import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { STARTER_PROMPTS } from "@/lib/topics";

type Props = { onPick: (prompt: string) => void; disabled?: boolean };

export function WelcomeCard({ onPick, disabled }: Props) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-lift animate-rise sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden />
      <div className="relative">
        <img
          src={logo}
          alt=""
          width={64}
          height={64}
          className="mb-4 size-16 rounded-2xl shadow-soft"
        />
        <h2 className="text-2xl font-bold sm:text-3xl">Habari! Let's pass AZ-900 together.</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Ask anything about Azure Fundamentals. I'll explain with everyday examples — M-Pesa,
          matatus, SACCOs — then check your understanding with a quick question.
        </p>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Try one of these
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((p) => (
            <Button
              key={p}
              variant="chip"
              disabled={disabled}
              onClick={() => onPick(p)}
              className="h-auto min-h-10 whitespace-normal px-4 py-2 text-left"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>
    </section>
  );
}
