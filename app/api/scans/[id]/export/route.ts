import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json(
    {
      error:
        'Export is disabled because saved scan history is disabled (no accounts).',
      scanId: id,
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
