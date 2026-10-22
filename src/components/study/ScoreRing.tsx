type Props = { correct: number; answered: number };

/** Small circular progress showing session score (correct / answered). */
export function ScoreRing({ correct, answered }: Props) {
  const size = 40;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = answered === 0 ? 0 : correct / answered;

  return (
    <div
      className="relative flex h-10 w-10 shrink-0 items-center justify-center"
      role="img"
      aria-label={`Session score: ${correct} correct out of ${answered} answered`}
      title={`Score: ${correct}/${answered}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="stroke-amber transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-foreground">
        {correct}/{answered}
      </span>
    </div>
  );
}
