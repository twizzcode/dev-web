import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Validate required envs early for clearer errors
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "uploads";

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      const msg = "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY envs";
      console.error("[upload.post]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const maxBytes = 2 * 1024 * 1024; // 2 MB
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "File too large. Max 2 MB" }, { status: 400 });
    }

    const mime = file.type || "";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    // Read into buffer
    const arrayBuf = await file.arrayBuffer();
    const input = Buffer.from(arrayBuf);

    // Process with sharp -> WebP optimized
    const image = sharp(input, { failOnError: true }).rotate();
    // Optional resize cap to keep files small
    const resized = image.resize({ width: 1600, withoutEnlargement: true });
    const webp = await resized.webp({ quality: 82 }).toBuffer({ resolveWithObject: true });

    // Build safe filename/path for storage
    const base = (file.name || "image").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-{2,}/g, "-");
    const nameNoExt = base.replace(/\.[^.]+$/, "");
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${nameNoExt}.webp`;

    // Use Supabase Storage
    const supabase = getSupabaseServerClient();
    const bucket = SUPABASE_BUCKET;

    // Ensure bucket exists (admin API available with service role key)
    let bucketIsPublic: boolean | undefined;
    try {
      const { data: bucketInfo, error: bucketError } = await supabase.storage.getBucket(bucket);
      if (bucketError || !bucketInfo) {
        const msg = `Supabase bucket not found or inaccessible: ${bucket}`;
        console.error("[upload.post]", msg, bucketError);
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      // Supabase bucket may have a `public` flag
      bucketIsPublic = (bucketInfo as any)?.public;
    } catch (e) {
      console.error("[upload.post] bucket check failed", e);
      return NextResponse.json({ error: "Supabase bucket check failed" }, { status: 500 });
    }
    const objectPath = `images/${new Date().getFullYear()}/${(new Date().getMonth()+1)
      .toString()
      .padStart(2, "0")}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(objectPath, webp.data, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "31536000", // 1 year
      });

    if (uploadError) {
      console.error("[upload.post] supabase upload error", uploadError);
      // Expose more details in non-production to help diagnose
      const details = process.env.NODE_ENV !== "production" ? uploadError.message || String(uploadError) : undefined;
      return NextResponse.json({ error: "Upload failed", details }, { status: 500 });
    }

    let url: string | undefined;
    if (bucketIsPublic === false) {
      // Generate a long-lived signed URL for private buckets
      const { data: signed, error: signErr } = await supabase.storage
        .from(bucket)
        .createSignedUrl(objectPath, 60 * 60 * 24 * 365); // 1 year
      if (signErr || !signed?.signedUrl) {
        console.error("[upload.post] failed to create signed URL", signErr);
        return NextResponse.json({ error: "Failed to create signed URL" }, { status: 500 });
      }
      url = signed.signedUrl;
    } else {
      const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      url = publicUrlData.publicUrl;
    }

    return NextResponse.json({ url, width: webp.info.width, height: webp.info.height, size: webp.data.length });
  } catch (err: unknown) {
    console.error("[upload.post]", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    // Note: On serverless platforms without persistent storage, advise using object storage
    const details = process.env.NODE_ENV !== "production" ? message : undefined;
    return NextResponse.json({ error: "Upload failed", details }, { status: 500 });
  }
}
