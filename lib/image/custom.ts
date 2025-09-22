import sharp, { Metadata } from 'sharp';
import { CropPayload } from './types';

export async function cropCustom(input: Buffer, meta: Metadata, p: CropPayload): Promise<Buffer[]> {
  const rows = p.rows ?? 1;
  const cols = p.cols ?? 1;
  const W = meta.width!; const H = meta.height!;
  const cellW = W / cols; const cellH = H / rows;
  const format = (p.format||'png');
  const quality = Math.min(100, Math.max(1, p.quality ?? 100));
  const lossless = !!p.lossless;
  const out: Buffer[] = [];
  for (let r=0;r<rows;r++) {
    for (let c=0;c<cols;c++) {
      const left = Math.max(0, Math.round(c*cellW));
      const top = Math.max(0, Math.round(r*cellH));
      const width = Math.min(W - left, Math.round(cellW));
      const height = Math.min(H - top, Math.round(cellH));
      if (width <=0 || height <=0) continue;
      let sliceSharp = sharp(input)
        .extract({ left, top, width, height });
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
