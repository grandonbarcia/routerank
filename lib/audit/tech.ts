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
  evidenceList?: string[];
  version?: string;
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
  networkRequests?: string[];
  jsSignals?: Record<string, unknown>;
  deepHeaders?: Record<string, string>;
  cookieNames?: string[];
}

function normalizeHeaders(
  input: Record<string, string> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!input) return out;
  for (const [k, v] of Object.entries(input)) {
    const key = k.toLowerCase().trim();
    if (!key) continue;
    if (typeof v !== 'string') continue;
    out[key] = v;
  }
  return out;
}

function normalizeHeaderValue(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeEvidence(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function extractVersion(
  value: string | undefined,
  pattern: RegExp,
): string | undefined {
  if (!value) return undefined;
  const match = value.match(pattern);
  const extracted = match?.[1]?.trim();
  return extracted ? extracted : undefined;
}

function mergeEvidence(
  existing: TechTag,
  incoming: TechTag,
  limit = 8,
): { evidence: string | undefined; evidenceList: string[] | undefined } {
  const existingList =
    existing.evidenceList ??
    (normalizeEvidence(existing.evidence)
      ? [normalizeEvidence(existing.evidence)!]
      : []);
  const incomingList =
    incoming.evidenceList ??
    (normalizeEvidence(incoming.evidence)
      ? [normalizeEvidence(incoming.evidence)!]
      : []);

  if (existingList.length === 0 && incomingList.length === 0) {
    return { evidence: undefined, evidenceList: undefined };
  }

  const seen = new Set<string>();
  const merged: string[] = [];

  for (const ev of [...existingList, ...incomingList]) {
    const normalized = normalizeEvidence(ev);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(normalized);
    if (merged.length >= limit) break;
  }

  return {
    evidence: merged[0],
    evidenceList: merged.length > 1 ? merged : undefined,
  };
}

function addTag(map: Map<string, TechTag>, tag: TechTag): void {
  const normalizedName = tag.name.trim();
  if (!normalizedName) return;
  const key = normalizedName.toLowerCase();
  const existing = map.get(key);
  if (!existing) {
    const merged = mergeEvidence({ ...tag, evidenceList: undefined }, tag);
    map.set(key, {
      ...tag,
      name: normalizedName,
      evidence: merged.evidence ?? normalizeEvidence(tag.evidence),
      evidenceList: tag.evidenceList ?? merged.evidenceList,
      version: normalizeEvidence(tag.version),
    });
    return;
  }

  const rank: Record<TechConfidence, number> = { high: 3, medium: 2, low: 1 };
  const mergedEvidence = mergeEvidence(existing, tag);

  const shouldUpgrade = rank[tag.confidence] > rank[existing.confidence];
  const upgraded: TechTag = {
    ...(shouldUpgrade ? { ...existing, ...tag } : existing),
    name: normalizedName,
    // Always merge evidence across detections
    evidence: mergedEvidence.evidence,
    evidenceList: mergedEvidence.evidenceList,
  };

  // Version extraction is opportunistic: prefer a version from a higher-confidence hit.
  const incomingVersion = normalizeEvidence(tag.version);
  const existingVersion = normalizeEvidence(existing.version);
  if (incomingVersion && (!existingVersion || shouldUpgrade)) {
    upgraded.version = incomingVersion;
  } else if (existingVersion) {
    upgraded.version = existingVersion;
  }

  map.set(key, upgraded);
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export function analyzeTechStack(
  params: AnalyzeTechStackParams,
): TechStackResult {
  const {
    html,
    headers,
    nextjsDetected,
    networkRequests,
    jsSignals,
    deepHeaders,
    cookieNames,
  } = params;
  const $ = cheerio.load(html);

  const lowerHtml = html.toLowerCase();

  const tags = new Map<string, TechTag>();

  const generatorRaw = $('meta[name="generator"]').attr('content');
  const generator = generatorRaw?.trim();
  const generatorLower = generator?.toLowerCase() ?? '';

  const effectiveHeaders = {
    ...normalizeHeaders(headers),
    ...normalizeHeaders(deepHeaders),
  };

  const serverHeader = normalizeHeaderValue(effectiveHeaders['server']);
  const poweredByHeader = normalizeHeaderValue(
    effectiveHeaders['x-powered-by'],
  );
  const xGeneratorHeader = normalizeHeaderValue(
    effectiveHeaders['x-generator'],
  );
  const viaHeader = normalizeHeaderValue(effectiveHeaders['via']);
  const xCacheHeader = normalizeHeaderValue(effectiveHeaders['x-cache']);
  const xServedByHeader = normalizeHeaderValue(effectiveHeaders['x-served-by']);

  const headerKeys = Object.keys(effectiveHeaders);
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

  const scriptSrc = scripts.join('\n').toLowerCase();

  const normalizedNetworkRequests = (networkRequests ?? [])
    .map((r) => (typeof r === 'string' ? r.trim() : ''))
    .filter(Boolean)
    .slice(0, 500);
  const networkSrc = normalizedNetworkRequests.join('\n').toLowerCase();
  const observedAssetSrc = [assetSrc, networkSrc].filter(Boolean).join('\n');
  const observedScriptSrc = [scriptSrc, networkSrc].filter(Boolean).join('\n');

  const js = (jsSignals ?? {}) as Record<string, unknown>;
  const hasJs = (key: string): boolean => Boolean(js[key]);

  const normalizedCookieNames = (cookieNames ?? [])
    .map((c) => (typeof c === 'string' ? c.trim() : ''))
    .filter(Boolean)
    .slice(0, 200);
  const cookieSrc = normalizedCookieNames.join('\n').toLowerCase();

  const hasAnyInlineSignal = (needles: string[]) =>
    includesAny(
      lowerHtml,
      needles.map((n) => n.toLowerCase()),
    );

  // Frameworks
  if (nextjsDetected === true) {
    addTag(tags, {
      name: 'Next.js',
      category: 'framework',
      confidence: 'high',
      evidence: 'nextjs-detector',
    });
  }
  // Next.js common asset patterns (useful when Next.js detector is inconclusive)
  if (
    observedAssetSrc.includes('/_next/') ||
    lowerHtml.includes('__next_data__')
  ) {
    addTag(tags, {
      name: 'Next.js',
      category: 'framework',
      confidence: observedAssetSrc.includes('/_next/static/')
        ? 'high'
        : 'medium',
      evidence: observedAssetSrc.includes('/_next/')
        ? '/_next/'
        : '__NEXT_DATA__',
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
    const ngVersion = normalizeEvidence(
      $('[ng-version]').attr('ng-version') ?? undefined,
    );
    addTag(tags, {
      name: 'Angular',
      category: 'framework',
      confidence: 'high',
      evidence: 'ng-version',
      version: ngVersion,
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
    const preactVersion = extractVersion(
      observedAssetSrc,
      /preact@([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Preact',
      category: 'library',
      confidence: 'high',
      evidence: 'script/link src contains preact',
      version: preactVersion,
    });
  }

  // Common frontend libraries / styling
  if (
    includesAny(observedAssetSrc, [
      'cdn.tailwindcss.com',
      'tailwindcss',
      'tailwind.min.css',
    ])
  ) {
    const tailwindVersion = extractVersion(
      observedAssetSrc,
      /tailwindcss@([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Tailwind CSS',
      category: 'library',
      confidence: observedAssetSrc.includes('cdn.tailwindcss.com')
        ? 'high'
        : 'medium',
      evidence: observedAssetSrc.includes('cdn.tailwindcss.com')
        ? 'cdn.tailwindcss.com'
        : 'tailwind asset',
      version: tailwindVersion,
    });
  }

  if (
    includesAny(observedAssetSrc, [
      'bootstrap',
      'maxcdn.bootstrapcdn.com/bootstrap',
      'cdn.jsdelivr.net/npm/bootstrap',
    ])
  ) {
    const bootstrapVersion =
      extractVersion(
        observedAssetSrc,
        /bootstrap@([0-9]+(?:\.[0-9]+){0,3})/i,
      ) ??
      extractVersion(
        observedAssetSrc,
        /bootstrap\/?([0-9]+(?:\.[0-9]+){0,3})/i,
      );
    addTag(tags, {
      name: 'Bootstrap',
      category: 'library',
      confidence: 'high',
      evidence: 'bootstrap asset',
      version: bootstrapVersion,
    });
  }

  if (
    includesAny(observedScriptSrc, [
      'code.jquery.com/jquery',
      'jquery.min.js',
      '/jquery-',
    ])
  ) {
    const jqueryVersion =
      extractVersion(observedScriptSrc, /jquery-([0-9]+(?:\.[0-9]+){0,3})/i) ??
      extractVersion(observedScriptSrc, /jquery\.([0-9]+(?:\.[0-9]+){0,3})/i);
    addTag(tags, {
      name: 'jQuery',
      category: 'library',
      confidence: observedScriptSrc.includes('code.jquery.com/jquery')
        ? 'high'
        : 'medium',
      evidence: 'jquery script src',
      version: jqueryVersion,
    });
  }

  if (
    includesAny(observedScriptSrc, [
      'unpkg.com/alpinejs',
      'cdn.jsdelivr.net/npm/alpinejs',
      'alpinejs',
    ])
  ) {
    const alpineVersion = extractVersion(
      observedScriptSrc,
      /alpinejs@([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Alpine.js',
      category: 'library',
      confidence: 'high',
      evidence: 'alpinejs script src',
      version: alpineVersion,
    });
  }

  if (
    includesAny(observedScriptSrc, [
      'unpkg.com/htmx.org',
      'cdn.jsdelivr.net/npm/htmx.org',
      'htmx.org',
      'htmx.min.js',
    ])
  ) {
    const htmxVersion = extractVersion(
      observedScriptSrc,
      /htmx\.org@([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'htmx',
      category: 'library',
      confidence: observedScriptSrc.includes('htmx.org') ? 'high' : 'medium',
      evidence: 'htmx script src',
      version: htmxVersion,
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
    const wpVersion = extractVersion(
      generator,
      /wordpress\s*([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
      version: wpVersion,
    });
  }
  // WordPress cookies (deep mode)
  if (
    includesAny(cookieSrc, [
      'wordpress_logged_in_',
      'wordpress_sec_',
      'wordpress_test_cookie',
      'wp-settings-',
      'wp-settings-time-',
    ])
  ) {
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'high',
      evidence: 'cookie name',
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
    const drupalVersion = extractVersion(
      generator,
      /drupal\s*([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Drupal',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
      version: drupalVersion,
    });
  }
  if (
    assetSrc.includes('/sites/default/') ||
    assetSrc.includes('/core/assets/') ||
    lowerHtml.includes('drupalsettings')
  ) {
    addTag(tags, {
      name: 'Drupal',
      category: 'cms',
      confidence: 'medium',
      evidence: assetSrc.includes('/sites/default/')
        ? '/sites/default/'
        : lowerHtml.includes('drupalsettings')
          ? 'drupalSettings'
          : '/core/assets/',
    });
  }
  if (includesAny(generatorLower, ['joomla'])) {
    const joomlaVersion = extractVersion(
      generator,
      /joomla!?\s*([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Joomla',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
      version: joomlaVersion,
    });
  }
  if (assetSrc.includes('/media/system/js/')) {
    addTag(tags, {
      name: 'Joomla',
      category: 'cms',
      confidence: 'medium',
      evidence: '/media/system/js/',
    });
  }
  if (includesAny(generatorLower, ['ghost'])) {
    const ghostVersion = extractVersion(
      generator,
      /ghost\s*([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Ghost',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
      version: ghostVersion,
    });
  }
  if (assetSrc.includes('/ghost/') || assetSrc.includes('/assets/built/')) {
    addTag(tags, {
      name: 'Ghost',
      category: 'cms',
      confidence: 'medium',
      evidence: assetSrc.includes('/ghost/') ? '/ghost/' : '/assets/built/',
    });
  }

  // Other common CMS / builders / headless CMS
  if (includesAny(generatorLower, ['typo3'])) {
    addTag(tags, {
      name: 'TYPO3',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (includesAny(generatorLower, ['craft cms', 'craftcms', 'craft'])) {
    addTag(tags, {
      name: 'Craft CMS',
      category: 'cms',
      confidence: 'medium',
      evidence: 'meta generator',
    });
  }
  if (assetSrc.includes('/cpresources/') || lowerHtml.includes('craftcms')) {
    addTag(tags, {
      name: 'Craft CMS',
      category: 'cms',
      confidence: 'low',
      evidence: assetSrc.includes('/cpresources/')
        ? '/cpresources/'
        : 'html contains craftcms',
    });
  }
  if (includesAny(generatorLower, ['umbraco'])) {
    addTag(tags, {
      name: 'Umbraco',
      category: 'cms',
      confidence: 'high',
      evidence: 'meta generator',
    });
  }
  if (assetSrc.includes('/umbraco/')) {
    addTag(tags, {
      name: 'Umbraco',
      category: 'cms',
      confidence: 'medium',
      evidence: '/umbraco/',
    });
  }
  if (
    assetSrc.includes('/etc.clientlibs/') ||
    assetSrc.includes('/content/dam/') ||
    lowerHtml.includes('granite')
  ) {
    addTag(tags, {
      name: 'Adobe Experience Manager',
      category: 'cms',
      confidence: assetSrc.includes('/etc.clientlibs/') ? 'medium' : 'low',
      evidence: assetSrc.includes('/etc.clientlibs/')
        ? '/etc.clientlibs/'
        : assetSrc.includes('/content/dam/')
          ? '/content/dam/'
          : 'html contains granite',
    });
  }
  if (
    includesAny(generatorLower, ['sitecore']) ||
    lowerHtml.includes('sitecore')
  ) {
    addTag(tags, {
      name: 'Sitecore',
      category: 'cms',
      confidence: includesAny(generatorLower, ['sitecore']) ? 'medium' : 'low',
      evidence: includesAny(generatorLower, ['sitecore'])
        ? 'meta generator'
        : 'html contains sitecore',
    });
  }

  // Headless CMS / content platforms (asset domains)
  if (includesAny(assetSrc, ['ctfassets.net', 'cdn.contentful.com'])) {
    addTag(tags, {
      name: 'Contentful',
      category: 'cms',
      confidence: 'high',
      evidence: 'ctfassets.net/contentful',
    });
  }
  if (includesAny(assetSrc, ['cdn.sanity.io', 'sanity.io'])) {
    addTag(tags, {
      name: 'Sanity',
      category: 'cms',
      confidence: 'high',
      evidence: 'cdn.sanity.io',
    });
  }
  if (includesAny(assetSrc, ['prismic.io', 'static.cdn.prismic.io'])) {
    addTag(tags, {
      name: 'Prismic',
      category: 'cms',
      confidence: 'high',
      evidence: 'prismic asset domain',
    });
  }
  if (includesAny(assetSrc, ['storyblok.com', 'a.storyblok.com'])) {
    addTag(tags, {
      name: 'Storyblok',
      category: 'cms',
      confidence: 'high',
      evidence: 'storyblok asset domain',
    });
  }
  if (includesAny(assetSrc, ['datocms-assets.com'])) {
    addTag(tags, {
      name: 'DatoCMS',
      category: 'cms',
      confidence: 'high',
      evidence: 'datocms-assets.com',
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
  // Shopify cookies (deep mode)
  if (
    includesAny(cookieSrc, [
      '_shopify_y',
      '_shopify_s',
      '_shopify_sa_t',
      '_shopify_sa_p',
      '_shopify_fs',
      '_shopify_d',
    ])
  ) {
    addTag(tags, {
      name: 'Shopify',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'cookie name',
    });
  }

  // WooCommerce / Magento / BigCommerce
  if (
    includesAny(generatorLower, ['woocommerce']) ||
    includesAny(lowerHtml, ['/wp-content/plugins/woocommerce/', 'woocommerce'])
  ) {
    addTag(tags, {
      name: 'WooCommerce',
      category: 'ecommerce',
      confidence: includesAny(generatorLower, ['woocommerce'])
        ? 'high'
        : 'medium',
      evidence: includesAny(generatorLower, ['woocommerce'])
        ? 'meta generator'
        : 'woocommerce plugin/assets',
    });
  }
  // WooCommerce cookies (deep mode)
  if (
    includesAny(cookieSrc, [
      'woocommerce_cart_hash',
      'woocommerce_items_in_cart',
      'wp_woocommerce_session_',
    ])
  ) {
    addTag(tags, {
      name: 'WooCommerce',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'cookie name',
    });
  }
  if (
    includesAny(generatorLower, ['magento']) ||
    includesAny(assetSrc, ['static/frontend/', 'mage/cookies'])
  ) {
    addTag(tags, {
      name: 'Magento',
      category: 'ecommerce',
      confidence: includesAny(generatorLower, ['magento']) ? 'high' : 'medium',
      evidence: includesAny(generatorLower, ['magento'])
        ? 'meta generator'
        : 'static/frontend/mage',
    });
  }
  // Magento cookies (deep mode)
  if (
    includesAny(cookieSrc, [
      'mage-cache-storage',
      'mage-cache-sessid',
      'private_content_version',
      'section_data_ids',
    ])
  ) {
    addTag(tags, {
      name: 'Magento',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'cookie name',
    });
  }
  if (includesAny(assetSrc, ['cdn11.bigcommerce.com', 'bigcommerce.com'])) {
    addTag(tags, {
      name: 'BigCommerce',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'bigcommerce asset domain',
    });
  }
  // BigCommerce cookies (deep mode)
  if (includesAny(cookieSrc, ['shop_session_token'])) {
    addTag(tags, {
      name: 'BigCommerce',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'cookie name',
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
  if (includesAny(observedScriptSrc, ['googletagmanager.com/gtm.js'])) {
    addTag(tags, {
      name: 'Google Tag Manager',
      category: 'analytics',
      confidence: 'high',
      evidence: 'gtm.js',
    });
  }
  if (
    includesAny(observedScriptSrc, [
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
  // GA cookies (deep mode)
  if (includesAny(cookieSrc, ['_ga', '_gid', '_gat', '_ga_'])) {
    addTag(tags, {
      name: 'Google Analytics',
      category: 'analytics',
      confidence: 'high',
      evidence: 'cookie name',
    });
  }
  // Meta/Facebook Pixel cookies (deep mode)
  if (includesAny(cookieSrc, ['_fbp', '_fbc'])) {
    addTag(tags, {
      name: 'Meta Pixel',
      category: 'analytics',
      confidence: 'high',
      evidence: 'cookie name',
    });
  }
  // GA/GTM inline signals (lower confidence; deep mode often includes these)
  if (hasAnyInlineSignal(['gtag(', 'google_tag_manager', 'window.dataLayer'])) {
    addTag(tags, {
      name: 'Google Analytics',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'inline gtag/dataLayer',
    });
  }
  if (includesAny(observedScriptSrc, ['plausible.io/js'])) {
    addTag(tags, {
      name: 'Plausible',
      category: 'analytics',
      confidence: 'high',
      evidence: 'plausible.io/js',
    });
  }
  if (includesAny(observedScriptSrc, ['cdn.segment.com'])) {
    addTag(tags, {
      name: 'Segment',
      category: 'analytics',
      confidence: 'high',
      evidence: 'cdn.segment.com',
    });
  }
  if (includesAny(observedScriptSrc, ['static.hotjar.com', 'hotjar.com'])) {
    addTag(tags, {
      name: 'Hotjar',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'hotjar',
    });
  }

  // Additional analytics / product analytics / session replay / pixels
  const analyticsRules: Array<{
    name: string;
    confidence: TechConfidence;
    patterns: string[];
    evidence: string;
  }> = [
    {
      name: 'Matomo',
      confidence: 'high',
      patterns: ['matomo.js', 'piwik.js', 'cdn.matomo.cloud'],
      evidence: 'matomo/piwik',
    },
    {
      name: 'Fathom',
      confidence: 'high',
      patterns: ['cdn.usefathom.com/script.js', 'usefathom.com'],
      evidence: 'usefathom',
    },
    {
      name: 'Umami',
      confidence: 'high',
      patterns: ['analytics.umami.is/script.js', 'umami.js'],
      evidence: 'umami',
    },
    {
      name: 'PostHog',
      confidence: 'high',
      patterns: ['cdn.posthog.com', 'app.posthog.com', 'posthog.com'],
      evidence: 'posthog',
    },
    {
      name: 'Mixpanel',
      confidence: 'high',
      patterns: ['cdn.mxpnl.com/libs/mixpanel', 'mixpanel'],
      evidence: 'mixpanel',
    },
    {
      name: 'Amplitude',
      confidence: 'high',
      patterns: ['cdn.amplitude.com', 'api.amplitude.com', 'amplitude.com'],
      evidence: 'amplitude',
    },
    {
      name: 'Heap',
      confidence: 'high',
      patterns: ['cdn.heapanalytics.com', 'heapanalytics.com'],
      evidence: 'heap',
    },
    {
      name: 'FullStory',
      confidence: 'high',
      patterns: ['fullstory.com/s/fs.js', 'fullstory.com'],
      evidence: 'fullstory',
    },
    {
      name: 'Microsoft Clarity',
      confidence: 'high',
      patterns: ['clarity.ms/tag/'],
      evidence: 'clarity.ms',
    },
    {
      name: 'Sentry',
      confidence: 'high',
      patterns: [
        'sentry-cdn.com',
        'browser.sentry-cdn.com',
        'js.sentry-cdn.com',
      ],
      evidence: 'sentry-cdn',
    },
    {
      name: 'HubSpot',
      confidence: 'high',
      patterns: [
        'js.hs-scripts.com',
        'js.hs-analytics.net',
        'hs-analytics.net',
      ],
      evidence: 'hubspot',
    },
    {
      name: 'Intercom',
      confidence: 'high',
      patterns: ['widget.intercom.io', 'js.intercomcdn.com'],
      evidence: 'intercom',
    },
    {
      name: 'Facebook Pixel',
      confidence: 'high',
      patterns: ['connect.facebook.net/en_US/fbevents.js', 'facebook.com/tr/'],
      evidence: 'fbevents',
    },
    {
      name: 'LinkedIn Insight Tag',
      confidence: 'high',
      patterns: ['snap.licdn.com/li.lms-analytics/insight.min.js'],
      evidence: 'licdn insight',
    },
    {
      name: 'TikTok Pixel',
      confidence: 'high',
      patterns: ['analytics.tiktok.com', 'tiktok.com/i18n/pixel'],
      evidence: 'tiktok pixel',
    },
    {
      name: 'Twitter Pixel',
      confidence: 'high',
      patterns: ['static.ads-twitter.com/uwt.js'],
      evidence: 'ads-twitter',
    },
    {
      name: 'Microsoft UET',
      confidence: 'high',
      patterns: ['bat.bing.com/bat.js'],
      evidence: 'bing uet',
    },
    {
      name: 'Cloudflare Web Analytics',
      confidence: 'high',
      patterns: ['static.cloudflareinsights.com/beacon.min.js'],
      evidence: 'cloudflare beacon',
    },
    {
      name: 'RudderStack',
      confidence: 'high',
      patterns: ['cdn.rudderlabs.com', 'rudderstack'],
      evidence: 'rudderlabs',
    },
    {
      name: 'New Relic',
      confidence: 'high',
      patterns: ['js-agent.newrelic.com', 'bam.nr-data.net', 'newrelic.com'],
      evidence: 'newrelic rum',
    },
    {
      name: 'Datadog RUM',
      confidence: 'high',
      patterns: ['datadoghq.com/rum', 'rum.browser-intake-datadoghq.com'],
      evidence: 'datadog rum',
    },
  ];

  for (const rule of analyticsRules) {
    if (
      includesAny(
        observedScriptSrc,
        rule.patterns.map((p) => p.toLowerCase()),
      )
    ) {
      addTag(tags, {
        name: rule.name,
        category: 'analytics',
        confidence: rule.confidence,
        evidence: rule.evidence,
      });
    }
  }

  // Inline-only pixels / analytics (medium/low confidence)
  if (hasAnyInlineSignal(['fbq(', 'fbevents.js'])) {
    addTag(tags, {
      name: 'Facebook Pixel',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'inline fbq',
    });
  }
  if (hasAnyInlineSignal(['posthog.init', 'posthog.capture'])) {
    addTag(tags, {
      name: 'PostHog',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'inline posthog.init',
    });
  }
  if (hasAnyInlineSignal(['mixpanel.init', 'mixpanel.track'])) {
    addTag(tags, {
      name: 'Mixpanel',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'inline mixpanel.init',
    });
  }
  if (hasAnyInlineSignal(['amplitude.getinstance', 'amplitude.init'])) {
    addTag(tags, {
      name: 'Amplitude',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'inline amplitude.init',
    });
  }
  if (hasAnyInlineSignal(['analytics.load', 'segment.com'])) {
    addTag(tags, {
      name: 'Segment',
      category: 'analytics',
      confidence: 'medium',
      evidence: 'inline analytics.load',
    });
  }

  // Deep-mode JS probes (high-confidence signals when available)
  if (hasJs('hasReact')) {
    addTag(tags, {
      name: 'React',
      category: 'library',
      confidence: 'high',
      evidence: 'js:react fiber/devtools hook',
    });
  }
  if (hasJs('hasShopify')) {
    addTag(tags, {
      name: 'Shopify',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'js:window.Shopify',
    });
  }
  if (hasJs('hasMagento')) {
    addTag(tags, {
      name: 'Magento',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'js:window.Mage',
    });
  }
  if (hasJs('hasBigCommerce')) {
    addTag(tags, {
      name: 'BigCommerce',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'js:window.BCData',
    });
  }
  if (hasJs('hasWordPress')) {
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'high',
      evidence: 'js:window.wp/wpApiSettings',
    });
  }
  if (hasJs('hasDrupal')) {
    addTag(tags, {
      name: 'Drupal',
      category: 'cms',
      confidence: 'high',
      evidence: 'js:window.Drupal',
    });
  }
  if (hasJs('hasGtag') || hasJs('hasDataLayer')) {
    addTag(tags, {
      name: 'Google Analytics',
      category: 'analytics',
      confidence: 'high',
      evidence: hasJs('hasGtag') ? 'js:window.gtag' : 'js:window.dataLayer',
    });
  }
  if (hasJs('hasMatomo')) {
    addTag(tags, {
      name: 'Matomo',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window._paq',
    });
  }
  if (hasJs('hasPostHog')) {
    addTag(tags, {
      name: 'PostHog',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.posthog',
    });
  }
  if (hasJs('hasMixpanel')) {
    addTag(tags, {
      name: 'Mixpanel',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.mixpanel',
    });
  }
  if (hasJs('hasAmplitude')) {
    addTag(tags, {
      name: 'Amplitude',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.amplitude',
    });
  }
  if (hasJs('hasHeap')) {
    addTag(tags, {
      name: 'Heap',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.heap',
    });
  }
  if (hasJs('hasIntercom')) {
    addTag(tags, {
      name: 'Intercom',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.Intercom',
    });
  }
  if (hasJs('hasSentry')) {
    addTag(tags, {
      name: 'Sentry',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.Sentry',
    });
  }
  if (hasJs('hasClarity')) {
    addTag(tags, {
      name: 'Microsoft Clarity',
      category: 'analytics',
      confidence: 'high',
      evidence: 'js:window.clarity',
    });
  }

  // CDN / hosting (headers)
  const serverLower = serverHeader?.toLowerCase() ?? '';
  const poweredByLower = poweredByHeader?.toLowerCase() ?? '';
  const viaLower = viaHeader?.toLowerCase() ?? '';
  const xCacheLower = xCacheHeader?.toLowerCase() ?? '';
  const xServedByLower = xServedByHeader?.toLowerCase() ?? '';

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
  // Shopify header fingerprints (deep mode)
  if (
    hasHeader('x-shopid') ||
    hasHeader('x-shopify-stage') ||
    hasHeader('x-sorting-hat-podid') ||
    hasHeader('x-shopify-request-id')
  ) {
    addTag(tags, {
      name: 'Shopify',
      category: 'ecommerce',
      confidence: 'high',
      evidence: 'shopify response header',
    });
  }
  // WordPress header fingerprint
  if (hasHeader('x-pingback')) {
    addTag(tags, {
      name: 'WordPress',
      category: 'cms',
      confidence: 'medium',
      evidence: 'x-pingback',
    });
  }
  // Magento header fingerprint
  if (hasHeader('x-magento-vary')) {
    addTag(tags, {
      name: 'Magento',
      category: 'ecommerce',
      confidence: 'medium',
      evidence: 'x-magento-vary',
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

  // Amazon CloudFront
  if (
    hasHeader('x-amz-cf-id') ||
    hasHeader('x-amz-cf-pop') ||
    includesAny(xCacheLower, ['cloudfront']) ||
    includesAny(viaLower, ['cloudfront']) ||
    includesAny(observedAssetSrc, ['cloudfront.net'])
  ) {
    addTag(tags, {
      name: 'Amazon CloudFront',
      category: 'cdn',
      confidence:
        hasHeader('x-amz-cf-id') || hasHeader('x-amz-cf-pop')
          ? 'high'
          : 'medium',
      evidence: hasHeader('x-amz-cf-id')
        ? 'x-amz-cf-id'
        : hasHeader('x-amz-cf-pop')
          ? 'x-amz-cf-pop'
          : includesAny(xCacheLower, ['cloudfront'])
            ? 'x-cache'
            : includesAny(viaLower, ['cloudfront'])
              ? 'via'
              : 'cloudfront.net',
    });
  }

  // Twitch (best-effort): Twitch is a heavily client-rendered SPA and often
  // hides framework signals behind bundled assets. Recognize common Twitch CDN domains
  // so the tech section isn't empty.
  if (
    includesAny(observedAssetSrc, [
      'static.twitchcdn.net',
      'jtvnw.net',
      'ttvnw.net',
    ])
  ) {
    addTag(tags, {
      name: 'Twitch CDN',
      category: 'cdn',
      confidence: 'medium',
      evidence: 'twitchcdn/jtvnw/ttvnw',
    });
  }

  // Akamai
  if (
    includesAny(serverLower, ['akamaighost', 'akamai']) ||
    hasHeader('x-akamai-transformed') ||
    hasHeader('x-akamai-request-id') ||
    hasHeader('akamai-grn') ||
    includesAny(observedAssetSrc, [
      'akamaihd.net',
      'akamaized.net',
      'akamaitech.net',
    ])
  ) {
    addTag(tags, {
      name: 'Akamai',
      category: 'cdn',
      confidence:
        hasHeader('x-akamai-transformed') || hasHeader('x-akamai-request-id')
          ? 'high'
          : 'medium',
      evidence: hasHeader('x-akamai-transformed')
        ? 'x-akamai-transformed'
        : hasHeader('x-akamai-request-id')
          ? 'x-akamai-request-id'
          : hasHeader('akamai-grn')
            ? 'akamai-grn'
            : includesAny(serverLower, ['akamaighost'])
              ? 'server header'
              : 'akamai asset domain',
    });
  }

  // Fastly (best-effort). Fastly commonly exposes x-served-by / x-cache / x-timer.
  if (
    hasHeader('x-fastly-request-id') ||
    hasHeader('fastly-debug') ||
    includesAny(xServedByLower, ['fastly']) ||
    (xServedByHeader && xCacheHeader) ||
    includesAny(viaLower, ['fastly'])
  ) {
    addTag(tags, {
      name: 'Fastly',
      category: 'cdn',
      confidence:
        hasHeader('x-fastly-request-id') || hasHeader('fastly-debug')
          ? 'high'
          : 'low',
      evidence: hasHeader('x-fastly-request-id')
        ? 'x-fastly-request-id'
        : hasHeader('fastly-debug')
          ? 'fastly-debug'
          : includesAny(viaLower, ['fastly'])
            ? 'via'
            : xServedByHeader
              ? 'x-served-by'
              : 'x-cache',
    });
  }

  // Varnish cache (generic). Helpful for SPAs where frameworks are hard to fingerprint.
  if (
    hasHeader('x-varnish') ||
    includesAny(viaLower, ['varnish']) ||
    includesAny(xCacheLower, ['varnish'])
  ) {
    addTag(tags, {
      name: 'Varnish',
      category: 'server',
      confidence: hasHeader('x-varnish') ? 'high' : 'medium',
      evidence: hasHeader('x-varnish') ? 'x-varnish' : 'via/x-cache',
    });
  }
  // Cloudflare cookies (deep mode)
  if (includesAny(cookieSrc, ['__cf_bm', 'cf_clearance', '__cfruid'])) {
    addTag(tags, {
      name: 'Cloudflare',
      category: 'cdn',
      confidence: 'medium',
      evidence: 'cookie name',
    });
  }

  // (Cloudflare handled above with stronger signals)
  if (includesAny(serverLower, ['nginx'])) {
    const nginxVersion = extractVersion(
      serverHeader,
      /nginx\/([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'nginx',
      category: 'server',
      confidence: 'medium',
      evidence: 'server header',
      version: nginxVersion,
    });
  }
  if (includesAny(serverLower, ['apache'])) {
    const apacheVersion = extractVersion(
      serverHeader,
      /apache\/?([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'Apache',
      category: 'server',
      confidence: 'medium',
      evidence: 'server header',
      version: apacheVersion,
    });
  }
  if (includesAny(serverLower, ['openresty'])) {
    const openRestyVersion = extractVersion(
      serverHeader,
      /openresty\/?([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'OpenResty',
      category: 'server',
      confidence: 'medium',
      evidence: 'server header',
      version: openRestyVersion,
    });
  }

  if (includesAny(poweredByLower, ['php'])) {
    const phpVersion = extractVersion(
      poweredByHeader,
      /php\/?([0-9]+(?:\.[0-9]+){0,3})/i,
    );
    addTag(tags, {
      name: 'PHP',
      category: 'language',
      confidence: 'medium',
      evidence: 'x-powered-by',
      version: phpVersion,
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
    tags: Array.from(
      (() => {
        // Safety de-dupe pass (in case upstream data ever contains duplicates)
        const deduped = new Map<string, TechTag>();
        for (const tag of tags.values()) addTag(deduped, tag);
        return deduped.values();
      })(),
    ).sort((a, b) => {
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
