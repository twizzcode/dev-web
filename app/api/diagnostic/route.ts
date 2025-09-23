import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'diagnostic', method: 'GET', time: Date.now() });
}

export async function POST(req: NextRequest) {
  let json: any = null;
  try { json = await req.json(); } catch {}
  return NextResponse.json({ ok: true, endpoint: 'diagnostic', method: 'POST', gotBody: !!json, time: Date.now() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
