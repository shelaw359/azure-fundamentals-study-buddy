// Basic fixed-window rate limiter kept in memory (per server instance).

export type RateLimiter = {
  check: (key: string, now?: number) => { allowed: boolean; retryAfterSeconds: number };
};

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key, now = Date.now()) {
      // Opportunistic cleanup so the map does not grow forever.
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
      }
      if (entry.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
      }
      entry.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export const CHAT_LIMITS = {
  /** Max characters in a single learner message. */
  maxMessageChars: 1000,
  /** Max messages of history sent to the model. */
  maxHistoryMessages: 20,
  /** Requests allowed per client per window. */
  requestsPerWindow: 15,
  windowMs: 60_000,
} as const;
