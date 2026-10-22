import { WifiOff } from "lucide-react";

/** Friendly notice shown while the device has no internet connection. */
export function OfflineBanner() {
  return (
    <div
      role="status"
      className="flex items-center gap-2 border-b border-border bg-amber-soft px-4 py-2 text-sm text-foreground animate-rise"
    >
      <WifiOff className="size-4 shrink-0 text-amber-foreground dark:text-amber" aria-hidden />
      <p>
        <span className="font-semibold">You're offline.</span> Your saved chat and glossary still
        work — new answers will come back when you reconnect.
      </p>
    </div>
  );
}
