const PRIVATE_IP_RANGES: RegExp[] = [
  /^127\./, // Loopback
  /^10\./, // Private class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B
  /^192\.168\./, // Private class C
  /^169\.254\./, // Link-local
  /^fc[0-9a-f]{2}:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
  /^::1$/i, // IPv6 loopback
];

const PRIVATE_HOSTNAMES = ['localhost', '.local', '.internal'];

export function isPrivateHostname(hostname: string): boolean {
  const host = (hostname || '').trim().toLowerCase();
  if (!host) return true;

  if (PRIVATE_IP_RANGES.some((pattern) => pattern.test(host))) return true;
  if (PRIVATE_HOSTNAMES.some((suffix) => host.includes(suffix))) return true;

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
