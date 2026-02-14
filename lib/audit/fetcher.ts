'use server';

import { isPrivateUrl, validateAndNormalizeHttpUrl } from './url-safety';

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
    // Validate URL format
    const validation = validateAndNormalizeHttpUrl(url);
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
        'x-generator',
        'x-vercel-id',
        'x-nextjs-cache',
        'x-nf-request-id',
        'cf-ray',
        'cf-cache-status',
        'via',
        'x-served-by',
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
