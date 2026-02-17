import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeAudit, executeQuickAudit } from '@/lib/audit/execute';
import { createHmac } from 'crypto';
import { validatePublicHttpUrl } from '@/lib/audit/url-safety';
import { areRateLimitsEnabled, checkScanRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_SCAN_LIMIT = 5;
const LIMIT_COOKIE_NAME = 'rr_daily_scan';

const RATE_LIMITS_ENABLED = areRateLimitsEnabled();

const MAX_CONCURRENT_AUDITS = Math.max(
  1,
  Number.parseInt(process.env.MAX_CONCURRENT_AUDITS || '2', 10) || 2,
);

type SemaphoreState = {
  inFlight: number;
  queue: Array<() => void>;
};

const SEMAPHORE_KEY = Symbol.for('routerank.auditSemaphore');

function getSemaphoreState(): SemaphoreState {
  const g = globalThis as unknown as Record<string | symbol, unknown>;
  const existing = g[SEMAPHORE_KEY] as SemaphoreState | undefined;
  if (existing) return existing;
  const created: SemaphoreState = { inFlight: 0, queue: [] };
  g[SEMAPHORE_KEY] = created;
  return created;
}

async function runWithAuditSlot<T>(fn: () => Promise<T>): Promise<T> {
  const sem = getSemaphoreState();

  if (sem.inFlight >= MAX_CONCURRENT_AUDITS) {
    await new Promise<void>((resolve) => {
      sem.queue.push(resolve);
    });
  }

  sem.inFlight += 1;
  try {
    return await fn();
  } finally {
    sem.inFlight = Math.max(0, sem.inFlight - 1);
    const next = sem.queue.shift();
    if (next) next();
  }
}

type DailyLimitPayload = {
  d: string; // YYYY-MM-DD (UTC)
  c: number; // count
};

function getUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getUtcResetIso(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1),
  ).toISOString();
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url');
}

function decodeBase64Url(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac('sha256', secret).update(payloadB64).digest('base64url');
}

function parseDailyLimitCookie(params: {
  cookieValue: string | undefined;
  todayKey: string;
  secret: string | undefined;
}): DailyLimitPayload {
  const { cookieValue, todayKey, secret } = params;
  if (!cookieValue) return { d: todayKey, c: 0 };

  try {
    const [payloadB64, sig] = cookieValue.split('.', 2);
    if (!payloadB64) return { d: todayKey, c: 0 };

    if (secret) {
      if (!sig) return { d: todayKey, c: 0 };
      const expected = signPayload(payloadB64, secret);
      if (sig !== expected) return { d: todayKey, c: 0 };
    }

    const raw = decodeBase64Url(payloadB64);
    const parsed = JSON.parse(raw) as Partial<DailyLimitPayload>;
    const day = typeof parsed.d === 'string' ? parsed.d : todayKey;
    const count =
      typeof parsed.c === 'number' && Number.isFinite(parsed.c) ? parsed.c : 0;

    if (day !== todayKey) return { d: todayKey, c: 0 };
    return { d: day, c: Math.max(0, Math.floor(count)) };
  } catch {
    return { d: todayKey, c: 0 };
  }
}

