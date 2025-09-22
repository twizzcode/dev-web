import sharp, { Metadata } from 'sharp';
import { CropPayload } from './types';

export async function cropGrid(input: Buffer, meta: Metadata, p: CropPayload): Promise<Buffer[]> {
  const rows = p.rows ?? 1;
  const gap = p.gap ?? 'with-gap';
  const aspect = gap === 'with-gap' ? 0.4313099041533546 : 0.4340836012861736; // rowH / effW
  const compositeWidth = gap === 'with-gap' ? 3130 : 3110;
  const offsets = gap === 'with-gap' ? [0,1025,2050] : [0,1015,2030];
  const sliceH = 1350;
  const W = meta.width!; const H = meta.height!;
  let effW = W;
  let rowH = effW * aspect;
  if (rowH * rows > H) {
    effW = (H / rows) / aspect;
    rowH = effW * aspect;
  }
  // Guard minimal sizes
  if (effW < 1) effW = 1;
  if (rowH < 1) rowH = 1;
  const startX = effW < W ? (W - effW)/2 : 0;
  const totalH = rowH * rows;
  const startY = totalH < H ? (H - totalH)/2 : 0;
  const format = (p.format||'png');
  const quality = Math.min(100, Math.max(1, p.quality ?? 100));
  const lossless = !!p.lossless;
  const out: Buffer[] = [];
  for (let r=0;r<rows;r++) {
    const rowTop = Math.round(startY + r*rowH);
    const left = Math.max(0, Math.round(startX));
    const width = Math.min(W - left, Math.round(effW));
    const top = Math.max(0, rowTop);
    const height = Math.min(H - top, Math.round(rowH));
    if (width <= 0 || height <= 0) continue;
    let rowSharp = sharp(input)
      .extract({ left, top, width, height })
      .resize({ width: compositeWidth, height: sliceH, fit: 'fill' });
    rowSharp = format === 'png'
      ? rowSharp.png({ compressionLevel: 0 })
      : format === 'jpeg'
        ? rowSharp.jpeg({ quality, chromaSubsampling: '4:4:4' })
        : format === 'webp'
          ? rowSharp.webp({ quality, lossless })
          : rowSharp.avif({ quality, lossless });
    const rowBuf = await rowSharp.toBuffer();
    for (const off of offsets) {
      let sliceSharp = sharp(rowBuf)
        .extract({ left: off, top: 0, width: 1080, height: sliceH });
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
  }
  return out;
}
