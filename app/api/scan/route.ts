import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { executeAudit, executeQuickAudit } from '@/lib/audit/execute';
import { createHmac } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_SCAN_LIMIT = 5;
const LIMIT_COOKIE_NAME = 'rr_daily_scan';

type DailyLimitPayload = {
  d: string; // YYYY-MM-DD (UTC)
  c: number; // count
};

function getUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getUtcResetIso(date: Date): string {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1)
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
  secret: string | undefined
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
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createScanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: `Invalid request: ${validation.error.issues[0].message}` },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const { url, fullAudit } = validation.data;

    // Daily scan limit (per browser via cookie; optionally signed with RATE_LIMIT_SECRET).
    const now = new Date();
    const todayKey = getUtcDayKey(now);
    const resetIso = getUtcResetIso(now);
    const secret = process.env.RATE_LIMIT_SECRET;
    const current = parseDailyLimitCookie({
      cookieValue: request.cookies.get(LIMIT_COOKIE_NAME)?.value,
      todayKey,
      secret,
    });

    if (current.c >= DAILY_SCAN_LIMIT) {
      const blockedPayload: DailyLimitPayload = { d: todayKey, c: current.c };
      const res = NextResponse.json(
        {
          error: `Daily scan limit reached (${DAILY_SCAN_LIMIT}/day). Try again after reset.`,
          limit: DAILY_SCAN_LIMIT,
          remaining: 0,
          resetAt: resetIso,
        },
        { status: 429, headers: { 'Cache-Control': 'no-store' } }
      );
      return applyRateLimitToResponse({
        response: res,
        remaining: 0,
        resetIso,
        cookieValue: buildDailyLimitCookieValue(blockedPayload, secret),
      });
    }

    const nextCount = current.c + 1;
    const remaining = DAILY_SCAN_LIMIT - nextCount;
    const nextPayload: DailyLimitPayload = { d: todayKey, c: nextCount };
    const nextCookieValue = buildDailyLimitCookieValue(nextPayload, secret);

    // Auth removed: always run immediately and return report (not persisted).
    const auditResult = fullAudit
      ? await executeAudit({ url, userId: 'guest' })
      : await executeQuickAudit({ url, userId: 'guest' });

    if (!auditResult.success || !auditResult.report) {
      const res = NextResponse.json(
        { error: auditResult.error || 'Failed to run audit' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
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
        url: auditResult.url || url,
        report: auditResult.report,
        guest: true,
        limit: {
          daily: DAILY_SCAN_LIMIT,
          remaining,
          resetAt: resetIso,
        },
      },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
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
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
