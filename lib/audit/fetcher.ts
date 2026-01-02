'use server';

import { z } from 'zod';

// List of private IP ranges to block (SSRF protection)
const PRIVATE_IP_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Private class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private class B
  /^192\.168\./, // Private class C
  /^169\.254\./, // Link-local
  /^fc[0-9a-f]{2}:/i, // IPv6 private
  /^fe80:/i, // IPv6 link-local
  /^::1$/, // IPv6 loopback
];

const PRIVATE_HOSTNAMES = ['localhost', '.local', '.internal'];

interface FetcherResult {
  success: boolean;
  html?: string;
  error?: string;
  url?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

/**
 * Validates if a URL is safe to fetch (SSRF protection)
 */
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname || '';

    // Check against private IP ranges
    if (PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostname))) {
      return true;
    }

    // Check against private hostnames
    if (PRIVATE_HOSTNAMES.some((host) => hostname.includes(host))) {
      return true;
    }

    return false;
  } catch {
    return true; // Invalid URL - block it
  }
}

/**
 * Validates and normalizes a URL
 */
function validateUrl(url: string): {
  valid: boolean;
  url?: string;
  error?: string;
} {
  try {
    // Add protocol if missing
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = 'https://' + url;
    }

    const parsed = new URL(normalizedUrl);

    // Only allow http and https
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

/**
 * Fetches HTML from a URL with SSRF protection and timeout
 * Returns HTML content, status code, and response headers
 */
export async function fetchHtml(url: string): Promise<FetcherResult> {
  try {
    // Validate URL format
    const validation = validateUrl(url);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const normalizedUrl = validation.url!;

    // Check for private URLs (SSRF protection)
    if (isPrivateUrl(normalizedUrl)) {
      return {
        success: false,
        error: 'Cannot access private or local addresses',
      };
    }

    // Fetch with timeout and reasonable limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; RouteRank/1.0; +https://routerank.dev/bot)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);

      // Check for successful response
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      // Check content type
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        return {
          success: false,
          error: 'Response is not HTML content',
        };
      }

      // Read response body with size limit (5MB)
      const arrayBuffer = await response.arrayBuffer();
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (arrayBuffer.byteLength > maxSize) {
        return {
          success: false,
          error: 'HTML file too large (max 5MB)',
        };
      }

      const html = new TextDecoder().decode(arrayBuffer);

      // Extract useful headers
      const headers: Record<string, string> = {};
      const headerNames = [
        'content-type',
        'content-length',
        'cache-control',
        'server',
        'x-powered-by',
      ];
      headerNames.forEach((name) => {
        const value = response.headers.get(name);
        if (value) headers[name] = value;
      });

      return {
        success: true,
        html,
        url: normalizedUrl,
        statusCode: response.status,
        headers,
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout (exceeded 15 seconds)',
          };
        }
        return { success: false, error: `Network error: ${err.message}` };
      }

      return { success: false, error: 'Unknown network error' };
    }
  } catch (err) {
    return { success: false, error: 'Failed to fetch HTML' };
  }
}

/**
 * Fetches HTML and validates that we got valid content
 */
export async function validateFetch(url: string): Promise<FetcherResult> {
  const result = await fetchHtml(url);

  if (!result.success) {
    return result;
  }

  // Verify HTML has content
  if (!result.html || result.html.length < 100) {
    return {
      success: false,
      error: 'Invalid or empty HTML response',
    };
  }

  return result;
}
