import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the scan with all details
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select(
        `
        id,
        url,
        domain,
        status,
        seo_score,
        performance_score,
        nextjs_score,
        overall_score,
        lighthouse_data,
        error_message,
        created_at,
        completed_at
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Fetch issues for this scan
    const { data: issues, error: issuesError } = await supabase
      .from('audit_issues')
      .select(
        `
        id,
        category,
        severity,
        rule_id,
        title,
        message,
        fix_suggestion,
        fix_code,
        metadata
      `
      )
      .eq('scan_id', id)
      .order('severity', { ascending: false });

    if (issuesError) {
      throw issuesError;
    }

    return NextResponse.json({
      scan: {
        id: scan.id,
        url: scan.url,
        domain: scan.domain,
        status: scan.status,
        seoScore: scan.seo_score,
        performanceScore: scan.performance_score,
        nextjsScore: scan.nextjs_score,
        overallScore: scan.overall_score,
        lighthouseData: scan.lighthouse_data,
        errorMessage: scan.error_message,
        createdAt: scan.created_at,
        completedAt: scan.completed_at,
      },
      issues: issues || [],
    });
  } catch (error) {
    console.error('[API] Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
