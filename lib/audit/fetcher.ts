'use server';

import { validatePublicHttpUrl } from './url-safety';

interface FetcherResult {
  success: boolean;
  html?: string;
  error?: string;
  url?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

/**
 * Fetches HTML from a URL with SSRF protection and timeout
 * Returns HTML content, status code, and response headers
 */
export async function fetchHtml(url: string): Promise<FetcherResult> {
  try {
    // Validate URL + SSRF protections (format, protocol, private hostnames, DNS-to-private)
    const validation = await validatePublicHttpUrl(url);
    if (!validation.valid || !validation.url)
      return { success: false, error: validation.error };

    const normalizedUrl = validation.url;

    // Fetch with timeout and reasonable limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const MAX_REDIRECTS = 5;

    async function fetchWithValidatedRedirects(startUrl: string): Promise<{
      response: Response;
      finalUrl: string;
    }> {
      let currentUrl = startUrl;

      for (let i = 0; i <= MAX_REDIRECTS; i += 1) {
        const response = await fetch(currentUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; RouteRank/1.0; +https://routerank.dev/bot)',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          // IMPORTANT: do not auto-follow redirects before validating the target.
          redirect: 'manual',
        });

        if (
          response.status >= 300 &&
          response.status < 400 &&
          response.status !== 304
        ) {
          const location = response.headers.get('location');
          if (!location) return { response, finalUrl: currentUrl };

          const nextUrl = new URL(location, currentUrl).toString();
          const redirectValidation = await validatePublicHttpUrl(nextUrl);
          if (!redirectValidation.valid || !redirectValidation.url) {
            throw new Error('UNSAFE_REDIRECT');
          }

          currentUrl = redirectValidation.url;
          continue;
        }

        return { response, finalUrl: currentUrl };
      }

      throw new Error('TOO_MANY_REDIRECTS');
    }

    try {
      const { response, finalUrl } =
        await fetchWithValidatedRedirects(normalizedUrl);

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
        'x-robots-tag',
        'server',
        'x-powered-by',
        'x-generator',
        // CDN / caching / edge hints
        'x-cache',
        'x-cache-hits',
        'x-served-by',
        'x-timer',
        'x-varnish',
        'x-fastly-request-id',
        'fastly-debug',
        'x-amz-cf-id',
        'x-amz-cf-pop',
        'x-amz-request-id',
        'x-amz-id-2',
        'x-akamai-transformed',
        'x-akamai-request-id',
        'akamai-grn',
        // Security / policy headers
        'strict-transport-security',
        'content-security-policy',
        'content-security-policy-report-only',
        'x-frame-options',
        'referrer-policy',
        'permissions-policy',
        'x-content-type-options',
        'cross-origin-opener-policy',
        'cross-origin-resource-policy',
        'cross-origin-embedder-policy',
        'x-vercel-id',
        'x-nextjs-cache',
        'x-nf-request-id',
        'cf-ray',
        'cf-cache-status',
        'via',
        'x-drupal-cache',
        'x-shopify-stage',
        'x-wix-request-id',
      ];
      headerNames.forEach((name) => {
        const value = response.headers.get(name);
        if (value) headers[name] = value;
      });

      return {
        success: true,
        html,
        url: finalUrl,
        statusCode: response.status,
        headers,
      };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.message === 'UNSAFE_REDIRECT') {
          return {
            success: false,
            error: 'Redirected to an unsafe address',
          };
        }
        if (err.message === 'TOO_MANY_REDIRECTS') {
          return {
            success: false,
            error: 'Too many redirects',
          };
        }
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
  } catch {
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
