import sharp, { Metadata } from 'sharp';
import { CropPayload } from './types';

export async function cropCarousel(input: Buffer, meta: Metadata, p: CropPayload): Promise<Buffer[]> {
  const cols = p.cols ?? 1;
  const aspect = 4/5;
  const W = meta.width!; const H = meta.height!;
  let segmentW = W / cols;
  let segmentH = segmentW / aspect;
  if (segmentH > H) {
    segmentH = H; segmentW = segmentH * aspect;
  }
  if (segmentW < 1) segmentW = 1;
  if (segmentH < 1) segmentH = 1;
  const totalW = segmentW * cols;
  const startX = (W - totalW)/2;
  const startY = (H - segmentH)/2;
  const format = (p.format||'png');
  const quality = Math.min(100, Math.max(1, p.quality ?? 100));
  const lossless = !!p.lossless;
  const out: Buffer[] = [];
  for (let c=0;c<cols;c++) {
    const left = Math.max(0, Math.round(startX + c*segmentW));
    const top = Math.max(0, Math.round(startY));
    const width = Math.min(W - left, Math.round(segmentW));
    const height = Math.min(H - top, Math.round(segmentH));
    if (width <=0 || height <=0) continue;
    let sliceSharp = sharp(input)
      .extract({ left, top, width, height })
      .resize({ width: 1080, height: 1350, fit: 'cover' });
    sliceSharp = format === 'png'
      ? sliceSharp.png({ compressionLevel: 0 })
      : format === 'jpeg'
        ? sliceSharp.jpeg({ quality, chromaSubsampling: '4:4:4' })
        : format === 'webp'
          ? sliceSharp.webp({ quality, lossless })
          : sliceSharp.avif({ quality, lossless });
    const slice = await sliceSharp.toBuffer();
    out.push(slice);
  }
  return out;
}
