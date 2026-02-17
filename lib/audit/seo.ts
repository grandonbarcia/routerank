import * as cheerio from 'cheerio';

type ResponseHeaders = Record<string, string> | undefined;

type SecurityPresent = {
  hsts: boolean;
  csp: boolean;
  xFrameOptionsOrFrameAncestors: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  xContentTypeOptions: boolean;
};

interface SeoIssue {
  category: 'seo';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  message: string;
  suggestion: string;
  count?: number;
}

interface SeoResult {
  score: number; // 0-100
  issues: SeoIssue[];
  metadata: {
    title: string | null;
    description: string | null;
    canonical: string | null;
    viewport: string | null;
    lang: string | null;
    indexability?: {
      robotsMeta?: string | null;
      googlebotMeta?: string | null;
      xRobotsTag?: string | null;
      resolvedCanonical?: string | null;
      canonicalSameOrigin?: boolean | null;
      isNoindex?: boolean;
      isNofollow?: boolean;
    };
    security?: {
      score: number;
      present: {
        hsts: boolean;
        csp: boolean;
        xFrameOptionsOrFrameAncestors: boolean;
        referrerPolicy: boolean;
        permissionsPolicy: boolean;
        xContentTypeOptions: boolean;
      };
    };
    accessibility?: {
      imagesMissingAlt: number;
      formControlsMissingLabel: number;
      buttonsMissingName: number;
    };
  };
}

function getHeader(headers: ResponseHeaders, name: string): string | null {
  if (!headers) return null;
  const key = name.toLowerCase();
  return headers[key] ?? null;
}

function parseRobotsDirectives(value: string | null | undefined): {
  noindex: boolean;
  nofollow: boolean;
} {
  const raw = (value ?? '').toLowerCase();
  const noindex = /\bnoindex\b/.test(raw);
  const nofollow = /\bnofollow\b/.test(raw);
  return { noindex, nofollow };
}

function isSameOrigin(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.origin === ub.origin;
  } catch {
    return false;
  }
}

function hasFrameAncestorsDirective(csp: string | null): boolean {
  if (!csp) return false;
  return /(^|;)\s*frame-ancestors\s+[^;]+/i.test(csp);
}

function computeSecurityHeadersScore(headers: ResponseHeaders): {
  score: number;
  present: SecurityPresent;
  missing: string[];
} {
  const hsts = Boolean(getHeader(headers, 'strict-transport-security'));
  const cspHeader = getHeader(headers, 'content-security-policy');
  const cspReportOnly = getHeader(
    headers,
    'content-security-policy-report-only',
  );
  const csp = Boolean(cspHeader) || Boolean(cspReportOnly);

  const xfo = Boolean(getHeader(headers, 'x-frame-options'));
  const frameAncestors = hasFrameAncestorsDirective(cspHeader);
  const xFrameOptionsOrFrameAncestors = xfo || frameAncestors;

  const referrerPolicy = Boolean(getHeader(headers, 'referrer-policy'));
  const permissionsPolicy = Boolean(getHeader(headers, 'permissions-policy'));
  const xContentTypeOptions =
    (getHeader(headers, 'x-content-type-options') ?? '').toLowerCase() ===
    'nosniff';

  // Simple weighted score. Keep it stable and interpretable.
  const weights = {
    hsts: 25,
    csp: 25,
    xFrame: 20,
    referrer: 10,
    permissions: 10,
    nosniff: 10,
  };

  let score = 0;
  const missing: string[] = [];

  if (hsts) score += weights.hsts;
  else missing.push('strict-transport-security');

  if (csp) score += weights.csp;
  else missing.push('content-security-policy');

  if (xFrameOptionsOrFrameAncestors) score += weights.xFrame;
  else missing.push('x-frame-options / frame-ancestors');

  if (referrerPolicy) score += weights.referrer;
  else missing.push('referrer-policy');

  if (permissionsPolicy) score += weights.permissions;
  else missing.push('permissions-policy');

  if (xContentTypeOptions) score += weights.nosniff;
  else missing.push('x-content-type-options: nosniff');

  return {
    score,
    present: {
      hsts,
      csp,
      xFrameOptionsOrFrameAncestors,
      referrerPolicy,
      permissionsPolicy,
      xContentTypeOptions,
    },
    missing,
  };
}

