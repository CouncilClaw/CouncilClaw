interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweepAt = 0;

function now(): number {
  return Date.now();
}

function sweepExpired(ts: number): void {
  if (ts - lastSweepAt < 10_000) return;
  lastSweepAt = ts;

  for (const [key, value] of buckets.entries()) {
    if (ts >= value.resetAt) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const ts = now();
  sweepExpired(ts);
  const existing = buckets.get(key);

  if (!existing || ts >= existing.resetAt) {
    const resetAt = ts + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}
