export interface AuditIssue {
  category: 'seo' | 'performance' | 'nextjs';
  severity: 'critical' | 'high' | 'medium' | 'low';
  rule: string;
  message: string;
  suggestion: string;
}

export interface AuditScores {
  overall: number; // 0-100
  seo: number; // 0-100
  performance: number; // 0-100
  nextjs: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface AuditResult {
  scores: AuditScores;
  issues: AuditIssue[];
  totalIssues: number;
  criticalIssues: number;
  summary: string;
}

/**
 * Weights for different audit categories
 * Adjusted for SaaS focused on SEO and performance
 */
const CATEGORY_WEIGHTS = {
  seo: 0.4, // 40% - SEO is crucial
  performance: 0.4, // 40% - Performance directly affects rankings
  nextjs: 0.2, // 20% - Best practices bonus
};

/**
 * Severity weights for issue prioritization
 */
const SEVERITY_WEIGHTS = {
  critical: 1.0,
  high: 0.7,
  medium: 0.4,
  low: 0.1,
};

/**
 * Calculates overall audit score from individual category scores
 */
export function calculateAuditScore(scores: {
  seo: number;
  performance: number;
  nextjs: number;
  nextjsApplicable?: boolean;
}): AuditScores {
  const nextjsApplicable = scores.nextjsApplicable !== false;

  // Weighted average (renormalize if Next.js is not applicable)
  const weights = nextjsApplicable
    ? CATEGORY_WEIGHTS
    : {
        seo: CATEGORY_WEIGHTS.seo,
        performance: CATEGORY_WEIGHTS.performance,
        nextjs: 0,
      };

  const weightSum = weights.seo + weights.performance + weights.nextjs;
  const overallRaw =
    scores.seo * weights.seo +
    scores.performance * weights.performance +
    scores.nextjs * weights.nextjs;

  const overall = weightSum > 0 ? overallRaw / weightSum : 0;

  const roundedOverall = Math.round(overall);

  return {
    overall: roundedOverall,
    seo: scores.seo,
    performance: scores.performance,
    nextjs: scores.nextjs,
    grade: getGrade(roundedOverall),
  };
}

/**
 * Converts score to letter grade
 */
export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (score >= 90) return 'A'; // Excellent
  if (score >= 80) return 'B'; // Good
  if (score >= 70) return 'C'; // Fair
  if (score >= 60) return 'D'; // Poor
  if (score >= 50) return 'E'; // Very Poor
  return 'F'; // Critical
}

/**
 * Generates a human-readable summary of the audit
 */
export function generateSummary(
  scores: AuditScores,
  totalIssues: number,
  options?: { nextjsApplicable?: boolean },
): string {
  const { overall, grade, seo, performance, nextjs } = scores;
  const nextjsApplicable = options?.nextjsApplicable !== false;

  let summary = `Overall Score: ${overall}/100 (Grade: ${grade}). `;

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (seo >= 80) strengths.push('SEO');
  else if (seo < 60) weaknesses.push('SEO');

  if (performance >= 80) strengths.push('Performance');
  else if (performance < 60) weaknesses.push('Performance');

  if (nextjsApplicable) {
    if (nextjs >= 80) strengths.push('Next.js practices');
    else if (nextjs < 60) weaknesses.push('Next.js practices');
  }

  if (strengths.length > 0) {
    summary += `Strengths: ${strengths.join(', ')}. `;
  }

  if (weaknesses.length > 0) {
    summary += `Areas for improvement: ${weaknesses.join(', ')}. `;
  }

  summary += `Found ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}.`;

  return summary;
}

/**
 * Prioritizes issues by severity and impact
 */
export function prioritizeIssues(
  issues: AuditIssue[],
  limit?: number,
): AuditIssue[] {
  // Sort by severity (critical first) and category
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...issues].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // Secondary sort by category importance
    const categoryOrder = { seo: 0, performance: 1, nextjs: 2 };
    return categoryOrder[a.category] - categoryOrder[b.category];
  });

  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Creates full audit report from component results
 */
export function createAuditReport(
  seoScore: number,
  performanceScore: number,
  nextjsScore: number,
  issues: AuditIssue[],
  options?: { nextjsApplicable?: boolean },
): AuditResult {
  const nextjsApplicable = options?.nextjsApplicable !== false;

  const scores = calculateAuditScore({
    seo: seoScore,
    performance: performanceScore,
    nextjs: nextjsScore,
    nextjsApplicable,
  });

  const criticalIssues = issues.filter((i) => i.severity === 'critical').length;

  return {
    scores,
    issues: prioritizeIssues(issues),
    totalIssues: issues.length,
    criticalIssues,
    summary: generateSummary(scores, issues.length, { nextjsApplicable }),
  };
}

/**
 * Generates actionable recommendations from issues
 */
export function getTopRecommendations(
  issues: AuditIssue[],
  limit: number = 5,
): AuditIssue[] {
  return prioritizeIssues(issues, limit);
}

/**
 * Calculates issue impact score (0-1) based on severity
 */
export function calculateIssueImpact(issue: AuditIssue): number {
  const severityWeight = SEVERITY_WEIGHTS[issue.severity];
  const categoryWeight =
    CATEGORY_WEIGHTS[issue.category as keyof typeof CATEGORY_WEIGHTS];
  return severityWeight * categoryWeight;
}
