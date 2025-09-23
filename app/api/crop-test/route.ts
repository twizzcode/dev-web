import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type JsonRecord = Record<string, unknown>;

export async function POST(req: NextRequest) {
  let payload: unknown = null;
  try { payload = (await req.json()) as unknown; } catch {}
  const received = typeof payload === 'object' && payload !== null;
  return NextResponse.json({ ok: true, route: 'crop-test', received, time: Date.now() });
}

export async function GET() {
  return NextResponse.json({ ok: true, route: 'crop-test', method: 'GET', time: Date.now() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'GET,POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type' } });
}
