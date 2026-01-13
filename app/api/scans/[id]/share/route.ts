import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  return NextResponse.json(
    {
      error:
        'Sharing is disabled because saved scan history is disabled (no accounts).',
      scanId: body?.scanId ?? null,
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
