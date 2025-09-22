export type CropMode = 'Grid' | 'Carousel' | 'Custom';
export interface CropPayload {
  mode: CropMode;
  rows?: number;
  cols?: number;
  gap?: 'with-gap' | 'without-gap';
  format?: 'png' | 'jpeg' | 'webp' | 'avif';
  quality?: number; // 1-100 (jpeg/webp/avif). PNG will be treated as lossless
  lossless?: boolean; // for webp/avif
}
