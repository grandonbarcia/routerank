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
      .select('id, url, status, grade, scores, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform the response
    const transformedScans = scans.map((scan) => ({
      id: scan.id,
      url: scan.url,
      status: scan.status,
      grade: scan.grade,
      scores: scan.scores,
      createdAt: scan.created_at,
    }));

    return NextResponse.json({ scans: transformedScans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
