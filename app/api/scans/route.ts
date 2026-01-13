import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error:
        'Scan history is disabled (no accounts). Run scans via POST /api/scan.',
    },
    { status: 410, headers: { 'Cache-Control': 'no-store' } }
  );
}
