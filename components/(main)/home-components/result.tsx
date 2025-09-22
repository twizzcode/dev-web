"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

interface ResultProps {
  images: string[]; // data URLs
  onBack?: () => void;
  onReset?: () => void; // go back to very beginning (upload)
}

const Result: React.FC<ResultProps> = ({ images, onBack, onReset }) => {
  const downloadOne = (src: string, index: number) => {
    const a = document.createElement("a");
    a.href = src;
    a.download = `crop-${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadAll = async () => {
    // Lazy create a zip via JSZip if installed; fallback sequential downloads
    try {
      const JSZipMod = await import("jszip");
      const JSZip = JSZipMod.default;
      const zip = new JSZip();
      images.forEach((data, i) => {
        const base64 = data.split(",")[1];
        zip.file(`crop-${i + 1}.png`, base64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "crops.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      images.forEach((img, i) => downloadOne(img, i));
    }
  };

  return (
  <div className="grid grid-rows-[3fr_2fr] gap-3 lg:grid-rows-1 lg:grid-cols-5 lg:gap-4 flex-1 h-[calc(100vh-80px)] overflow-hidden">
      {/* Images panel (matches Setting left: col-span-3) */}
  <div className="bg-sidebar p-4 rounded-lg lg:col-span-3 flex flex-col border overflow-hidden md:h-[calc(100vh-142px)] h-min-0">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold">
            Cropped Images ({images.length})
          </h3>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadAll}
              disabled={!images.length}
            >
              Download All
            </Button>
          </div>
        </div>
        <div className="flex-1 min-h-0 lg:overflow-y-auto overflow-visible scrollbar-thin">
          {images.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No images.
            </div>
          ) : (
            <div className="grid gap-1 md:gap-2 grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="group relative border rounded-lg overflow-hidden bg-muted"
                >
                  <Image
                    src={src}
                    alt={`crop-${i + 1}`}
                    width={1080}
                    height={1350}
                    className="object-cover w-full h-full aspect-[4/5]"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => downloadOne(src, i)}
                    >
                      Download
                    </Button>
                  </div>
                  <span className="absolute top-1 left-1 text-[10px] bg-background/70 backdrop-blur px-1 rounded">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Side panel (matches Setting right: col-span-2) */}
  <div className="bg-sidebar p-4 rounded-lg lg:col-span-2 flex flex-col border min-h-0 gap-4 overflow-hidden">
        <h2 className="text-base font-semibold">Actions</h2>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" onClick={onBack} disabled={!onBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onReset} disabled={!onReset}>
            Restart
          </Button>
          <Button onClick={downloadAll} disabled={!images.length}>
            Download All
          </Button>
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" /> Support
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            If this tool helps you, consider supporting.
          </p>
          <Button className="w-full" variant="default" size="sm">
            Support Me
          </Button>
        </div>
        <div className="mt-auto space-y-2 text-xs text-muted-foreground">
          <p>Tip: Hover an image to download just that slice.</p>
          <p>Each slice exported at 1080x1350.</p>
        </div>
      </div>
    </div>
  );
};

export default Result;
