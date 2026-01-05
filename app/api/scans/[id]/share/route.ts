import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanId } = await request.json();

    if (!scanId) {
      return NextResponse.json(
        { error: 'Scan ID is required' },
        { status: 400 }
      );
    }

    // Fetch scan to verify ownership
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, user_id')
      .eq('id', scanId)
      .single();

    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    if (scan.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate a unique share token (you can use a better method like nanoid)
    const shareToken = `${scanId}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}`;

    // Store share token in database (you'd need a shares table for this)
    // For now, we'll just return the scan ID as the share link
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/public/scans/${scanId}`;

    return NextResponse.json({
      shareUrl,
      shareToken,
      message: 'Scan is now shareable',
    });
  } catch (error) {
    console.error('[API] Share creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
