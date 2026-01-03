import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAudit, executeQuickAudit } from '@/lib/audit/execute';
import { z } from 'zod';

// Validation schema
const createScanSchema = z.object({
  url: z
    .string()
    .min(1, 'URL is required')
    .transform((val) => {
      // Add https:// if no protocol
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return 'https://' + val;
      }
      return val;
    })
    .pipe(z.string().url('Invalid URL')),
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
      .select('subscription_tier, scans_today, last_scan_date')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Check daily scan limits based on tier
    const limits = {
      free: 1,
      pro: Infinity, // No limit
      agency: Infinity, // No limit
    };

    const today = new Date().toISOString().split('T')[0];
    const lastScanDate = profile.last_scan_date
      ? new Date(profile.last_scan_date).toISOString().split('T')[0]
      : null;

    // Reset daily count if it's a new day
    let scansToday = lastScanDate === today ? profile.scans_today : 0;

    const limit = limits[profile.subscription_tier as keyof typeof limits];
    if (scansToday >= limit) {
      return NextResponse.json(
        {
          error: `Daily scan limit reached (${limit} scans/day for ${profile.subscription_tier} plan). Try again tomorrow.`,
          scansToday,
          limit,
        },
        { status: 429 }
      );
    }

    // Create scan record
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        url,
        domain,
        status: 'pending',
        seo_score: null,
        performance_score: null,
        nextjs_score: null,
        overall_score: null,
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
    runAuditInBackground(scan.id, url, user.id, fullAudit).catch((err) =>
      console.error('[Background Job] Error:', err)
    );

    return NextResponse.json(
      {
        scanId: scan.id,
        status: 'pending',
        url,
        message: 'Scan started. Check back shortly for results.',
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

    // Mark scan as running
    await supabase.from('scans').update({ status: 'running' }).eq('id', scanId);

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
          error_message: auditResult.error || 'Unknown error',
        })
        .eq('id', scanId);

      console.error(
        `[Background Job] Audit ${scanId} failed:`,
        auditResult.error
      );
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
        lighthouse_data: report.lighthouseData || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scanId);

    // Insert issues into audit_issues table
    const issues = report.issues.map((issue: any) => ({
      scan_id: scanId,
      category: issue.category,
      severity: issue.severity,
      rule_id: issue.rule,
      title: issue.message,
      message: issue.suggestion || '',
      fix_suggestion: issue.suggestion,
      metadata: issue.metadata || {},
    }));

    if (issues.length > 0) {
      await supabase.from('audit_issues').insert(issues);
    }

    // Update user's daily scan count and last_scan_date
    const today = new Date().toISOString().split('T')[0];
    const { data: profile } = await supabase
      .from('profiles')
      .select('scans_today, last_scan_date')
      .eq('id', userId)
      .single();

    if (profile) {
      const lastScanDate = profile.last_scan_date
        ? new Date(profile.last_scan_date).toISOString().split('T')[0]
        : null;

      const newScansToday =
        lastScanDate === today ? profile.scans_today + 1 : 1;

      await supabase
        .from('profiles')
        .update({
          scans_today: newScansToday,
          last_scan_date: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    console.log(`[Background Job] Audit ${scanId} completed successfully`);
  } catch (error) {
    console.error('[Background Job] Audit failed:', error);

    // Try to update scan status as failed
    try {
      const supabase = await createClient();
      await supabase
        .from('scans')
        .update({
          status: 'failed',
          error_message: 'Internal server error during audit',
        })
        .eq('id', scanId);
    } catch {
      // Silently fail
    }
  }
}
