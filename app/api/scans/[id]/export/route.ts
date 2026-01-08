import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  AuditPdfDocument,
  type AuditPdfData,
  type PdfCategory,
  type PdfSeverity,
} from '@/lib/reports/audit-pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';
    const requestedWhiteLabel = url.searchParams.get('whiteLabel') === 'true';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const subscriptionTier = profile?.subscription_tier as
      | 'free'
      | 'pro'
      | 'agency'
      | undefined;

    const whiteLabel =
      subscriptionTier === 'agency' ? true : requestedWhiteLabel;

    if (whiteLabel && subscriptionTier !== 'agency') {
      return NextResponse.json(
        { error: 'White-label export is available on the Agency plan.' },
        { status: 403 }
      );
    }

    // Fetch scan with details
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Fetch issues
    const { data: issues } = await supabase
      .from('audit_issues')
      .select('*')
      .eq('scan_id', id);

    // Generate PDF content - for now, return JSON that can be used by frontend
    // In production, you'd use a PDF library like @react-pdf/renderer on the server
    // or use a service like Puppeteer to generate PDFs

    const issueRows = (issues || []) as unknown as Array<{
      id: string;
      category: PdfCategory;
      severity: PdfSeverity;
      title: string;
      message: string;
      fix_suggestion?: string | null;
    }>;

    const reportData: AuditPdfData = {
      scan: {
        id: scan.id,
        url: scan.url,
        domain: scan.domain,
        seoScore: scan.seo_score,
        performanceScore: scan.performance_score,
        nextjsScore: scan.nextjs_score,
        overallScore: scan.overall_score,
        createdAt: scan.created_at,
        completedAt: scan.completed_at,
      },
      issues: issueRows.map((issue) => ({
        id: issue.id,
        category: issue.category,
        severity: issue.severity,
        title: issue.title,
        message: issue.message,
        fixSuggestion: issue.fix_suggestion ?? null,
      })),
      generatedAt: new Date().toISOString(),
    };

    if (format === 'md') {
      const filename = whiteLabel
        ? `audit-report-${scan.domain}.md`
        : `routerank-audit-${scan.domain}.md`;

      const markdownLines: string[] = [];
      markdownLines.push(`# Audit Report`);
      markdownLines.push('');
      markdownLines.push(`- URL: ${reportData.scan.url}`);
      markdownLines.push(`- Domain: ${reportData.scan.domain}`);
      markdownLines.push(
        `- Completed: ${new Date(
          reportData.scan.completedAt || reportData.scan.createdAt
        ).toISOString()}`
      );
      markdownLines.push(`- Generated: ${reportData.generatedAt}`);
      markdownLines.push('');
      markdownLines.push('## Scores');
      markdownLines.push('');
      markdownLines.push(`- Overall: ${reportData.scan.overallScore ?? '-'}`);
      markdownLines.push(
        `- Performance: ${reportData.scan.performanceScore ?? '-'}`
      );
      markdownLines.push(`- SEO: ${reportData.scan.seoScore ?? '-'}`);
      markdownLines.push(`- Next.js: ${reportData.scan.nextjsScore ?? '-'}`);
      markdownLines.push('');
      markdownLines.push(`## Issues (${reportData.issues.length})`);
      markdownLines.push('');

      if (reportData.issues.length === 0) {
        markdownLines.push('No issues found.');
      } else {
        markdownLines.push('| Category | Severity | Title |');
        markdownLines.push('| --- | --- | --- |');
        for (const issue of reportData.issues) {
          const safeTitle = issue.title.replace(/\|/g, '\\|');
          markdownLines.push(
            `| ${issue.category} | ${issue.severity} | ${safeTitle} |`
          );
        }

        markdownLines.push('');
        markdownLines.push('### Details');
        markdownLines.push('');
        for (const issue of reportData.issues) {
          markdownLines.push(`#### ${issue.title}`);
          markdownLines.push('');
          markdownLines.push(`- Category: ${issue.category}`);
          markdownLines.push(`- Severity: ${issue.severity}`);
          markdownLines.push('');
          markdownLines.push(issue.message);
          if (issue.fixSuggestion) {
            markdownLines.push('');
            markdownLines.push(`**Suggestion:** ${issue.fixSuggestion}`);
          }
          markdownLines.push('');
        }
      }

      const markdown = markdownLines.join('\n');

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (format === 'pdf') {
      const element = AuditPdfDocument({ data: reportData, whiteLabel });
      const buffer = await renderToBuffer(element);

      const filename = whiteLabel
        ? `audit-report-${scan.domain}.pdf`
        : `routerank-audit-${scan.domain}.pdf`;

      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('[API] PDF export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
