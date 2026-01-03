import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all scans for the user, ordered by creation date
    const { data: scans, error } = await supabase
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
        created_at,
        completed_at
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      scans: scans || [],
      total: scans?.length || 0,
    });
  } catch (error) {
    console.error('[API] Error fetching scans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
