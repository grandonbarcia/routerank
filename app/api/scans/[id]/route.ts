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

    // Fetch the scan
    const { data: scan, error } = await supabase
      .from('scans')
      .select(
        `
        id,
        url,
        status,
        scores,
        grade,
        created_at,
        updated_at,
        audit_issues (
          id,
          category,
          severity,
          issue,
          recommendation
        )
      `
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    // Transform the response
    return NextResponse.json({
      id: scan.id,
      url: scan.url,
      status: scan.status,
      scores: scan.scores,
      grade: scan.grade,
      issues: scan.audit_issues || [],
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,
    });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
