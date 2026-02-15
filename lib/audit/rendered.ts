import puppeteer, { type Browser } from 'puppeteer';

import { isPrivateUrl, validatePublicHttpUrl } from './url-safety';

export interface RenderedHtmlResult {
  success: boolean;
  html?: string;
  finalUrl?: string;
  error?: string;
}

export async function fetchRenderedHtml(
  url: string,
): Promise<RenderedHtmlResult> {
  const validation = await validatePublicHttpUrl(url);
  if (!validation.valid || !validation.url) {
    return { success: false, error: validation.error };
  }

  const normalized = validation.url;

  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (compatible; RouteRank/1.0; +https://routerank.dev/bot)',
    );

    // Speed + safety: block heavy assets; block private URLs (SSRF)
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      try {
        const reqUrl = request.url();
        if (isPrivateUrl(reqUrl)) {
          void request.abort();
          return;
        }

        const type = request.resourceType();
        if (type === 'image' || type === 'media' || type === 'font') {
          void request.abort();
          return;
        }

        void request.continue();
      } catch {
        void request.abort();
      }
    });

    // Navigate and wait for SPA hydration
    await page.goto(normalized, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    const finalUrl = page.url();
    // Sync hostname/IP string check first, then DNS-backed validation.
    if (isPrivateUrl(finalUrl)) {
      return {
        success: false,
        error: 'Navigation redirected to a private address',
      };
    }
    const finalValidation = await validatePublicHttpUrl(finalUrl);
    if (!finalValidation.valid) {
      return {
        success: false,
        error: 'Navigation redirected to an unsafe address',
      };
    }

    const html = await page.content();

    if (!html || html.length < 50) {
      return { success: false, error: 'Rendered HTML was empty' };
    }

    return { success: true, html, finalUrl };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: `Rendered fetch failed: ${message}` };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
}
