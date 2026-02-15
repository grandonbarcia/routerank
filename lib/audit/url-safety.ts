import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE_HOST_SUFFIXES = ['.local', '.internal'];

type DnsSafetyCacheEntry = {
  expiresAt: number;
  resolvesToPrivate: boolean;
};

const DNS_CACHE_KEY = Symbol.for('routerank.dnsSafetyCache');

function getDnsCache(): Map<string, DnsSafetyCacheEntry> {
  const g = globalThis as unknown as Record<string | symbol, unknown>;
  const existing = g[DNS_CACHE_KEY] as
    | Map<string, DnsSafetyCacheEntry>
    | undefined;
  if (existing) return existing;
  const created = new Map<string, DnsSafetyCacheEntry>();
  g[DNS_CACHE_KEY] = created;
  return created;
}

function pruneDnsCache(cache: Map<string, DnsSafetyCacheEntry>): void {
  const now = Date.now();
  for (const [k, v] of cache) {
    if (v.expiresAt <= now) cache.delete(k);
  }
  // Simple size cap to avoid unbounded growth.
  if (cache.size > 1000) {
    let dropped = 0;
    for (const key of cache.keys()) {
      cache.delete(key);
      dropped += 1;
      if (dropped >= 250) break;
    }
  }
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return true;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;

  const [a, b] = nums;

  if (a === 127) return true; // loopback
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local
  if (a === 0) return true; // 0.0.0.0/8 ("this" network)
  return false;
}

function isPrivateIpv6(raw: string): boolean {
  const ip = raw.toLowerCase().split('%', 1)[0] ?? raw.toLowerCase();
  if (!ip) return true;

  if (ip === '::' || ip === '::1') return true; // unspecified / loopback

  // IPv4-mapped IPv6: ::ffff:192.168.0.1
  if (ip.startsWith('::ffff:')) {
    const v4 = ip.slice('::ffff:'.length);
    return isPrivateIpv4(v4);
  }

  // Unique local: fc00::/7 (fc* or fd*)
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;

  // Link-local: fe80::/10 (fe8*, fe9*, fea*, feb*)
  if (/^fe[89ab]/.test(ip)) return true;

  return false;
}

function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return isPrivateIpv4(ip);
  if (kind === 6) return isPrivateIpv6(ip);
  return true;
}

async function hostnameResolvesToPrivateIp(hostname: string): Promise<boolean> {
  const host = hostname.trim().toLowerCase();
  const cache = getDnsCache();
  pruneDnsCache(cache);

  const cached = cache.get(host);
  if (cached && cached.expiresAt > Date.now()) return cached.resolvesToPrivate;

  try {
    const results = await lookup(host, { all: true, verbatim: true });
    const resolvesToPrivate =
      !results || results.length === 0
        ? true
        : results.some((r) => isPrivateIp(r.address));
    cache.set(host, {
      resolvesToPrivate,
      // Short TTL to reduce DNS load while still resisting rebinding.
      expiresAt: Date.now() + 60_000,
    });
    return resolvesToPrivate;
  } catch {
    // If DNS fails, treat as unsafe/invalid for our scanner.
    cache.set(host, {
      resolvesToPrivate: true,
      expiresAt: Date.now() + 30_000,
    });
    return true;
  }
}

export function isPrivateHostname(hostname: string): boolean {
  const host = (hostname || '').trim().toLowerCase();
  if (!host) return true;

  // Literal IPs
  if (isIP(host)) return isPrivateIp(host);

  // Exact / suffix matches (avoid false positives from includes())
  if (host === 'localhost') return true;
  if (PRIVATE_HOST_SUFFIXES.some((suffix) => host === suffix.slice(1)))
    return true;
  if (PRIVATE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix)))
    return true;

  return false;
}

export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return isPrivateHostname(parsed.hostname || '');
  } catch {
    return true;
  }
}

export async function validatePublicHttpUrl(url: string): Promise<{
  valid: boolean;
  url?: string;
  error?: string;
}> {
  const basic = validateAndNormalizeHttpUrl(url);
  if (!basic.valid || !basic.url) return basic;

  try {
    const parsed = new URL(basic.url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are supported',
      };
    }

    if (isPrivateHostname(parsed.hostname)) {
      return {
        valid: false,
        error: 'Cannot access private or local addresses',
      };
    }

    const resolvesToPrivate = await hostnameResolvesToPrivateIp(
      parsed.hostname,
    );
    if (resolvesToPrivate) {
      return {
        valid: false,
        error: 'Cannot access private or local addresses',
      };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateAndNormalizeHttpUrl(url: string): {
  valid: boolean;
  url?: string;
  error?: string;
} {
  try {
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = 'https://' + url;
    }

    const parsed = new URL(normalizedUrl);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: 'Only HTTP and HTTPS protocols are supported',
      };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}
