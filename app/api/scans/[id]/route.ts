import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error:
        'Scan history is disabled (no accounts). This scan detail endpoint is no longer available.',
      scanId: id,
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
