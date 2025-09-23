import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Force this route to run on the Node.js runtime (needed for sharp on Vercel)
export const runtime = 'nodejs';
// (Optional) uncomment if you want to hint region placement
// export const preferredRegion = 'auto';

interface CropRequest {
  image: string; // base64 encoded image
  type: 'Grid' | 'Carousel' | 'Custom';
  rows: number;
  cols: number;
  gridGap?: 'with-gap' | 'without-gap';
}

export async function POST(request: NextRequest) {
  try {
    const body: CropRequest = await request.json();
    const { image, type, rows, cols, gridGap = 'with-gap' } = body;

    // Validate input
    if (!image || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Get image metadata
    const { width: originalWidth, height: originalHeight } = await sharp(imageBuffer).metadata();

    if (!originalWidth || !originalHeight) {
      return NextResponse.json(
        { error: 'Could not read image dimensions' },
        { status: 400 }
      );
    }

    const croppedImages: string[] = [];

    if (type === 'Grid') {
      // Grid processing logic
      const aspectRatio = gridGap === 'with-gap' ? 0.4313099041533546 : 0.4340836012861736;
      const compositeWidth = gridGap === 'with-gap' ? 3130 : 3110;
      const sliceOffsets = gridGap === 'with-gap' ? [0, 1025, 2050] : [0, 1015, 2030];
      const outputSliceHeight = 1350;

      let effectiveWidth = originalWidth;
      let rowHeight = effectiveWidth * aspectRatio;
      let totalHeight = rowHeight * rows;

      if (totalHeight > originalHeight) {
        effectiveWidth = originalHeight / rows / aspectRatio;
        rowHeight = effectiveWidth * aspectRatio;
        totalHeight = rowHeight * rows;
      }

      const startX = effectiveWidth < originalWidth ? (originalWidth - effectiveWidth) / 2 : 0;
      const startY = totalHeight < originalHeight ? (originalHeight - totalHeight) / 2 : 0;

      for (let r = 0; r < rows; r++) {
        const cropY = Math.round(startY + r * rowHeight);
        
        // Extract and resize the row
        const rowImage = await sharp(imageBuffer)
          .extract({
            left: Math.round(startX),
            top: cropY,
            width: Math.round(effectiveWidth),
            height: Math.round(rowHeight)
          })
          .resize(compositeWidth, outputSliceHeight)
          .png()
          .toBuffer();

        // Split the row into 3 slices
        for (let i = 0; i < 3; i++) {
          const sliceBuffer = await sharp(rowImage)
            .extract({
              left: sliceOffsets[i],
              top: 0,
              width: 1080,
              height: outputSliceHeight
            })
            .png()
            .toBuffer();

          const base64Slice = `data:image/png;base64,${sliceBuffer.toString('base64')}`;
          croppedImages.push(base64Slice);
        }
      }
    } else if (type === 'Carousel') {
      // Carousel processing logic
      const aspectRatio = 4 / 5;
      const totalCols = cols;
      let targetWidth = originalWidth / totalCols;
      let targetHeight = targetWidth / aspectRatio;

      if (targetHeight > originalHeight) {
        targetHeight = originalHeight;
        targetWidth = targetHeight * aspectRatio;
      }

      const startX = (originalWidth - targetWidth * totalCols) / 2;
      const startY = (originalHeight - targetHeight) / 2;

      for (let c = 0; c < totalCols; c++) {
        const cropBuffer = await sharp(imageBuffer)
          .extract({
            left: Math.round(startX + c * targetWidth),
            top: Math.round(startY),
            width: Math.round(targetWidth),
            height: Math.round(targetHeight)
          })
          .resize(1080, 1350)
          .png()
          .toBuffer();

        const base64Image = `data:image/png;base64,${cropBuffer.toString('base64')}`;
        croppedImages.push(base64Image);
      }
    } else if (type === 'Custom') {
      // Custom processing logic
      const cellWidth = originalWidth / cols;
      const cellHeight = originalHeight / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cropBuffer = await sharp(imageBuffer)
            .extract({
              left: Math.round(c * cellWidth),
              top: Math.round(r * cellHeight),
              width: Math.round(cellWidth),
              height: Math.round(cellHeight)
            })
            .png()
            .toBuffer();

          const base64Image = `data:image/png;base64,${cropBuffer.toString('base64')}`;
          croppedImages.push(base64Image);
        }
      }
    }

    return NextResponse.json({
      success: true,
      images: croppedImages,
      totalImages: croppedImages.length
    });

  } catch (error) {
    console.error('Crop processing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Image cropping API endpoint',
    methods: ['POST'],
    maxFileSize: '50MB'
  });
}