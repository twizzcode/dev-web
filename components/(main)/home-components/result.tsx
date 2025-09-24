"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, Download, Copy, Check } from "lucide-react";

interface ResultProps {
  images: string[]; // data URLs
  onBack?: () => void;
  onReset?: () => void; // go back to very beginning (upload)
}

// Lazy image item (IntersectionObserver) to avoid decoding semua langsung
interface LazyItemProps {
  src: string;
  index: number;
  onDownload: (src: string, index: number) => void;
}

const LazyImageItem: React.FC<LazyItemProps> = ({ src, index, onDownload }) => {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group relative border rounded-lg overflow-hidden bg-muted aspect-[4/5]"
    >
      {inView ? (
        <Image
          src={src}
          alt={`crop-${index + 1}`}
          width={432} // thumbnail decode lebih kecil (browser tetap decode, tapi layout ringan)
          height={540}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          className={`object-cover w-full h-full transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-gradient-to-br from-muted/60 to-muted/30" />
      )}
      {/* Top-left index badge */}
      <span className="absolute top-1 left-1 text-[10px] bg-background/70 backdrop-blur px-1 rounded font-medium">
        #{index + 1}
      </span>
      {/* Top-right download button */}
      <button
        onClick={() => onDownload(src, index)}
        aria-label={`Download image ${index + 1}`}
        className="absolute top-1 right-1 inline-flex items-center justify-center rounded-md bg-background/70 backdrop-blur text-foreground/80 hover:text-foreground hover:bg-background px-1 py-1 transition shadow-sm border border-border/60"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const Result: React.FC<ResultProps> = ({ images, onBack, onReset }) => {
  const downloadOne = React.useCallback((src: string, index: number) => {
    // Gunakan blob supaya beberapa browser HP lebih stabil daripada data URL langsung
    fetch(src)
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `crop-${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // fallback langsung data url
        const a = document.createElement("a");
        a.href = src;
        a.download = `crop-${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
  }, []);

  const downloadingRef = React.useRef(false);
  const downloadAll = React.useCallback(async () => {
    if (downloadingRef.current) return;
    downloadingRef.current = true;
    // Sequential small delay to avoid freeze di device lemah
    for (let i = 0; i < images.length; i++) {
      downloadOne(images[i], i);
  // jeda kecil (optional) - comment jika tidak perlu
      await new Promise(r => setTimeout(r, 60));
    }
    downloadingRef.current = false;
  }, [images, downloadOne]);

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
                <LazyImageItem
                  key={i}
                  src={src}
                  index={i}
                  onDownload={downloadOne}
                />
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
  <DonateSection />
        <div className="mt-auto space-y-2 text-xs text-muted-foreground">
          <p>Tip: Hover an image to download just that slice.</p>
          <p>Each slice exported at 1080x1350.</p>
        </div>
      </div>
    </div>
  );
};

export default Result;

/* ---------------------------- DONATE SECTION (INLINE) ---------------------------- */
const DonateSection: React.FC = () => {
  const PAY_NUMBER = "085174446002";
  const [copied, setCopied] = React.useState<string | null>(null);
  const methods: { label: string; key: string }[] = [
    { label: "ShopeePay", key: "shopee" },
    { label: "DANA", key: "dana" },
    { label: "GoPay", key: "gopay" },
  ];
  const copy = (id: string, value: string) => {
    navigator.clipboard.writeText(value).then(()=>{
      setCopied(id);
      setTimeout(()=> setCopied(null), 1600);
    }).catch(()=>{});
  };
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Heart className="w-4 h-4 text-pink-500" /> Support / Donate
      </h4>
      <p className="text-xs text-muted-foreground mb-3">
        Terima kasih sudah pakai tool ini. Dukungan kamu membantu pengembangan lebih lanjut.
      </p>
      <div className="grid gap-3">
        {methods.map(m => {
          const id = m.key;
          const active = copied === id;
          return (
            <div key={m.key} className="flex items-center justify-between gap-4 rounded-md border px-3 py-2 bg-muted/30">
              <div className="flex items-center gap-3">
                <DonateIcon label={m.label} />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{m.label}</span>
                  <span className="text-sm font-mono tracking-wide select-all">{PAY_NUMBER}</span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={active? "default":"outline"}
                className="h-8 px-2 text-[11px] flex items-center gap-1"
                onClick={()=> copy(id, PAY_NUMBER)}
              >
                {active ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {active ? "Copied" : "Copy"}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] mt-2 text-muted-foreground">Nomor sama untuk semua e-wallet. 🙏</p>
    </div>
  );
};

const DonateIcon: React.FC<{label:string}> = ({label}) => {
  const key = label.toLowerCase();
  if (key.includes('gopay')) {
    return (
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[#00A99D]/10 ring-1 ring-[#00A99D]/30">
        <svg viewBox="0 0 64 64" className="h-6 w-6"><circle cx="32" cy="32" r="30" fill="#00A99D" /><circle cx="32" cy="32" r="18" fill="#fff" /><circle cx="32" cy="32" r="9" fill="#00A99D" /></svg>
      </span>
    );
  }
  if (key.includes('shopee')) {
    return (
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[#EE4D2D]/10 ring-1 ring-[#EE4D2D]/30">
        <svg viewBox="0 0 64 64" className="h-6 w-6"><rect x="8" y="14" width="48" height="40" rx="6" fill="#EE4D2D" /><path d="M24 22c0-6 4-10 8-10s8 4 8 10" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" /><path d="M24 32h16v10H24z" fill="#fff" /></svg>
      </span>
    );
  }
  if (key.includes('dana')) {
    return (
      <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-[#108FE5]/10 ring-1 ring-[#108FE5]/30">
        <svg viewBox="0 0 64 64" className="h-6 w-6"><circle cx="32" cy="32" r="30" fill="#108FE5" /><rect x="16" y="24" width="32" height="16" rx="8" fill="#fff" /></svg>
      </span>
    );
  }
  return <span className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-muted text-xs">??</span>;
};
