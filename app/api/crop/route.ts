import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { cropGrid } from '@/lib/image/grid';
import { cropCarousel } from '@/lib/image/carousel';
import { cropCustom } from '@/lib/image/custom';
import { CropPayload } from '@/lib/image/types';

// Force Node.js serverless runtime (Sharp needs native modules)
export const runtime = 'nodejs';
// Prevent static optimization & ensure always executed server-side
export const dynamic = 'force-dynamic';
// Give more time if large images (Vercel limit; safe lower bound)
export const maxDuration = 20;

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    // Method guard (defensive: App Router already routes by export name)
    if (req.method && req.method !== 'POST') {
      return NextResponse.json({ error: 'Only POST allowed', method: req.method }, { status: 405 });
    }

    const t0 = Date.now();
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const payloadStr = form.get('payload');
    if (!file || typeof payloadStr !== 'string') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    const payload: CropPayload = JSON.parse(payloadStr);

    // Basic debug logging (can be removed in production)
  console.log('[crop] payload', payload, 'fileSizeApprox', (file as any)?.size ?? 'n/a');

    if (!['Grid','Carousel','Custom'].includes(payload.mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const arrBuf = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(arrBuf).metadata();
  console.log('[crop] meta', { width: meta.width, height: meta.height, format: meta.format });
    if (!meta.width || !meta.height) {
      return NextResponse.json({ error: 'Unreadable image' }, { status: 400 });
    }

    // Basic limits
    if (meta.width * meta.height > 12000 * 12000) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    let buffers: Buffer[] = [];
    try {
      if (payload.mode === 'Grid') buffers = await cropGrid(arrBuf, meta, payload);
      else if (payload.mode === 'Carousel') buffers = await cropCarousel(arrBuf, meta, payload);
      else if (payload.mode === 'Custom') buffers = await cropCustom(arrBuf, meta, payload);
    } catch (cropErr) {
      const err = cropErr as Error;
      console.error('[crop] processing error', err);
      return NextResponse.json({ error: 'Crop processing failed', detail: err.message || 'unknown' }, { status: 500 });
    }

    const fmt = payload.format || 'png';
    const mime = fmt === 'png' ? 'image/png' : fmt === 'jpeg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/avif';
    const totalBytes = buffers.reduce((a,b)=>a+b.length,0);
    console.log('[crop] finished', { slices: buffers.length, totalKB: Math.round(totalBytes/1024), durationMs: Date.now()-t0 });
    const slices = buffers.map((buf, i) => ({ index: i, dataUrl: `data:${mime};base64,${buf.toString('base64')}` }));
    return NextResponse.json({ type: 'array', slices });
  } catch (e) {
    const err = e as Error;
    console.error('Crop API error (outer)', err);
    return NextResponse.json({ error: 'Server error', detail: err.message || 'unknown' }, { status: 500 });
  }
}
