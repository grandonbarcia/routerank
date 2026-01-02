import * as cheerio from 'cheerio';

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
  };
}

/**
 * Analyzes HTML for SEO issues
 */
export function analyzeSeo(html: string, baseUrl: string): SeoResult {
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
    },
  };
}
