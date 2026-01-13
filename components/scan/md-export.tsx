'use client';

import { useState } from 'react';
import { Download, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AuditReport } from '@/lib/audit/execute';

type PerformanceMetrics = {
  lcpMs?: number;
  clsScore?: number;
  fidMs?: number;
  ttfbMs?: number;
  speedIndex?: number;
};

type MDExportProps =
  | {
      mode: 'report';
      report: AuditReport;
      url: string;
      filename?: string;
    }
  | {
      mode: 'scanId';
      scanId: string;
      filename?: string;
    };

function safeFilenamePart(input: string): string {
  return input
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function formatMsToSeconds(ms?: number): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '-';
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(value?: number, digits: number = 3): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return value.toFixed(digits);
}

function buildMarkdownReport(report: AuditReport, url: string): string {
  const lines: string[] = [];
  const perf = (report.metadata?.performance ?? {}) as PerformanceMetrics;

  lines.push(`# RouteRank Audit Report`);
  lines.push('');
  lines.push(`- **URL:** ${url}`);
  lines.push(`- **Checked at:** ${report.checkedAt ?? '-'}`);
  lines.push(`- **Audit mode:** ${report.isQuickAudit ? 'Quick' : 'Full'}`);
  lines.push('');

  lines.push('## Scores');
  lines.push('');
  lines.push(
    `- **Overall:** ${Math.round(report.scores.overall)}/100 (${
      report.scores.grade
    })`
  );
  lines.push(`- **SEO:** ${Math.round(report.scores.seo)}/100`);
  lines.push(`- **Performance:** ${Math.round(report.scores.performance)}/100`);
  lines.push(`- **Next.js:** ${Math.round(report.scores.nextjs)}/100`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push(report.summary || '-');
  lines.push('');

  lines.push('## Key Performance Metrics');
  lines.push('');
  lines.push(`- **LCP:** ${formatMsToSeconds(perf.lcpMs)}`);
  lines.push(`- **CLS:** ${formatNumber(perf.clsScore, 3)}`);
  lines.push(`- **TTFB:** ${formatMsToSeconds(perf.ttfbMs)}`);
  lines.push(`- **Speed Index:** ${formatMsToSeconds(perf.speedIndex)}`);
  lines.push('');

  lines.push(`## Issues (${report.issues.length})`);
  lines.push('');

  for (const issue of report.issues) {
    lines.push(
      `### ${issue.category.toUpperCase()} • ${issue.severity.toUpperCase()} • ${
        issue.rule
      }`
    );
    lines.push('');
    lines.push(`**${issue.message}**`);
    lines.push('');
    if (issue.suggestion) {
      lines.push(`- Suggestion: ${issue.suggestion}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function MDExport(props: MDExportProps) {
  const [loading, setLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  const downloadMd = async () => {
    setLoading(true);
    try {
      let blob: Blob;
      let filename = props.filename;

      if (props.mode === 'report') {
        const md = buildMarkdownReport(props.report, props.url);
        blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        if (!filename) {
          const now = new Date();
          const stamp = `${now.getFullYear()}-${String(
            now.getMonth() + 1
          ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          filename = `audit-report-${safeFilenamePart(props.url)}-${stamp}.md`;
        }
      } else {
        // Back-compat path (older saved scans). Note: server export may be disabled.
        const response = await fetch(
          `/api/scans/${props.scanId}/export?format=md`
        );
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error || 'Failed to export Markdown');
        }
        blob = await response.blob();
        filename = filename ?? `audit-report-${props.scanId}.md`;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess('Markdown downloaded successfully!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate Markdown';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={downloadMd}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition"
    >
      {loading ? (
        <>
          <Loader className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Export .md
        </>
      )}
    </button>
  );
}
