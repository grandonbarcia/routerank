import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

    // Get authenticated user (optional: guests are allowed)
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      );
    }

    // Guest flow: run audit immediately and return the report (not persisted)
    if (!user) {
      const auditResult = fullAudit
        ? await executeAudit({ url, userId: 'guest' })
        : await executeQuickAudit({ url, userId: 'guest' });

      if (!auditResult.success || !auditResult.report) {
        return NextResponse.json(
          { error: auditResult.error || 'Failed to run audit' },
          { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
      }

      return NextResponse.json(
        {
          status: 'completed',
          url: auditResult.url || url,
          report: auditResult.report,
          guest: true,
        },
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      );
    }

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
      free: Infinity, // No limit
      pro: Infinity, // No limit
      agency: Infinity, // No limit
    };

    const today = new Date().toISOString().split('T')[0];
    const lastScanDate = profile.last_scan_date
      ? new Date(profile.last_scan_date).toISOString().split('T')[0]
      : null;

    // Reset daily count if it's a new day
    const scansToday = lastScanDate === today ? profile.scans_today : 0;

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
      })
      .select()
      .single();

    if (scanError) {
      console.error('[API] Failed to create scan:', scanError);
      return NextResponse.json(
        {
          error: 'Failed to create scan',
          ...(process.env.NODE_ENV !== 'production'
            ? { detail: scanError.message, code: scanError.code }
            : null),
        },
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
    const supabase = createAdminClient();

    // Mark scan as running
    {
      const { error } = await supabase
        .from('scans')
        .update({ status: 'running' })
        .eq('id', scanId);
      if (error) {
        console.error('[Background Job] Failed to mark scan running:', error);
      }
    }

    // Run the appropriate audit
    const auditResult = fullAudit
      ? await executeAudit({ url, userId, scanId })
      : await executeQuickAudit({ url, userId, scanId });

    if (!auditResult.success) {
      // Update scan with error
      {
        const { error } = await supabase
          .from('scans')
          .update({
            status: 'failed',
            error_message: auditResult.error || 'Unknown error',
          })
          .eq('id', scanId);

        if (error) {
          console.error('[Background Job] Failed to mark scan failed:', error);
        }
      }

      console.error(
        `[Background Job] Audit ${scanId} failed:`,
        auditResult.error
      );
      return;
    }

    const report = auditResult.report!;

    // Update scan with results
    {
      const { error } = await supabase
        .from('scans')
        .update({
          status: 'completed',
          seo_score: report.scores.seo,
          performance_score: report.scores.performance,
          nextjs_score: report.scores.nextjs,
          // Store the full audit metadata (SEO/performance/Next.js)
          // so the results page can render detailed metrics.
          lighthouse_data: report.metadata || null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', scanId);

      if (error) {
        console.error('[Background Job] Failed to mark scan completed:', error);
      }
    }

    // Insert issues into audit_issues table
    const mapSeverityForDb = (
      severity: string
    ): 'error' | 'warning' | 'info' => {
      // DB constraint: severity IN ('info', 'warning', 'error')
      // Audit engine emits: 'critical' | 'high' | 'medium' | 'low'
      switch (severity) {
        case 'critical':
        case 'high':
        case 'error':
          return 'error';
        case 'medium':
        case 'warning':
          return 'warning';
        case 'low':
        case 'info':
        default:
          return 'info';
      }
    };

    const issues = report.issues.map((issue) => ({
      scan_id: scanId,
      category: issue.category,
      severity: mapSeverityForDb(issue.severity),
      rule_id: issue.rule,
      title: issue.message,
      message: issue.suggestion || '',
      fix_suggestion: issue.suggestion,
      metadata: { original_severity: issue.severity },
    }));

    if (issues.length > 0) {
      const { error } = await supabase.from('audit_issues').insert(issues);
      if (error) {
        console.error('[Background Job] Failed to insert issues:', error);
      }
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
      const supabase = createAdminClient();
      const message =
        error instanceof Error
          ? error.message
          : 'Internal server error during audit';
      await supabase
        .from('scans')
        .update({
          status: 'failed',
          error_message: message,
        })
        .eq('id', scanId);
    } catch {
      // Silently fail
    }
  }
}
