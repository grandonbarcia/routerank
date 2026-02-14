'use server';

import { fetchHtml } from './fetcher';
import { analyzeSeo } from './seo';
import { analyzeNextjs } from './nextjs';
import { analyzePerformance } from './performance';
import { analyzeTechStack } from './tech';
import { fetchRenderedHtml } from './rendered';
import { createAuditReport } from './scoring';
import type { AuditIssue, AuditResult } from './scoring';

export interface ExecuteAuditParams {
  url: string;
  userId: string;
  scanId?: string;
  deepTechDetect?: boolean;
}

export interface ExecuteAuditResult {
  success: boolean;
  error?: string;
  scanId?: string;
  url?: string;
  report?: AuditReport;
}

export type AuditReport = AuditResult & {
  metadata: {
    seo: unknown;
    performance?: unknown;
    nextjs: unknown;
    tech?: unknown;
  };
  checkedAt: string;
  userId: string;
  isQuickAudit?: boolean;
};

/**
 * Main audit execution function
 * Orchestrates HTML fetching, analysis, and scoring
 */
export async function executeAudit(
  params: ExecuteAuditParams,
): Promise<ExecuteAuditResult> {
  try {
    const { url, userId, deepTechDetect } = params;

    // Step 1: Fetch HTML
    console.log(`[Audit] Starting audit for ${url}`);
    const fetchResult = await fetchHtml(url);

    if (!fetchResult.success) {
      return {
        success: false,
        error: fetchResult.error || 'Failed to fetch URL',
      };
    }

    const html = fetchResult.html!;
    const normalizedUrl = fetchResult.url!;

    console.log(`[Audit] HTML fetched (${html.length} bytes)`);

    // Step 2: Run SEO analysis
    console.log(`[Audit] Running SEO analysis`);
    const seoResult = analyzeSeo(html, normalizedUrl);
    console.log(
      `[Audit] SEO score: ${seoResult.score}/100 (${seoResult.issues.length} issues)`,
    );

    // Step 3: Run Next.js analysis
    console.log(`[Audit] Running Next.js analysis`);
    const nextjsResult = analyzeNextjs(html);
    console.log(
      `[Audit] Next.js score: ${nextjsResult.score}/100 (${nextjsResult.issues.length} issues)`,
    );

    const nextjsApplicable = nextjsResult.checks.detected === true;

    let techHtml = html;
    if (deepTechDetect) {
      const rendered = await fetchRenderedHtml(normalizedUrl);
      if (rendered.success && rendered.html) {
        techHtml = rendered.html;
      }
    }

    const techResult = analyzeTechStack({
      html: techHtml,
      url: normalizedUrl,
      headers: fetchResult.headers,
      nextjsDetected: nextjsApplicable,
    });

    // Step 4: Run performance analysis
    console.log(
      `[Audit] Running performance analysis (this may take 1-2 minutes)`,
    );
    let performanceResult: {
      score: number;
      issues: AuditIssue[];
      metrics: unknown;
    };
    try {
      performanceResult = await analyzePerformance(normalizedUrl);
      console.log(`[Audit] Performance score: ${performanceResult.score}/100`);
    } catch (error) {
      console.error('[Audit] Performance analysis failed:', error);
      // Use fallback performance result
      performanceResult = {
        score: 50,
        issues: [
          {
            category: 'performance' as const,
            severity: 'high' as const,
            rule: 'performance-check-failed',
            message: 'Could not perform performance audit',
            suggestion: 'Try again in a few moments',
          },
        ],
        metrics: {},
      };
    }

    // Step 5: Combine all issues
    const allIssues: AuditIssue[] = [
      ...seoResult.issues,
      ...nextjsResult.issues,
      ...performanceResult.issues,
    ];

    // Step 6: Generate audit report
    console.log(`[Audit] Generating audit report`);
    const report = createAuditReport(
      seoResult.score,
      performanceResult.score,
      nextjsResult.score,
      allIssues,
      { nextjsApplicable },
    );

    console.log(
      `[Audit] Audit complete: ${report.scores.overall}/100 (Grade: ${report.scores.grade})`,
    );

    return {
      success: true,
      scanId: params.scanId,
      url: normalizedUrl,
      report: {
        ...report,
        metadata: {
          seo: seoResult.metadata,
          performance: performanceResult.metrics,
          nextjs: nextjsResult.checks,
          tech: techResult,
        },
        checkedAt: new Date().toISOString(),
        userId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Audit] Fatal error:', message);
    return {
      success: false,
      error: `Audit execution failed: ${message}`,
    };
  }
}

/**
 * Quick audit - runs SEO and Next.js checks (no performance)
 * Faster for immediate feedback
 */
export async function executeQuickAudit(
  params: ExecuteAuditParams,
): Promise<ExecuteAuditResult> {
  try {
    const { url } = params;

    console.log(`[Quick Audit] Starting for ${url}`);
    const fetchResult = await fetchHtml(url);

    if (!fetchResult.success) {
      return {
        success: false,
        error: fetchResult.error,
      };
    }

    const html = fetchResult.html!;
    const normalizedUrl = fetchResult.url!;

    const seoResult = analyzeSeo(html, normalizedUrl);
    const nextjsResult = analyzeNextjs(html);

    const nextjsApplicable = nextjsResult.checks.detected === true;

    let techHtml = html;
    if (params.deepTechDetect) {
      const rendered = await fetchRenderedHtml(normalizedUrl);
      if (rendered.success && rendered.html) {
        techHtml = rendered.html;
      }
    }

    const techResult = analyzeTechStack({
      html: techHtml,
      url: normalizedUrl,
      headers: fetchResult.headers,
      nextjsDetected: nextjsApplicable,
    });

    // Use placeholder performance result
    const performanceResult: {
      score: number;
      issues: AuditIssue[];
      metrics: unknown;
    } = {
      score: 75, // Placeholder
      issues: [
        {
          category: 'performance' as const,
          severity: 'low' as const,
          rule: 'performance-not-checked',
          message: 'Full performance audit not run in quick mode',
          suggestion: 'Run full audit to check performance metrics',
        },
      ],
      metrics: {},
    };

    const allIssues: AuditIssue[] = [
      ...seoResult.issues,
      ...nextjsResult.issues,
      ...performanceResult.issues,
    ];
    const report = createAuditReport(
      seoResult.score,
      performanceResult.score,
      nextjsResult.score,
      allIssues,
      { nextjsApplicable },
    );

    console.log(`[Quick Audit] Complete: ${report.scores.overall}/100`);

    return {
      success: true,
      scanId: params.scanId,
      url: normalizedUrl,
      report: {
        ...report,
        isQuickAudit: true,
        metadata: {
          seo: seoResult.metadata,
          nextjs: nextjsResult.checks,
          tech: techResult,
        },
        checkedAt: new Date().toISOString(),
        userId: params.userId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Quick audit failed: ${message}`,
    };
  }
}
