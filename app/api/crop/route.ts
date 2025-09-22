import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { cropGrid } from '@/lib/image/grid';
import { cropCarousel } from '@/lib/image/carousel';
import { cropCustom } from '@/lib/image/custom';
import { CropPayload } from '@/lib/image/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const payloadStr = form.get('payload');
    if (!file || typeof payloadStr !== 'string') {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    const payload: CropPayload = JSON.parse(payloadStr);

    // Basic debug logging (can be removed in production)
    console.log('[crop] payload', payload);

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
    } catch (cropErr: any) {
      console.error('[crop] processing error', cropErr);
      return NextResponse.json({ error: 'Crop processing failed', detail: cropErr?.message || 'unknown' }, { status: 500 });
    }

  const fmt = payload.format || 'png';
  const mime = fmt === 'png' ? 'image/png' : fmt === 'jpeg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/avif';
    const slices = buffers.map((buf, i) => ({ index: i, dataUrl: `data:${mime};base64,${buf.toString('base64')}` }));
    return NextResponse.json({ type: 'array', slices });
  } catch (e:any) {
    console.error('Crop API error (outer)', e);
    return NextResponse.json({ error: 'Server error', detail: e?.message || 'unknown' }, { status: 500 });
  }
}
