import * as cheerio from 'cheerio';

export type TechCategory =
  | 'framework'
  | 'cms'
  | 'ecommerce'
  | 'analytics'
  | 'hosting'
  | 'cdn'
  | 'server'
  | 'language'
  | 'library'
  | 'other';

export type TechConfidence = 'high' | 'medium' | 'low';

export interface TechTag {
  name: string;
  category: TechCategory;
  confidence: TechConfidence;
  evidence?: string;
}

export interface TechStackResult {
  tags: TechTag[];
  signals: {
    generator?: string;
    server?: string;
    poweredBy?: string;
  };
}

export interface AnalyzeTechStackParams {
  html: string;
  url: string;
  headers?: Record<string, string>;
  nextjsDetected?: boolean;
}

function normalizeHeaderValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function addTag(map: Map<string, TechTag>, tag: TechTag): void {
  const key = tag.name.toLowerCase();
  const existing = map.get(key);
  if (!existing) {
    map.set(key, tag);
    return;
  }

  const rank: Record<TechConfidence, number> = { high: 3, medium: 2, low: 1 };
  if (rank[tag.confidence] > rank[existing.confidence]) {
    map.set(key, tag);
  }
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export function analyzeTechStack(
  params: AnalyzeTechStackParams,
): TechStackResult {
  const { html, headers, nextjsDetected } = params;
  const $ = cheerio.load(html);

  const lowerHtml = html.toLowerCase();

  const tags = new Map<string, TechTag>();

  const generatorRaw = $('meta[name="generator"]').attr('content');
  const generator = generatorRaw?.trim();
  const generatorLower = generator?.toLowerCase() ?? '';

  const serverHeader = normalizeHeaderValue(headers?.server);
  const poweredByHeader = normalizeHeaderValue(headers?.['x-powered-by']);
  const xGeneratorHeader = normalizeHeaderValue(headers?.['x-generator']);

  const headerKeys = Object.keys(headers ?? {}).map((k) => k.toLowerCase());
  const hasHeader = (name: string) => headerKeys.includes(name.toLowerCase());

  const scripts = $('script[src]')
    .map((_, el) => $(el).attr('src')?.trim() || '')
    .get()
    .filter(Boolean);

  const links = $('link[href]')
    .map((_, el) => $(el).attr('href')?.trim() || '')
    .get()
    .filter(Boolean);

  const assetSrc = [...scripts, ...links].join('\n').toLowerCase();

  // Frameworks
  if (nextjsDetected === true) {
    addTag(tags, {
      name: 'Next.js',
      category: 'framework',
      confidence: 'high',
      evidence: 'nextjs-detector',
    });
  }
  if (html.includes('__NUXT__')) {
    addTag(tags, {
      name: 'Nuxt',
      category: 'framework',
      confidence: 'high',
      evidence: '__NUXT__',
    });
  }
  if (assetSrc.includes('/_nuxt/')) {
    addTag(tags, {
      name: 'Nuxt',
      category: 'framework',
      confidence: 'high',
      evidence: '/_nuxt/',
    });
  }
  if ($('#___gatsby').length > 0) {
    addTag(tags, {
      name: 'Gatsby',
      category: 'framework',
      confidence: 'high',
      evidence: '#___gatsby',
    });
  }

  // Astro
  if (includesAny(generatorLower, ['astro']) || assetSrc.includes('/_astro/')) {
    addTag(tags, {
      name: 'Astro',
      category: 'framework',
      confidence: 'high',
      evidence: assetSrc.includes('/_astro/') ? '/_astro/' : 'meta generator',
    });
  }

  // SvelteKit
  if (
    assetSrc.includes('/_app/immutable/') ||
    lowerHtml.includes('data-sveltekit-')
  ) {
    addTag(tags, {
      name: 'SvelteKit',
      category: 'framework',
      confidence: 'high',
      evidence: assetSrc.includes('/_app/immutable/')
        ? '/_app/immutable/'
        : 'data-sveltekit-*',
    });
  }

  // Remix
  if (
    lowerHtml.includes('__remixcontext') ||
    includesAny(generatorLower, ['remix'])
  ) {
    addTag(tags, {
      name: 'Remix',
      category: 'framework',
      confidence: lowerHtml.includes('__remixcontext') ? 'high' : 'medium',
      evidence: lowerHtml.includes('__remixcontext')
        ? '__remixContext'
        : 'meta generator',
    });
  }

  // Qwik
  if ($('[q\\:container]').length > 0 || lowerHtml.includes('qwik')) {
    addTag(tags, {
      name: 'Qwik',
      category: 'framework',
      confidence: $('[q\\:container]').length > 0 ? 'high' : 'low',
      evidence:
        $('[q\\:container]').length > 0 ? 'q:container' : 'html contains qwik',
    });
  }
  if ($('[ng-version]').length > 0) {
    addTag(tags, {
      name: 'Angular',
      category: 'framework',
      confidence: 'high',
      evidence: 'ng-version',
    });
  }
  if (
    $('[data-reactroot]').length > 0 ||
    html.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')
  ) {
    addTag(tags, {
      name: 'React',
      category: 'library',
      confidence: 'medium',
      evidence: 'reactroot',
    });
  }

  // Detect React/Preact/Vue via common CDN script URLs
  if (
    includesAny(assetSrc, [
      'unpkg.com/react',
      'cdn.jsdelivr.net/npm/react',
      'react.production.min.js',
      'react-dom.production.min.js',
    ])
  ) {
    addTag(tags, {
      name: 'React',
      category: 'library',
      confidence: 'high',
      evidence: 'script/link src contains react',
    });
  }
  if (
    includesAny(assetSrc, [
      'unpkg.com/preact',
      'cdn.jsdelivr.net/npm/preact',
      'preact.min.js',
    ])
  ) {
    addTag(tags, {
      name: 'Preact',
      category: 'library',
      confidence: 'high',
      evidence: 'script/link src contains preact',
    });
  }
  // Vue is harder to fingerprint from HTML alone; keep it conservative.
  const hasVueScopeAttr =
    $('[class*="v-"]').length > 0 || html.includes('data-v-');
  if (hasVueScopeAttr && includesAny(html.toLowerCase(), ['vue', '__vue__'])) {
    addTag(tags, {
      name: 'Vue',
      category: 'library',
      confidence: 'low',
      evidence: 'data-v-*',
    });
  }
  if (
    includesAny(assetSrc, [
      'unpkg.com/vue',
      'cdn.jsdelivr.net/npm/vue',
      'vue.global',
      'vue.runtime',
    ])
  ) {
    addTag(tags, {
      name: 'Vue',
      category: 'library',
      confidence: 'medium',
      evidence: 'script/link src contains vue',
    });
  }

  // Ember
  if (
    $('[data-ember-action]').length > 0 ||
    $('[class*="ember-view"]').length > 0 ||
    includesAny(generatorLower, ['ember'])
  ) {
    addTag(tags, {
      name: 'Ember',
      category: 'framework',
      confidence:
        $('[data-ember-action]').length > 0 ||
        $('[class*="ember-view"]').length > 0
          ? 'high'
          : 'low',
      evidence:
        $('[data-ember-action]').length > 0
          ? 'data-ember-action'
          : $('[class*="ember-view"]').length > 0
            ? 'ember-view'
            : 'meta generator',
    });
  }

  // CMS / site builders
  if (includesAny(generatorLower, ['wordpress'])) {
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (
    html.includes('/wp-content/') ||
    html.includes('/wp-includes/') ||
    html.includes('/wp-json/')
  ) {
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'high',
      evidence: 'wp-content/wp-includes',
    });
  }
  if (includesAny(generatorLower, ['drupal'])) {
    addTag(tags, {
      name: 'Drupal',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (includesAny(generatorLower, ['joomla'])) {
    addTag(tags, {
      name: 'Joomla',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (includesAny(generatorLower, ['ghost'])) {
    addTag(tags, {
      name: 'Ghost',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }

  // E-commerce
  if (includesAny(generatorLower, ['shopify'])) {
    addTag(tags, {
      name: 'Shopify',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (includesAny(html, ['cdn.shopify.com', 'myshopify.com'])) {
    addTag(tags, {
      name: 'Shopify',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'cdn.shopify.com',
    });
  }

  // Builders/hosting fingerprints (HTML)
  if (includesAny(html, ['static.wixstatic.com', 'wix.com'])) {
    addTag(tags, {
      name: 'Wix',
      category: 'hosting',
      confidence: 'high',
      evidence: 'wixstatic',
    });
  }
  if (includesAny(html, ['static1.squarespace.com', 'squarespace.com'])) {
    addTag(tags, {
      name: 'Squarespace',
      category: 'hosting',
      confidence: 'high',
      evidence: 'squarespace assets',
    });
  }
  if (includesAny(html, ['webflow.com', 'webflow.io'])) {
    addTag(tags, {
      name: 'Webflow',
      category: 'hosting',
      confidence: 'high',
      evidence: 'webflow assets',
    });
  }

  // Analytics
  const scriptSrc = scripts.join('\n').toLowerCase();
  if (includesAny(scriptSrc, ['googletagmanager.com/gtm.js'])) {
    addTag(tags, {
      name: 'Google Tag Manager',
      category: 'analytics',
      confidence: 'high',
      evidence: 'gtm.js',
    });
  }
  if (
    includesAny(scriptSrc, [
      'www.googletagmanager.com/gtag/js',
      'google-analytics.com/analytics.js',
    ])
  ) {
    addTag(tags, {
      name: 'Google Analytics',
      category: 'analytics',
      confidence: 'high',
      evidence: 'gtag/analytics.js',
    });
  }
  if (includesAny(scriptSrc, ['plausible.io/js'])) {
    addTag(tags, {
      name: 'Plausible',
      category: 'analytics',
      confidence: 'high',
      evidence: 'plausible.io/js',
    });
  }
  if (includesAny(scriptSrc, ['cdn.segment.com'])) {
    addTag(tags, {
      name: 'Segment',
      category: 'analytics',
      confidence: 'high',
      evidence: 'cdn.segment.com',
    });
  }
  if (includesAny(scriptSrc, ['static.hotjar.com', 'hotjar.com'])) {
    addTag(tags, {
      name: 'Hotjar',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'hotjar',
    });
  }

  // CDN / hosting (headers)
  const serverLower = serverHeader?.toLowerCase() ?? '';
  const poweredByLower = poweredByHeader?.toLowerCase() ?? '';

  // Hosting/platform hints (headers)
  if (hasHeader('x-vercel-id')) {
    addTag(tags, {
      name: 'Vercel',
      category: 'hosting',
      confidence: 'high',
      evidence: 'x-vercel-id',
    });
  }
  if (hasHeader('x-nf-request-id')) {
    addTag(tags, {
      name: 'Netlify',
      category: 'hosting',
      confidence: 'high',
      evidence: 'x-nf-request-id',
    });
  }
  if (
    hasHeader('cf-ray') ||
    hasHeader('cf-cache-status') ||
    includesAny(serverLower, ['cloudflare'])
  ) {
    addTag(tags, {
      name: 'Cloudflare',
      category: 'cdn',
      confidence: hasHeader('cf-ray') ? 'high' : 'medium',
      evidence: hasHeader('cf-ray') ? 'cf-ray' : 'server header',
    });
  }

  // (Cloudflare handled above with stronger signals)
  if (includesAny(serverLower, ['nginx'])) {
    addTag(tags, {
      name: 'nginx',
      category: 'server',
      confidence: 'medium',
      evidence: 'server header',
    });
  }
  if (includesAny(serverLower, ['apache'])) {
    addTag(tags, {
      name: 'Apache',
      category: 'server',
      confidence: 'medium',
      evidence: 'server header',
    });
  }
  if (includesAny(serverLower, ['openresty'])) {
    addTag(tags, {
      name: 'OpenResty',
      category: 'server',
      confidence: 'medium',
      evidence: 'server header',
    });
  }

  if (includesAny(poweredByLower, ['php'])) {
    addTag(tags, {
      name: 'PHP',
      category: 'language',
      confidence: 'medium',
      evidence: 'x-powered-by',
    });
  }
  if (includesAny(poweredByLower, ['express'])) {
    addTag(tags, {
      name: 'Express',
      category: 'framework',
      confidence: 'medium',
      evidence: 'x-powered-by',
    });
  }
  if (includesAny(poweredByLower, ['next.js', 'nextjs'])) {
    addTag(tags, {
      name: 'Next.js',
      category: 'framework',
      confidence: 'high',
      evidence: 'x-powered-by',
    });
  }

  if (includesAny(poweredByLower, ['asp.net', 'aspnet'])) {
    addTag(tags, {
      name: 'ASP.NET',
      category: 'framework',
      confidence: 'medium',
      evidence: 'x-powered-by',
    });
  }

  if (includesAny(poweredByLower, ['laravel'])) {
    addTag(tags, {
      name: 'Laravel',
      category: 'framework',
      confidence: 'medium',
      evidence: 'x-powered-by',
    });
  }

  // Generator headers
  const xGenLower = xGeneratorHeader?.toLowerCase() ?? '';
  if (includesAny(xGenLower, ['wordpress'])) {
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'medium',
      evidence: 'x-generator',
    });
  }

  // Generator-based builders
  if (includesAny(generatorLower, ['webflow'])) {
    addTag(tags, {
      name: 'Webflow',
      category: 'hosting',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (includesAny(generatorLower, ['wix'])) {
    addTag(tags, {
      name: 'Wix',
      category: 'hosting',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (includesAny(generatorLower, ['squarespace'])) {
    addTag(tags, {
      name: 'Squarespace',
      category: 'hosting',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }

  return {
    tags: Array.from(tags.values()).sort((a, b) => {
      const rank: Record<TechConfidence, number> = {
        high: 0,
        medium: 1,
        low: 2,
      };
      const r = rank[a.confidence] - rank[b.confidence];
      if (r !== 0) return r;
      return a.name.localeCompare(b.name);
    }),
    signals: {
      generator,
      server: serverHeader,
      poweredBy: poweredByHeader,
    },
  };
}
