import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAudit, executeQuickAudit } from '@/lib/audit/execute';
import { z } from 'zod';

// Validation schema
const createScanSchema = z.object({
  url: z.string().url('Invalid URL'),
  fullAudit: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validation = createScanSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request: ' + validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { url, fullAudit } = validation.data;

    // Check user's plan and scan quota
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, scans_count, scans_limit')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check scan limits based on tier
    const limits = {
      free: 5,
      pro: 100,
      agency: null, // Unlimited
    };

    const limit = limits[profile.subscription_tier as keyof typeof limits];
    if (limit && profile.scans_count >= limit) {
      return NextResponse.json(
        {
          error: `Scan limit reached (${limit} scans/month for ${profile.subscription_tier} plan)`,
        },
        { status: 429 }
      );
    }

    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        url,
        status: 'in_progress',
        seo_score: 0,
        performance_score: 0,
        nextjs_score: 0,
        overall_score: 0,
      })
      .select()
      .single();

    if (scanError) {
      return NextResponse.json(
        { error: 'Failed to create scan' },
        { status: 500 }
      );
    }

    // Start audit in background (don't wait for it)
    // In production, this should be a background job (e.g., Redis queue)
    runAuditInBackground(scan.id, url, user.id, fullAudit);

    return NextResponse.json(
      {
        scanId: scan.id,
        status: 'in_progress',
        url,
        message: 'Scan started. You will be notified when complete.',
      },
      { status: 202 } // Accepted - processing in background
    );
  } catch (error) {
    console.error('[API] Scan creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Runs audit in background and updates database
 * In production, this should be a proper job queue (Bull, RQ, etc.)
 */
async function runAuditInBackground(
  scanId: string,
  url: string,
  userId: string,
  fullAudit: boolean
) {
  try {
    const supabase = await createClient();

    // Run the appropriate audit
    const auditResult = fullAudit
      ? await executeAudit({ url, userId, scanId })
      : await executeQuickAudit({ url, userId, scanId });

    if (!auditResult.success) {
      // Update scan with error
      await supabase
        .from('scans')
        .update({
          status: 'failed',
          error: auditResult.error,
        })
        .eq('id', scanId);

      return;
    }

    const report = auditResult.report!;

    // Update scan with results
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        seo_score: report.scores.seo,
        performance_score: report.scores.performance,
        nextjs_score: report.scores.nextjs,
        overall_score: report.scores.overall,
        grade: report.scores.grade,
        total_issues: report.totalIssues,
        critical_issues: report.criticalIssues,
        report_data: report,
      })
      .eq('id', scanId);

    // Insert issues into audit_issues table
    const issues = report.issues.map((issue: any) => ({
      scan_id: scanId,
      category: issue.category,
      severity: issue.severity,
      rule: issue.rule,
      message: issue.message,
      suggestion: issue.suggestion,
    }));

    if (issues.length > 0) {
      await supabase.from('audit_issues').insert(issues);
    }

    // Update user's scan count
    await supabase.rpc('increment_scans_count', { user_id: userId });

    console.log(`[Background Job] Audit ${scanId} completed successfully`);
  } catch (error) {
    console.error('[Background Job] Audit failed:', error);
  }
}
