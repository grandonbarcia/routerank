import puppeteer, { type Browser } from 'puppeteer';

import { isPrivateUrl, validatePublicHttpUrl } from './url-safety';

export interface RenderedHtmlResult {
  success: boolean;
  html?: string;
  finalUrl?: string;
  mainResponseHeaders?: Record<string, string>;
  mainResponseStatus?: number;
  cookieNames?: string[];
  requests?: string[];
  jsSignals?: Record<string, unknown>;
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

    const MAX_CAPTURED_REQUESTS = 300;
    const requestUrlSet = new Set<string>();
    const requestUrls: string[] = [];

    // Speed + safety: block heavy assets; block private URLs (SSRF)
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      void (async () => {
        try {
          const reqUrl = request.url();

          if (requestUrlSet.size < MAX_CAPTURED_REQUESTS) {
            if (!requestUrlSet.has(reqUrl)) {
              requestUrlSet.add(reqUrl);
              requestUrls.push(reqUrl);
            }
          }

          const type = request.resourceType();
          if (type === 'image' || type === 'media' || type === 'font') {
            await request.abort();
            return;
          }

          // Fast path: block obvious private URLs (literal IPs, localhost, etc.)
          if (isPrivateUrl(reqUrl)) {
            await request.abort();
            return;
          }

          // Only validate network schemes. Allow blob/data/about which do not hit the network.
          let protocol: string | null = null;
          try {
            protocol = new URL(reqUrl).protocol;
          } catch {
            protocol = null;
          }

          if (protocol === 'file:') {
            await request.abort();
            return;
          }

          if (protocol && protocol !== 'http:' && protocol !== 'https:') {
            await request.continue();
            return;
          }

          // DNS-backed validation to reduce risk of domains resolving to private ranges.
          const validation = await validatePublicHttpUrl(reqUrl);
          if (!validation.valid) {
            await request.abort();
            return;
          }

          await request.continue();
        } catch {
          try {
            await request.abort();
          } catch {
            // ignore
          }
        }
      })();
    });

    // Navigate and wait for SPA hydration.
    // NOTE: Some modern SPAs keep long-lived connections open (SSE/WebSockets),
    // which can prevent `networkidle*` from ever resolving. Prefer DOMContentLoaded
    // and a short settle delay.
    let navigationResponse: Awaited<ReturnType<typeof page.goto>> | null = null;
    try {
      navigationResponse = await page.goto(normalized, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } catch {
      // Even if navigation times out, the page may have loaded enough HTML/requests
      // to extract useful tech signals.
      navigationResponse = null;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mainResponseHeaders = navigationResponse?.headers();
    const mainResponseStatus = navigationResponse?.status();

    const cookieNames = (await page.cookies())
      .map((c) => c.name)
      .filter(Boolean)
      .slice(0, 200);

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

    let jsSignals: Record<string, unknown> | undefined;
    try {
      jsSignals = await page.evaluate(() => {
        const w = window as unknown as Record<string, unknown>;
        const get = (key: string) => w[key];

        const hasReactDevtoolsHook = Boolean(
          get('__REACT_DEVTOOLS_GLOBAL_HOOK__'),
        );
        const hasReactFiber = (() => {
          try {
            const nodes = Array.from(document.querySelectorAll('body *')).slice(
              0,
              200,
            );
            for (const el of nodes) {
              const props = Object.getOwnPropertyNames(el as unknown as object);
              for (const key of props) {
                if (
                  key.startsWith('__reactFiber$') ||
                  key.startsWith('__reactContainer$')
                ) {
                  return true;
                }
              }
            }
          } catch {
            // ignore
          }
          return false;
        })();

        const wp = get('wp');
        const wpApiSettings = get('wpApiSettings');
        const hasWpGlobal =
          typeof wp === 'object' &&
          wp !== null &&
          (typeof (wp as Record<string, unknown>)['apiFetch'] !== 'undefined' ||
            typeof (wp as Record<string, unknown>)['i18n'] !== 'undefined');

        return {
          hasReact: hasReactDevtoolsHook || hasReactFiber,
          hasNuxt: Boolean(get('__NUXT__')),
          hasRemix: Boolean(get('__remixContext')),
          hasWebflow: Boolean(get('Webflow')),
          hasShopify: Boolean(get('Shopify')),
          hasMagento: Boolean(get('Mage')),
          hasBigCommerce: Boolean(get('BCData')),
          hasWordPress: Boolean(
            hasWpGlobal || typeof wpApiSettings !== 'undefined',
          ),
          hasDrupal: Boolean(get('Drupal')),
          hasDataLayer: Array.isArray(get('dataLayer')),
          hasGtag: typeof get('gtag') === 'function',
          hasFbq: typeof get('fbq') === 'function',
          hasMatomo: Array.isArray(get('_paq')),
          hasPostHog: Boolean(get('posthog')),
          hasMixpanel: Boolean(get('mixpanel')),
          hasAmplitude: Boolean(get('amplitude')),
          hasHeap: Boolean(get('heap')),
          hasIntercom: Boolean(get('Intercom')),
          hasSentry: Boolean(get('Sentry')),
          hasClarity: Boolean(get('clarity')),
        };
      });
    } catch {
      jsSignals = undefined;
    }

    if (!html || html.length < 50) {
      return { success: false, error: 'Rendered HTML was empty' };
    }

    return {
      success: true,
      html,
      finalUrl,
      mainResponseHeaders,
      mainResponseStatus,
      cookieNames,
      requests: requestUrls,
      jsSignals,
    };
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