function buildDailyLimitCookieValue(
  payload: DailyLimitPayload,
  secret: string | undefined,
): string {
  const payloadB64 = encodeBase64Url(JSON.stringify(payload));
  if (!secret) return payloadB64;
  const sig = signPayload(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

function applyRateLimitToResponse(params: {
  response: NextResponse;
  remaining: number;
  resetIso: string;
  cookieValue: string;
}): NextResponse {
  const { response, remaining, resetIso, cookieValue } = params;

  response.headers.set('X-RateLimit-Limit', String(DAILY_SCAN_LIMIT));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  response.headers.set('X-RateLimit-Reset', resetIso);

  response.cookies.set(LIMIT_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // Keep a bit longer than 24h so it survives timezone/clock differences.
    maxAge: 60 * 60 * 24 * 2,
  });

  return response;
}

const createScanSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .transform((val) => {
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(z.string().url('Invalid URL')),
  fullAudit: z.boolean().optional().default(true),
  deepTechDetect: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Server-side abuse protection (IP-based). Disabled by default in dev/preview.
    const rl = RATE_LIMITS_ENABLED ? await checkScanRateLimit(request) : null;
    if (RATE_LIMITS_ENABLED && rl && !rl.allowed) {
      return NextResponse.json(
        {
          error: rl.reason || 'Too many requests',
          limit: rl.limit,
          remaining: rl.remaining,
          resetAt: new Date(rl.resetAt).toISOString(),
          provider: rl.provider,
        },
        {
          status: 429,
          headers: {
            'Cache-Control': 'no-store',
            'Retry-After': rl.retryAfterSeconds
              ? String(rl.retryAfterSeconds)
              : '60',
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
            'X-RateLimit-Reset': String(Math.floor(rl.resetAt / 1000)),
          },
        },
      );
    }

    const body = await request.json();
    const validation = createScanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: `Invalid request: ${validation.error.issues[0].message}` },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const { url, fullAudit, deepTechDetect } = validation.data;

    // Server-side URL safety validation (format + SSRF protections)
    const safeUrl = await validatePublicHttpUrl(url);
    if (!safeUrl.valid || !safeUrl.url) {
      return NextResponse.json(
        { error: safeUrl.error || 'Invalid or unsafe URL' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const normalizedUrl = safeUrl.url;

    // Daily scan limit (per browser via cookie). Disabled by default in dev/preview.
    const now = new Date();
    const todayKey = getUtcDayKey(now);
    const resetIso = getUtcResetIso(now);
    const secret = process.env.RATE_LIMIT_SECRET;

    const current = RATE_LIMITS_ENABLED
      ? parseDailyLimitCookie({
          cookieValue: request.cookies.get(LIMIT_COOKIE_NAME)?.value,
          todayKey,
          secret,
        })
      : ({ d: todayKey, c: 0 } satisfies DailyLimitPayload);

    if (RATE_LIMITS_ENABLED && current.c >= DAILY_SCAN_LIMIT) {
      const blockedPayload: DailyLimitPayload = { d: todayKey, c: current.c };
      const res = NextResponse.json(
        {
          error: `Daily scan limit reached (${DAILY_SCAN_LIMIT}/day). Try again after reset.`,
          limit: DAILY_SCAN_LIMIT,
          remaining: 0,
          resetAt: resetIso,
        },
        { status: 429, headers: { 'Cache-Control': 'no-store' } },
      );
      return applyRateLimitToResponse({
        response: res,
        remaining: 0,
        resetIso,
        cookieValue: buildDailyLimitCookieValue(blockedPayload, secret),
      });
    }

    const nextCount = RATE_LIMITS_ENABLED ? current.c + 1 : 0;
    const remaining = RATE_LIMITS_ENABLED ? DAILY_SCAN_LIMIT - nextCount : 0;
    const nextPayload: DailyLimitPayload = { d: todayKey, c: nextCount };
    const nextCookieValue = buildDailyLimitCookieValue(nextPayload, secret);

    // Auth removed: always run immediately and return report (not persisted).
    const auditResult = await runWithAuditSlot(async () =>
      fullAudit
        ? executeAudit({ url: normalizedUrl, userId: 'guest', deepTechDetect })
        : executeQuickAudit({
            url: normalizedUrl,
            userId: 'guest',
            deepTechDetect,
          }),
    );

    if (!auditResult.success || !auditResult.report) {
      const res = NextResponse.json(
        { error: auditResult.error || 'Failed to run audit' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } },
      );
      if (!RATE_LIMITS_ENABLED) return res;
      return applyRateLimitToResponse({
        response: res,
        remaining,
        resetIso,
        cookieValue: nextCookieValue,
      });
    }

    const res = NextResponse.json(
      {
        status: 'completed',
        url: auditResult.url || normalizedUrl,
        report: auditResult.report,
        guest: true,
        ...(RATE_LIMITS_ENABLED && rl
          ? {
              rateLimit: {
                provider: rl.provider,
                daily: {
                  limit: rl.limit,
                  remaining: rl.remaining,
                  resetAt: new Date(rl.resetAt).toISOString(),
                },
              },
              limit: {
                daily: DAILY_SCAN_LIMIT,
                remaining,
                resetAt: resetIso,
              },
            }
          : { rateLimit: { provider: 'disabled', daily: null }, limit: null }),
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    );

    if (!RATE_LIMITS_ENABLED) return res;
    return applyRateLimitToResponse({
      response: res,
      remaining,
      resetIso,
      cookieValue: nextCookieValue,
    });
  } catch (error) {
    console.error('[API] Scan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
