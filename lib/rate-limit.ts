import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfterSeconds?: number;
  reason?: string;
  provider: 'upstash' | 'memory' | 'disabled';
};

function isLiveProduction(): boolean {
  // Prefer platform env if available.
  if (process.env.VERCEL_ENV != null)
    return process.env.VERCEL_ENV === 'production';
  return process.env.NODE_ENV === 'production';
}

export function areRateLimitsEnabled(): boolean {
  // RR_RATE_LIMIT_ENABLED overrides auto-detection when set.
  if (process.env.RR_RATE_LIMIT_ENABLED != null) {
    return process.env.RR_RATE_LIMIT_ENABLED === 'true';
  }
  // Default: only enforce in live production.
  return isLiveProduction();
}

type MemoryWindowState = {
  timestamps: number[];
};

type MemoryLimiter = {
  limit: number;
  windowMs: number;
  getKeyState: (key: string) => MemoryWindowState;
  check: (key: string) => RateLimitResult;
};

const MEMORY_LIMITER_KEY = Symbol.for('routerank.memoryRatelimit');

type MemoryLimitersState = {
  minute: MemoryLimiter;
  day: MemoryLimiter;
  store: Map<string, MemoryWindowState>;
};

function getClientIp(request: NextRequest): string {
  // Prefer proxy-provided IPs; fall back to any platform-provided field.
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf.trim();

  // NextRequest may or may not have .ip depending on runtime/platform.
  const anyReq = request as unknown as { ip?: string };
  if (anyReq.ip) return anyReq.ip;

  return 'unknown';
}

function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent')?.slice(0, 200) ?? '';
}

function buildKey(request: NextRequest): string {
  // IP is the primary identity. UA helps reduce shared-IP collisions slightly.
  const ip = getClientIp(request);
  const ua = getUserAgent(request);
  return `ip:${ip}|ua:${ua}`;
}

function getMemoryLimiters(): MemoryLimitersState {
  const g = globalThis as unknown as Record<string | symbol, unknown>;
  const existing = g[MEMORY_LIMITER_KEY] as MemoryLimitersState | undefined;
  if (existing) return existing;

  const store = new Map<string, MemoryWindowState>();

  const makeLimiter = (limit: number, windowMs: number): MemoryLimiter => ({
    limit,
    windowMs,
    getKeyState: (key: string) => {
      const existing = store.get(key);
      if (existing) return existing;
      const created: MemoryWindowState = { timestamps: [] };
      store.set(key, created);
      return created;
    },
    check: (key: string) => {
      const now = Date.now();
      const state = store.get(key) ?? { timestamps: [] };
      const cutoff = now - windowMs;
      state.timestamps = state.timestamps.filter((t) => t > cutoff);

      const used = state.timestamps.length;
      const allowed = used < limit;

      if (allowed) {
        state.timestamps.push(now);
        store.set(key, state);
      } else {
        store.set(key, state);
      }

      const oldest = state.timestamps[0] ?? now;
      const resetAt = oldest + windowMs;
      const remaining = Math.max(0, limit - (allowed ? used + 1 : used));
      const retryAfterSeconds = allowed
        ? undefined
        : Math.max(1, Math.ceil((resetAt - now) / 1000));

      return {
        allowed,
        limit,
        remaining,
        resetAt,
        retryAfterSeconds,
        reason: allowed ? undefined : 'Rate limit exceeded',
        provider: 'memory',
      };
    },
  });

  const created: MemoryLimitersState = {
    store,
    minute: makeLimiter(
      Number.parseInt(process.env.RR_RATE_LIMIT_PER_MINUTE || '2', 10) || 2,
      60_000,
    ),
    day: makeLimiter(
      Number.parseInt(process.env.RR_RATE_LIMIT_PER_DAY || '5', 10) || 5,
      86_400_000,
    ),
  };

  g[MEMORY_LIMITER_KEY] = created;
  return created;
}

function getUpstashRatelimits(): {
  minute: Ratelimit;
  day: Ratelimit;
} | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Cache the constructed clients in global to avoid recreating connections.
  const key = Symbol.for('routerank.upstashRatelimit');
  const g = globalThis as unknown as Record<string | symbol, unknown>;
  const existing = g[key] as { minute: Ratelimit; day: Ratelimit } | undefined;
  if (existing) return existing;

  const redis = new Redis({ url, token });

  const perMinute =
    Number.parseInt(process.env.RR_RATE_LIMIT_PER_MINUTE || '2', 10) || 2;
  const perDay =
    Number.parseInt(process.env.RR_RATE_LIMIT_PER_DAY || '5', 10) || 5;

  const created = {
    minute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(perMinute, '1 m'),
      analytics: true,
      prefix: 'rr:scan:minute',
    }),
    day: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(perDay, '1 d'),
      analytics: true,
      prefix: 'rr:scan:day',
    }),
  };

  g[key] = created;
  return created;
}

export async function checkScanRateLimit(
  request: NextRequest,
): Promise<RateLimitResult> {
  if (!areRateLimitsEnabled()) {
    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetAt: Date.now(),
      provider: 'disabled',
    };
  }

  const key = buildKey(request);

  const upstash = getUpstashRatelimits();
  if (upstash) {
    // Enforce both: short-term burst control + daily cap.
    const minute = await upstash.minute.limit(key);
    if (!minute.success) {
      return {
        allowed: false,
        limit: minute.limit,
        remaining: minute.remaining,
        resetAt: minute.reset,
        retryAfterSeconds: minute.reset
          ? Math.max(1, Math.ceil((minute.reset - Date.now()) / 1000))
          : 60,
        reason: 'Too many scans in a short time',
        provider: 'upstash',
      };
    }

    const day = await upstash.day.limit(key);
    if (!day.success) {
      return {
        allowed: false,
        limit: day.limit,
        remaining: day.remaining,
        resetAt: day.reset,
        retryAfterSeconds: day.reset
          ? Math.max(1, Math.ceil((day.reset - Date.now()) / 1000))
          : 3600,
        reason: 'Daily scan limit reached',
        provider: 'upstash',
      };
    }

    // Return the tighter remaining/reset for user feedback (daily is most meaningful).
    return {
      allowed: true,
      limit: day.limit,
      remaining: day.remaining,
      resetAt: day.reset,
      provider: 'upstash',
    };
  }

  const memory = getMemoryLimiters();
  const minute = memory.minute.check(key);
  if (!minute.allowed) {
    return {
      ...minute,
      reason: 'Too many scans in a short time',
    };
  }

  const day = memory.day.check(key);
  if (!day.allowed) {
    return {
      ...day,
      reason: 'Daily scan limit reached',
    };
  }

  return day;
}