/**
 * Analyzes HTML for SEO issues
 */
export function analyzeSeo(
  html: string,
  baseUrl: string,
  headers?: Record<string, string>,
): SeoResult {
  const $ = cheerio.load(html);
  const issues: SeoIssue[] = [];
  let score = 100;

  // Check title
  const title = $('head title').text().trim();
  if (!title) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      rule: 'missing-title',
      message: 'Page title is missing',
      suggestion: 'Add a descriptive title (30-60 characters)',
    });
    score -= 10;
  } else if (title.length < 30) {
    issues.push({
      category: 'seo',
      severity: 'high',
      rule: 'short-title',
      message: `Title is too short (${title.length} characters)`,
      suggestion: 'Use 30-60 characters for better search results',
    });
    score -= 5;
  } else if (title.length > 60) {
    issues.push({
      category: 'seo',
      severity: 'low',
      rule: 'long-title',
      message: `Title is too long (${title.length} characters)`,
      suggestion: 'Keep titles under 60 characters to avoid truncation',
    });
    score -= 2;
  }

  // Check meta description
  const metaDescription = $('meta[name="description"]').attr('content')?.trim();
  if (!metaDescription) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      rule: 'missing-description',
      message: 'Meta description is missing',
      suggestion: 'Add a meta description (120-160 characters)',
    });
    score -= 10;
  } else if (metaDescription.length < 120) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'short-description',
      message: `Description is too short (${metaDescription.length} characters)`,
      suggestion: 'Expand to 120-160 characters for better search snippets',
    });
    score -= 3;
  } else if (metaDescription.length > 160) {
    issues.push({
      category: 'seo',
      severity: 'low',
      rule: 'long-description',
      message: `Description is too long (${metaDescription.length} characters)`,
      suggestion: 'Keep descriptions under 160 characters to avoid truncation',
    });
    score -= 2;
  }

  // Check canonical tag
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({
      category: 'seo',
      severity: 'high',
      rule: 'missing-canonical',
      message: 'Canonical tag is missing',
      suggestion: 'Add a canonical link to prevent duplicate content issues',
    });
    score -= 8;
  }

  // Indexability / crawlability: canonical validity + origin
  let resolvedCanonical: string | null = null;
  let canonicalSameOrigin: boolean | null = null;
  if (canonical) {
    try {
      resolvedCanonical = new URL(canonical, baseUrl).toString();
      canonicalSameOrigin = isSameOrigin(resolvedCanonical, baseUrl);
      if (!canonicalSameOrigin) {
        issues.push({
          category: 'seo',
          severity: 'medium',
          rule: 'canonical-cross-origin',
          message: 'Canonical points to a different origin',
          suggestion:
            'Ensure the canonical URL points to the preferred URL on the same site',
        });
        score -= 3;
      }
    } catch {
      issues.push({
        category: 'seo',
        severity: 'medium',
        rule: 'canonical-invalid',
        message: 'Canonical URL is not a valid URL',
        suggestion:
          'Set rel="canonical" to a valid absolute or site-relative URL',
      });
      score -= 3;
    }
  }

  // Check viewport meta tag
  const viewport = $('meta[name="viewport"]').attr('content');
  if (!viewport) {
    issues.push({
      category: 'seo',
      severity: 'high',
      rule: 'missing-viewport',
      message: 'Viewport meta tag is missing',
      suggestion:
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
    });
    score -= 8;
  }

  // Check for viewport width=device-width
  if (viewport && !viewport.includes('width=device-width')) {
    issues.push({
      category: 'seo',
      severity: 'high',
      rule: 'invalid-viewport',
      message: 'Viewport does not include width=device-width',
      suggestion: 'Set viewport to: width=device-width, initial-scale=1',
    });
    score -= 5;
  }

  // Check OpenGraph tags
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDescription = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');

  if (!ogTitle) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'missing-og-title',
      message: 'OpenGraph title tag is missing',
      suggestion: 'Add og:title meta tag for better social media sharing',
    });
    score -= 3;
  }

  if (!ogDescription) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'missing-og-description',
      message: 'OpenGraph description tag is missing',
      suggestion: 'Add og:description meta tag for better social media sharing',
    });
    score -= 3;
  }

  if (!ogImage) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'missing-og-image',
      message: 'OpenGraph image tag is missing',
      suggestion: 'Add og:image meta tag (1200x630px recommended)',
    });
    score -= 3;
  }

  // Check heading structure
  const h1 = $('h1');
  if (h1.length === 0) {
    issues.push({
      category: 'seo',
      severity: 'high',
      rule: 'missing-h1',
      message: 'Page has no H1 heading',
      suggestion: 'Add exactly one H1 heading that describes the page content',
    });
    score -= 8;
  } else if (h1.length > 1) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'multiple-h1',
      message: `Page has ${h1.length} H1 headings`,
      suggestion: 'Use only one H1 heading per page',
    });
    score -= 5;
  }

  // Check images have alt text
  const images = $('img');
  const imagesWithoutAlt: number[] = [];
  images.each((i, img) => {
    if (!$(img).attr('alt')) {
      imagesWithoutAlt.push(i);
    }
  });

  if (imagesWithoutAlt.length > 0) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'missing-alt-text',
      message: `${imagesWithoutAlt.length} images missing alt text`,
      suggestion:
        'Add descriptive alt text to all images for accessibility and SEO',
      count: imagesWithoutAlt.length,
    });
    score -= Math.min(5, imagesWithoutAlt.length * 2);
  }

  // Check for robots meta tag
  const robots = $('meta[name="robots"]').attr('content');
  const googlebot = $('meta[name="googlebot"]').attr('content');
  if (!robots || !robots.includes('index')) {
    // Warning only if explicitly set to noindex
    if (robots && robots.includes('noindex')) {
      issues.push({
        category: 'seo',
        severity: 'critical',
        rule: 'noindex',
        message: 'Page has noindex meta tag',
        suggestion: 'Remove noindex tag if you want this page to be searchable',
      });
      score -= 10;
    }
  }

  // Indexability / crawlability: header-based robots directives
  const xRobotsTag = getHeader(headers, 'x-robots-tag');
  const robotsDirectives = parseRobotsDirectives(robots);
  const googlebotDirectives = parseRobotsDirectives(googlebot);
  const xRobotsDirectives = parseRobotsDirectives(xRobotsTag);

  const isNoindex =
    robotsDirectives.noindex ||
    googlebotDirectives.noindex ||
    xRobotsDirectives.noindex;
  const isNofollow =
    robotsDirectives.nofollow ||
    googlebotDirectives.nofollow ||
    xRobotsDirectives.nofollow;

  if (xRobotsDirectives.noindex) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      rule: 'x-robots-tag-noindex',
      message: 'Response header X-Robots-Tag includes noindex',
      suggestion:
        'Remove X-Robots-Tag: noindex if you want this page to be searchable',
    });
    score -= 10;
  }

  if (googlebotDirectives.noindex) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      rule: 'googlebot-noindex',
      message: 'Meta tag googlebot includes noindex',
      suggestion: 'Remove googlebot noindex if this page should be indexed',
    });
    score -= 10;
  }

  if (isNofollow) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'nofollow-detected',
      message: 'nofollow directive detected for this page',
      suggestion:
        'Remove nofollow if you want search engines to follow links on this page',
    });
    score -= 3;
  }

  // Security headers score (reported in SEO issues for now)
  const security = computeSecurityHeadersScore(headers);
  if (security.score < 60) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      rule: 'missing-security-headers',
      message: `Security headers score is ${security.score}/100`,
      suggestion: `Add missing headers: ${security.missing.join(', ')}`,
    });
    score -= 3;
  } else if (security.score < 90) {
    issues.push({
      category: 'seo',
      severity: 'low',
      rule: 'security-headers-improve',
      message: `Security headers score is ${security.score}/100`,
      suggestion: `Consider adding: ${security.missing.join(', ')}`,
    });
    score -= 1;
  }

  // Basic accessibility snapshot (HTML-only)
  // - Form controls should have a label (label[for], aria-label, aria-labelledby, or be wrapped by <label>)
  // - Buttons should have an accessible name (text or aria-label/aria-labelledby/title)
  const formControls = $('input, select, textarea');
  let formControlsMissingLabel = 0;
  formControls.each((_, el) => {
    const tag = el.tagName?.toLowerCase();
    if (tag === 'input') {
      const type = ($(el).attr('type') ?? '').toLowerCase();
      if (['hidden', 'submit', 'button', 'image', 'reset'].includes(type)) {
        return;
      }
    }

    const id = $(el).attr('id');
    const ariaLabel = $(el).attr('aria-label');
    const ariaLabelledBy = $(el).attr('aria-labelledby');
    const titleAttr = $(el).attr('title');

    const hasLabelFor = Boolean(
      id &&
      $('label').filter((_, labelEl) => $(labelEl).attr('for') === id).length >
        0,
    );
    const wrappedByLabel = $(el).parents('label').length > 0;

    const hasAccessibleName =
      Boolean(ariaLabel?.trim()) ||
      Boolean(ariaLabelledBy?.trim()) ||
      Boolean(titleAttr?.trim());

    if (!hasLabelFor && !wrappedByLabel && !hasAccessibleName) {
      formControlsMissingLabel += 1;
    }
  });

  if (formControlsMissingLabel > 0) {
    issues.push({
      category: 'seo',
      severity: formControlsMissingLabel >= 5 ? 'high' : 'medium',
      rule: 'a11y-form-labels-missing',
      message: `${formControlsMissingLabel} form controls missing an accessible label`,
      suggestion:
        'Add <label for>, wrap inputs with <label>, or provide aria-label/aria-labelledby',
      count: formControlsMissingLabel,
    });
    score -= Math.min(6, formControlsMissingLabel);
  }

  const buttons = $('button, [role="button"]');
  let buttonsMissingName = 0;
  buttons.each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const ariaLabel = $(el).attr('aria-label')?.trim();
    const ariaLabelledBy = $(el).attr('aria-labelledby')?.trim();
    const titleAttr = $(el).attr('title')?.trim();
    if (!text && !ariaLabel && !ariaLabelledBy && !titleAttr) {
      buttonsMissingName += 1;
    }
  });

  if (buttonsMissingName > 0) {
    issues.push({
      category: 'seo',
      severity: buttonsMissingName >= 3 ? 'medium' : 'low',
      rule: 'a11y-button-name-missing',
      message: `${buttonsMissingName} buttons missing an accessible name`,
      suggestion:
        'Ensure buttons have visible text or aria-label/aria-labelledby',
      count: buttonsMissingName,
    });
    score -= Math.min(3, buttonsMissingName);
  }

  // Check for structured data (JSON-LD)
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  if (!hasStructuredData) {
    issues.push({
      category: 'seo',
      severity: 'low',
      rule: 'missing-structured-data',
      message: 'No structured data (JSON-LD) found',
      suggestion: 'Add JSON-LD structured data for better rich snippets',
    });
    score -= 2;
  }

  // Check for lang attribute
  const lang = $('html').attr('lang');
  if (!lang) {
    issues.push({
      category: 'seo',
      severity: 'low',
      rule: 'missing-lang',
      message: 'HTML element missing lang attribute',
      suggestion: 'Add lang attribute: <html lang="en">',
    });
    score -= 2;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score,
    issues,
    metadata: {
      title: title || null,
      description: metaDescription || null,
      canonical: canonical || null,
      viewport: viewport || null,
      lang: lang || null,
      indexability: {
        robotsMeta: robots ?? null,
        googlebotMeta: googlebot ?? null,
        xRobotsTag,
        resolvedCanonical,
        canonicalSameOrigin,
        isNoindex,
        isNofollow,
      },
      security: {
        score: security.score,
        present: security.present,
      },
      accessibility: {
        imagesMissingAlt: imagesWithoutAlt.length,
        formControlsMissingLabel,
        buttonsMissingName,
      },
    },
  };
}
