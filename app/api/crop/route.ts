/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/crop/route.ts
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const payload = formData.get("payload") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const { mode, rows, cols, format, quality } = JSON.parse(payload || "{}");

    const buffer = Buffer.from(await file.arrayBuffer());
    const image = sharp(buffer);

    const metadata = await image.metadata();
    const width = metadata.width || 1080;
    const height = metadata.height || 1080;

    const results: { index: number; dataUrl: string }[] = [];

    if (mode === "Grid") {
      const sliceHeight = Math.floor(height / rows);
      for (let r = 0; r < rows; r++) {
        const cropped = await sharp(buffer)
          .extract({
            left: 0,
            top: r * sliceHeight,
            width,
            height: sliceHeight,
          })
          .toFormat(format || "png", { quality: quality || 100 })
          .toBuffer();

        results.push({
          index: r,
          dataUrl: `data:image/${format};base64,${cropped.toString("base64")}`,
        });
      }
    } else if (mode === "Carousel") {
      const sliceWidth = Math.floor(width / cols);
      for (let c = 0; c < cols; c++) {
        const cropped = await sharp(buffer)
          .extract({ left: c * sliceWidth, top: 0, width: sliceWidth, height })
          .toFormat(format || "png", { quality: quality || 100 })
          .toBuffer();

        results.push({
          index: c,
          dataUrl: `data:image/${format};base64,${cropped.toString("base64")}`,
        });
      }
    }

    return NextResponse.json({ type: "array", slices: results });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Server crop failed:", err);
    return NextResponse.json(
      { error: "Crop failed", detail: errorMessage },
      { status: 500 }
    );
  }
}
