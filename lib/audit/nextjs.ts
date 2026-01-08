import * as cheerio from 'cheerio';

interface NextjsIssue {
  category: 'nextjs';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  message: string;
  suggestion: string;
}

interface NextjsResult {
  score: number; // 0-100
  issues: NextjsIssue[];
  checks: {
    usesNextImage: boolean;
    usesNextFont: boolean;
    usesMetadataApi: boolean;
    hasServerComponents: boolean;
  };
}

/**
 * Analyzes HTML for Next.js best practices
 */
export function analyzeNextjs(html: string): NextjsResult {
  const $ = cheerio.load(html);
  const issues: NextjsIssue[] = [];
  let score = 100;

  const checks = {
    usesNextImage: false,
    usesNextFont: false,
    usesMetadataApi: false,
    hasServerComponents: false,
  };

  // Check for next/image usage (looking for next-image data attributes)
  // In real Next.js apps, next/image creates img tags with data-nimg="fill" or similar
  const nextImages = $('img[data-nimg]');
  if (nextImages.length > 0) {
    checks.usesNextImage = true;
  } else {
    // Check if there are unoptimized images
    const images = $('img');
    if (images.length > 0) {
      issues.push({
        category: 'nextjs',
        severity: 'high',
        rule: 'unoptimized-images',
        message: 'Images are not using next/image optimization',
        suggestion:
          'Replace <img> tags with next/image for automatic optimization',
      });
      score -= 8;
    }
  }

  // Check for next/font usage
  // Look for preconnect links to fonts.googleapis.com or fonts.gstatic.com
  const fontPreconnect = $('link[rel="preconnect"][href*="fonts"]');
  if (fontPreconnect.length > 0) {
    checks.usesNextFont = true;
  } else {
    // Check for external font loading that could be optimized
    const externalFonts = $('link[href*="fonts.googleapis"]');
    if (externalFonts.length > 0) {
      issues.push({
        category: 'nextjs',
        severity: 'medium',
        rule: 'unoptimized-fonts',
        message: 'External fonts not using next/font optimization',
        suggestion: 'Use next/font to automatically optimize font loading',
      });
      score -= 5;
    }
  }

  // Check for Metadata API (Next.js 13+)
  // This is harder to detect from HTML alone, but we can look for meta tags that suggest it
  const hasMetaTags = $('meta[property], meta[name]').length > 5;
  if (hasMetaTags) {
    // Likely using Metadata API if there are well-formed meta tags
    checks.usesMetadataApi = true;
  }

  // Check for responsive images (srcset)
  const responsiveImages = $('img[srcset]').length;
  const totalImages = $('img').length;
  if (totalImages > 0 && responsiveImages === 0) {
    issues.push({
      category: 'nextjs',
      severity: 'medium',
      rule: 'missing-responsive-images',
      message: 'Images are not responsive (missing srcset)',
      suggestion:
        'Use next/image or add srcset attributes for responsive images',
    });
    score -= 4;
  }

  // Check for critical CSS loading
  // Look for style tags or critical CSS hints
  const styleSheets = $('link[rel="stylesheet"]');
  if (styleSheets.length > 0) {
    // Check if any are marked as critical
    const criticalSheets = styleSheets.filter((i, el) => {
      const media = $(el).attr('media');
      return !media || media === 'all';
    });

    if (criticalSheets.length > 2) {
      issues.push({
        category: 'nextjs',
        severity: 'low',
        rule: 'multiple-stylesheets',
        message: `Page loads ${criticalSheets.length} stylesheets`,
        suggestion:
          'Consider consolidating stylesheets and using CSS-in-JS (like Tailwind or CSS Modules)',
      });
      score -= 2;
    }
  }

  // Check for blocking scripts
  // Only consider *external* scripts with a src attribute.
  // Ignore Next.js internal scripts and module scripts (module scripts are deferred by default).
  const scripts = $(
    'script[src]:not([async]):not([defer]):not([type="module"])'
  ).filter((_, el) => {
    const src = $(el).attr('src')?.trim() || '';
    if (!src) return false;

    // Ignore Next.js internal assets
    if (src.startsWith('/_next/') || src.includes('/_next/')) return false;

    // Ignore scripts managed by next/script
    if ($(el).attr('data-nscript')) return false;

    return true;
  });

  if (scripts.length > 0) {
    issues.push({
      category: 'nextjs',
      severity: 'high',
      rule: 'blocking-scripts',
      message: `${scripts.length} blocking scripts found`,
      suggestion:
        'Add async or defer attributes to non-critical scripts, or move them to next/script with strategy prop',
    });
    score -= 6;
  }

  // Check for third-party scripts
  const thirdPartyScripts = $(
    'script[src*="google"], script[src*="facebook"], script[src*="analytics"]'
  ).length;
  if (thirdPartyScripts > 0) {
    issues.push({
      category: 'nextjs',
      severity: 'medium',
      rule: 'unoptimized-third-party',
      message: `${thirdPartyScripts} third-party scripts found`,
      suggestion:
        'Use next/script component with appropriate strategy (afterInteractive, lazyOnload, etc.)',
    });
    score -= 3;
  }

  // Check for Vercel Analytics or Next.js built-in features
  const vercelAnalytics = $('script[src*="vercel"], script[src*="vitals"]');
  if (vercelAnalytics.length > 0) {
    checks.usesMetadataApi = true; // Assume using modern Next.js patterns
  }

  // Check for dynamic imports hint
  const hasDynamicCode = html.includes('dynamic') || html.includes('lazy');
  if (hasDynamicCode) {
    // Likely using dynamic imports for code splitting
  }

  // Check for API routes usage (hard to detect from HTML)
  // Look for fetch calls to /api/
  if (html.includes('/api/')) {
    // Likely using API routes
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  return {
    score,
    issues,
    checks,
  };
}

/**
 * Provides recommendations for improving Next.js usage
 */
export function getNextjsRecommendations(
  checks: NextjsResult['checks']
): string[] {
  const recommendations: string[] = [];

  if (!checks.usesNextImage) {
    recommendations.push(
      'Migrate image tags to next/image for better performance'
    );
  }

  if (!checks.usesNextFont) {
    recommendations.push('Use next/font for optimized font loading');
  }

  if (!checks.usesMetadataApi) {
    recommendations.push(
      'Use Metadata API (generateMetadata) for dynamic meta tags in Next.js 13+'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Great job! You are following Next.js best practices.'
    );
  }

  return recommendations;
}
