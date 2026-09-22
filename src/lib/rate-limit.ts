/**
 * IP-based rate limit (in-memory L1 + SQLite L2)
 * Quantum Fate Lite
 */

import {
  countRateHits,
  pruneRateLimits,
  recordRateHit,
} from "@/lib/db";

interface Bucket {
  count: number;
  resetAt: number;
}

interface Rule {
  endpoint: string;
  /** max hits allowed per windowMs */
  limit: number;
  /** window length, ms */
  windowMs: number;
}

const RULES: Rule[] = [
  { endpoint: "report:create", limit: 10, windowMs: 60 * 60 * 1000 }, // 10 / hour / IP
  { endpoint: "report:get", limit: 60, windowMs: 60 * 1000 }, // 60 / min / IP
  { endpoint: "general", limit: 600, windowMs: 60 * 1000 }, // 600 / min / IP
];

const _mem = new Map<string, Bucket>();
const MAX_MEM_ENTRIES = 5000;

function memKey(ip: string, endpoint: string, windowMs: number): string {
  const bucket = Math.floor(Date.now() / windowMs);
  return `${ip}::${endpoint}::${bucket}`;
}

function evictExpiredEntries(): void {
  const now = Date.now();
  const iter = _mem.entries();
  let evicted = 0;
  while (evicted < 500) {
    const next = iter.next();
    if (next.done) break;
    const [k, b] = next.value;
    if (b.resetAt <= now) {
      _mem.delete(k);
      evicted++;
    }
  }
}

function memHit(k: string, windowMs: number): number {
  const now = Date.now();
  const resetAt = Math.floor(now / windowMs) * windowMs + windowMs;
  const b = _mem.get(k);
  if (!b || b.resetAt <= now) {
    if (_mem.size >= MAX_MEM_ENTRIES) {
      evictExpiredEntries();
      if (_mem.size >= MAX_MEM_ENTRIES) {
        const iter = _mem.keys();
        for (let i = 0; i < 500; i++) {
          const k2 = iter.next().value;
          if (k2) _mem.delete(k2);
        }
      }
    }
    _mem.set(k, { count: 1, resetAt });
    return 1;
  }
  b.count += 1;
  return b.count;
}

/** Periodically prune sqlite rate_limits table (>= 24h old) */
let _pruneTimer: ReturnType<typeof setInterval> | null = null;
function ensurePruneTimer() {
  if (_pruneTimer) return;
  if (typeof setInterval === "undefined") return;
  _pruneTimer = setInterval(() => {
    try {
      const removed = pruneRateLimits(Date.now() - 24 * 60 * 60 * 1000);
      if (removed > 0) {
        // eslint-disable-next-line no-console
        console.log(`[ratelimit] pruned ${removed} old entries`);
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[ratelimit] prune failed:", (e as Error).message);
    }
  }, 60 * 60 * 1000);
}

export interface RateCheckResult {
  ok: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
  reason?: "ip-missing" | "exceeded";
}

export function checkAndRecord(
  ip: string,
  endpoint: string
): RateCheckResult {
  if (!ip || ip === "unknown") {
    return {
      ok: true,
      remaining: 0,
      limit: 0,
      resetAt: 0,
      reason: "ip-missing",
    };
  }
  const rule = RULES.find((r) => r.endpoint === endpoint) ?? {
    endpoint,
    limit: 60,
    windowMs: 60_000,
  };
  ensurePruneTimer();

  const now = Date.now();
  const since = now - rule.windowMs;

  const key = memKey(ip, endpoint, rule.windowMs);
  const memCount = memHit(key, rule.windowMs);

  const l2Count = countRateHits(ip, endpoint, since);

  recordRateHit(ip, endpoint, now);

  const count = Math.max(memCount, l2Count + 1);

  const remaining = Math.max(0, rule.limit - count);
  const resetAt = Math.floor(now / rule.windowMs) * rule.windowMs + rule.windowMs;
  return {
    ok: count <= rule.limit,
    remaining,
    limit: rule.limit,
    resetAt,
    reason: count > rule.limit ? "exceeded" : undefined,
  };
}

export function getClientIp(req: Request): string {
  // Works in Next.js App Router via headers()
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
