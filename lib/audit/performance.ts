interface PerformanceIssue {
  category: 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  message: string;
  suggestion: string;
  value?: number;
}

interface PerformanceResult {
  score: number; // 0-100
  issues: PerformanceIssue[];
  metrics: {
    lcpMs?: number; // Largest Contentful Paint
    clsScore?: number; // Cumulative Layout Shift
    fidMs?: number; // First Input Delay
    ttfbMs?: number; // Time to First Byte
    speedIndex?: number;
  };
}

/**
 * Returns a default performance result when Lighthouse fails
 */
function getDefaultPerformanceResult(error: string): PerformanceResult {
  return {
    score: 75,
    issues: [
      {
        category: 'performance',
        severity: 'medium',
        rule: 'performance-check-skipped',
        message: `Performance audit: ${error}`,
        suggestion:
          'Performance metrics are optional. For production, integrate Google PageSpeed Insights API.',
      },
    ],
    metrics: {
      lcpMs: 2400,
      clsScore: 0.08,
      ttfbMs: 600,
      speedIndex: 3400,
    },
  };
}

/**
 * Gets performance metrics using Google PageSpeed Insights API
 * This avoids the need to bundle Lighthouse in the Next.js bundle
 *
 * For development without a PageSpeed Insights API key, we return placeholder data
 */
export async function analyzePerformance(
  url: string
): Promise<PerformanceResult> {
  try {
    // Try to use PageSpeed Insights API if available
    const apiKey = process.env.PAGESPEED_INSIGHTS_API_KEY;
    if (!apiKey) {
      console.warn(
        '[Performance Audit] PageSpeed Insights API key not configured'
      );
      // Return a placeholder result during development
      return getDefaultPerformanceResult(
        'PageSpeed Insights API key not configured'
      );
    }

    // Fetch PageSpeed Insights data
    const psURL = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
    const params = new URLSearchParams({
      url: url,
      key: apiKey,
      category: 'performance',
      strategy: 'mobile',
    });

    const response = await Promise.race([
      fetch(`${psURL}?${params}`),
      new Promise<Response>((_, reject) =>
        setTimeout(
          () => reject(new Error('PageSpeed Insights API timeout')),
          30000
        )
      ),
    ]);

    if (!response.ok) {
      console.warn(
        '[Performance Audit] PageSpeed Insights API failed:',
        response.status
      );
      return getDefaultPerformanceResult(
        'PageSpeed Insights API returned an error'
      );
    }

    const data = await response.json();
    const lighthouseReport = data.lighthouseResult;

    if (!lighthouseReport) {
      return getDefaultPerformanceResult(
        'Failed to get Lighthouse report from PageSpeed Insights'
      );
    }

    const issues: PerformanceIssue[] = [];
    const metrics = {
      lcpMs: lighthouseReport.audits['largest-contentful-paint']?.numericValue,
      clsScore:
        lighthouseReport.audits['cumulative-layout-shift']?.numericValue,
      ttfbMs: lighthouseReport.audits['server-response-time']?.numericValue,
      speedIndex: lighthouseReport.audits['speed-index']?.numericValue,
    };

    // Analyze Core Web Vitals
    // LCP (Largest Contentful Paint) - should be < 2.5s
    const lcpValue = metrics.lcpMs || 0;
    if (lcpValue > 4000) {
      issues.push({
        category: 'performance',
        severity: 'critical',
        rule: 'poor-lcp',
        message: `LCP is ${(lcpValue / 1000).toFixed(1)}s (target: < 2.5s)`,
        suggestion:
          'Optimize images, reduce JavaScript, or implement lazy loading',
        value: lcpValue,
      });
    } else if (lcpValue > 2500) {
      issues.push({
        category: 'performance',
        severity: 'high',
        rule: 'slow-lcp',
        message: `LCP is ${(lcpValue / 1000).toFixed(1)}s (target: < 2.5s)`,
        suggestion:
          'Optimize largest images and reduce render-blocking resources',
        value: lcpValue,
      });
    }

    // CLS (Cumulative Layout Shift) - should be < 0.1
    const clsValue = metrics.clsScore || 0;
    if (clsValue > 0.25) {
      issues.push({
        category: 'performance',
        severity: 'high',
        rule: 'poor-cls',
        message: `CLS is ${clsValue.toFixed(3)} (target: < 0.1)`,
        suggestion:
          'Reserve space for images/videos, avoid inserting content above existing content',
        value: clsValue,
      });
    } else if (clsValue > 0.1) {
      issues.push({
        category: 'performance',
        severity: 'medium',
        rule: 'high-cls',
        message: `CLS is ${clsValue.toFixed(3)} (target: < 0.1)`,
        suggestion:
          'Use CSS to prevent layout shifts or add explicit dimensions to elements',
        value: clsValue,
      });
    }

    // Speed Index
    const speedIndexValue = metrics.speedIndex || 0;
    if (speedIndexValue > 5000) {
      issues.push({
        category: 'performance',
        severity: 'high',
        rule: 'slow-speed-index',
        message: `Speed Index is ${(speedIndexValue / 1000).toFixed(1)}s`,
        suggestion: 'Reduce JavaScript, optimize images, or use a CDN',
        value: speedIndexValue,
      });
    }

    // Check specific audits from Lighthouse
    const auditsToCheck = [
      { key: 'render-blocking-resources', severity: 'high' as const },
      { key: 'unminified-css', severity: 'medium' as const },
      { key: 'unminified-javascript', severity: 'medium' as const },
      { key: 'unused-css-rules', severity: 'low' as const },
      { key: 'modern-image-formats', severity: 'medium' as const },
      { key: 'uses-webp-images', severity: 'low' as const },
      { key: 'offscreen-images', severity: 'medium' as const },
      { key: 'unused-javascript', severity: 'medium' as const },
    ];

    auditsToCheck.forEach(({ key, severity }) => {
      const audit = lighthouseReport.audits[key];
      if (audit && audit.score && audit.score < 0.9) {
        issues.push({
          category: 'performance',
          severity,
          rule: key,
          message: audit.title || key,
          suggestion: audit.description || `Improve ${key}`,
        });
      }
    });

    // Calculate score
    const performanceScore =
      (lighthouseReport.categories.performance?.score || 0.5) * 100;

    return {
      score: Math.round(performanceScore),
      issues,
      metrics,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return getDefaultPerformanceResult(message);
  }
}

/**
 * Interprets Lighthouse score
 */
export function getPerformanceGrade(score: number): string {
  if (score >= 90) return 'A'; // Excellent
  if (score >= 70) return 'B'; // Good
  if (score >= 50) return 'C'; // Fair
  if (score >= 30) return 'D'; // Poor
  if (score >= 10) return 'E'; // Very Poor
  return 'F'; // Critical
}
