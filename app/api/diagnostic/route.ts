import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'diagnostic', method: 'GET', time: Date.now() });
}

export async function POST(req: NextRequest) {
  let json: unknown = null;
  try { json = (await req.json()) as unknown; } catch {}
  const gotBody = typeof json === 'object' && json !== null;
  return NextResponse.json({ ok: true, endpoint: 'diagnostic', method: 'POST', gotBody, time: Date.now() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
