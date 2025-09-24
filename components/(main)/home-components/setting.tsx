"use client";

import * as React from "react";
import {
  IconSettings,
  IconLayoutGridRemove,
  /* IconServer, */
  /* IconDeviceDesktop, */
  IconLayoutRows,
  IconLayoutColumns,
  IconMinus,
  IconPlus
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/* -------------------------------------------------------------------------- */
/*                                TYPE & CONSTS                               */
/* -------------------------------------------------------------------------- */

// Jenis mode pemotongan gambar yang didukung
const TYPE_OPTIONS = ["Grid", "Carousel", "Custom"] as const;
type TypeOption = (typeof TYPE_OPTIONS)[number];

// Variasi grid dengan atau tanpa gap antar kolom
const GAP_OPTIONS = ["With-Gap", "Without-Gap"] as const;
type GapOption = (typeof GAP_OPTIONS)[number];

// Lokasi proses pemotongan (server disabled sementara)
// const PROCESSING_OPTIONS = ["client", "server"] as const;
// type ProcessingMode = (typeof PROCESSING_OPTIONS)[number];

// Konstanta perhitungan grid (disamakan dengan server route)
const GRID_CONST = {
  "With-Gap": {
    aspect: 0.4313099041533546, // rasio tinggi = lebar * aspect
    compositeWidth: 3130,
    sliceOffsets: [0, 1025, 2050] as const
  },
  "Without-Gap": {
    aspect: 0.4340836012861736,
    compositeWidth: 3110,
    sliceOffsets: [0, 1015, 2030] as const
  },
  outputSliceHeight: 1350,
  outputSliceWidth: 1080
};

interface SettingHomeComponentsProps {
  files?: File[];                   // File yang dipilih user (hanya 1 dipakai sekarang)
  onBack?: () => void;              // Callback tombol Back
  onCropped?: (images: string[]) => void; // Hasil potongan (data URL)
}

/* -------------------------------------------------------------------------- */
/*                             MAIN REACT COMPONENT                           */
/* -------------------------------------------------------------------------- */

const SettingHomeComponents: React.FC<SettingHomeComponentsProps> = ({
  files = [],
  onBack,
  onCropped
}) => {
  // State utama UI
  const [typeValue, setTypeValue] = React.useState<TypeOption>("Grid");
  const [gridGap, setGridGap] = React.useState<GapOption>("With-Gap");
  // Server mode sementara dimatikan -> selalu client
  // const [processingMode, setProcessingMode] = React.useState<ProcessingMode>("client");
  const [rows, setRows] = React.useState(1);
  const [cols, setCols] = React.useState(1);
  const [cropping, setCropping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Pastikan kombinasi valid: Grid → cols=1, Carousel → rows=1
  React.useEffect(() => {
    if (typeValue === "Grid") setCols(1);
    if (typeValue === "Carousel") setRows(1);
  }, [typeValue]);

  // Ambil file gambar pertama
  const firstImageFile = React.useMemo(
    () => files.find(f => f.type.startsWith("image/")) || null,
    [files]
  );

  /* ------------------------- UTIL: File -> Data URL ------------------------ */
  // Konversi file ke data URL base64 untuk dikirim ke server (mode server)
  // const fileToDataUrl = async (file: File) => {
  //   const buffer = await file.arrayBuffer();
  //   const bytes = new Uint8Array(buffer);
  //   let binary = "";
  //   for (let i = 0; i < bytes.length; i += 0x8000) {
  //     binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  //   }
  //   return `data:${file.type};base64,${btoa(binary)}`;
  // };

  /* ---------------------------- CROP: CLIENT SIDE ------------------------- */
  const cropOnClient = React.useCallback(
    async (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;

      // Tunggu gambar load
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Gambar gagal dimuat"));
      });

      const W = img.width;
      const H = img.height;
      const outputs: string[] = [];

      if (typeValue === "Grid") {
        const cfg = GRID_CONST[gridGap];
        const outH = GRID_CONST.outputSliceHeight;
        let effectiveW = W;
        let rowH = effectiveW * cfg.aspect;

        // Jika tinggi total melebihi gambar, skala ulang berdasarkan tinggi
        if (rowH * rows > H) {
          effectiveW = (H / rows) / cfg.aspect;
          rowH = effectiveW * cfg.aspect;
        }

        const startX = effectiveW < W ? (W - effectiveW) / 2 : 0;
        const totalH = rowH * rows;
        const startY = totalH < H ? (H - totalH) / 2 : 0;

        for (let r = 0; r < rows; r++) {
          // Canvas untuk seluruh baris
            const rowCanvas = document.createElement("canvas");
            rowCanvas.width = cfg.compositeWidth;
            rowCanvas.height = outH;
            const rowCtx = rowCanvas.getContext("2d")!;
            rowCtx.drawImage(
              img,
              startX,
              startY + r * rowH,
              effectiveW,
              rowH,
              0,
              0,
              cfg.compositeWidth,
              outH
            );

            // Potong baris menjadi 3 slice (1080 lebar masing-masing)
            for (let i = 0; i < cfg.sliceOffsets.length; i++) {
              const sc = document.createElement("canvas");
              sc.width = GRID_CONST.outputSliceWidth;
              sc.height = outH;
              const sctx = sc.getContext("2d")!;
              sctx.drawImage(
                rowCanvas,
                cfg.sliceOffsets[i],
                0,
                GRID_CONST.outputSliceWidth,
                outH,
                0,
                0,
                GRID_CONST.outputSliceWidth,
                outH
              );
              outputs.push(sc.toDataURL("image/png"));
            }
        }
      } else if (typeValue === "Carousel") {
        // Potong memanjang secara horizontal dengan rasio 4:5
        const aspectCarousel = 4 / 5;
        let cellW = W / cols;
        let cellH = cellW / aspectCarousel;
        if (cellH > H) {
          cellH = H;
          cellW = cellH * aspectCarousel;
        }
        const startX = (W - cellW * cols) / 2;
        const startY = (H - cellH) / 2;
        for (let c = 0; c < cols; c++) {
          const canvas = document.createElement("canvas");
          canvas.width = 1080;
          canvas.height = 1350;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(
            img,
            startX + c * cellW,
            startY,
            cellW,
            cellH,
            0,
            0,
            1080,
            1350
          );
          outputs.push(canvas.toDataURL("image/png"));
        }
      } else {
        // Custom grid bebas rows x cols
        const cellW = W / cols;
        const cellH = H / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const canvas = document.createElement("canvas");
            canvas.width = cellW;
            canvas.height = cellH;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(
              img,
              c * cellW,
              r * cellH,
              cellW,
              cellH,
              0,
              0,
              cellW,
              cellH
            );
            outputs.push(canvas.toDataURL("image/png"));
          }
        }
      }

      URL.revokeObjectURL(url);
      if (!outputs.length) throw new Error("Tidak ada hasil crop");
      onCropped?.(outputs);
    },
    [typeValue, gridGap, rows, cols, onCropped]
  );

  /* ---------------------------- CROP: SERVER SIDE ------------------------- */
  // Server crop (dinonaktifkan sementara)
  // const cropOnServer = React.useCallback(
  //   async (file: File) => {
  //     const dataUrl = await fileToDataUrl(file);
  //     const res = await fetch("/api/crop", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ image: dataUrl, type: typeValue, rows, cols, gridGap })
  //     });
  //     if (!res.ok) {
  //       let msg = `Server error ${res.status}`;
  //       try {
  //         const j = await res.json();
  //           if (j.error) msg = j.error;
  //       } catch {}
  //       throw new Error(msg);
  //     }
  //     const json = await res.json();
  //     if (!json.success || !Array.isArray(json.images) || !json.images.length) {
  //       throw new Error("Server tidak mengembalikan gambar");
  //     }
  //     onCropped?.(json.images as string[]);
  //   },
  //   [typeValue, rows, cols, gridGap, onCropped]
  // );

  /* ---------------------------- HANDLE UTAMA BUTTON ----------------------- */
  const handleCrop = React.useCallback(async () => {
    if (!firstImageFile) return;
    track("cutter_click", typeValue);
    setCropping(true);
    setError(null);
    try {
      // Selalu client
      await cropOnClient(firstImageFile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCropping(false);
    }
  }, [firstImageFile, cropOnClient]);

  const handleRetry = () => {
    setError(null);
    void handleCrop();
  };

  // const switchToClient = () => {
  //   setProcessingMode("client");
  //   setError(null);
  // };

  /* ------------------------------- RENDER UI ------------------------------- */
  return (
    <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-5 lg:gap-4 h-full">
      {/* PREVIEW AREA */}
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-3 flex flex-col flex-1 h-full border relative">
        {firstImageFile ? (
          <LivePreview file={firstImageFile} mode={typeValue} gap={gridGap} rows={rows} cols={cols} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <UploadBox />
          </div>
        )}
      </div>

      {/* CONTROL PANEL */}
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-2 flex flex-col flex-1 h-full border relative">
        <div className="flex flex-col gap-2">
          <SectionHeader icon={<IconSettings className="h-4 w-4 md:h-6 md:w-6" />} title="Cut Mode" />
          <TypeSegmented value={typeValue} onChange={setTypeValue} />

          {/* Processing mode UI disembunyikan */}
          {/* <SectionHeader icon={<IconServer className="h-4 w-4 md:h-6 md:w-6" />} title="Processing" className="mt-4" /> */}
          {/* <ProcessingModeSegmented value={processingMode} onChange={setProcessingMode} /> */}


          <RowColumnCounters
            mode={typeValue}
            rows={rows}
            cols={cols}
            setRows={setRows}
            setCols={setCols}
            />
          {typeValue === "Grid" && (
            <div className="mt-2 flex flex-col gap-2">
              <SectionHeader icon={<IconLayoutGridRemove className="h-4 w-4 md:h-6 md:w-6" />} title="Type of Grid" />
              <GapSegmented value={gridGap} onChange={setGridGap} />
            </div>
          )}

          {typeValue !== "Custom" && (
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">
              {typeValue === "Grid"
                ? gridGap === "With-Gap"
                  ? `Recommended: 3130px x ${rows * 1350}px`
                  : `Recommended: 3110px x ${rows * 1350}px`
                : typeValue === "Carousel"
                  ? `${cols * 1080}px x 1350px`
                  : null}
            </p>
          )}

          {/* <InfoBubble kind="amber" text="Client processing only (server disabled)" /> */}
        </div>

        <div className="mt-auto flex gap-3 pt-4">
          <Button
            variant="secondary"
            className="flex-1 rounded-full font-medium"
            onClick={() => onBack?.()}
            disabled={!onBack}
          >
            Back
          </Button>
          <Button
            variant="default"
            className="flex-1 rounded-full font-semibold"
            disabled={cropping || !firstImageFile}
            onClick={handleCrop}
          >
            {cropping ? "Processing..." : "Cut Image"}
          </Button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1 break-all">{error}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button
                onClick={handleRetry}
                className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
              >
                Try Again
              </button>
              {/* Tombol switch client disembunyikan karena hanya client yang aktif */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                        GENERIC SEGMENTED CONTROL UI                        */
/* -------------------------------------------------------------------------- */

interface SegmentedBaseProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  icons?: Record<string, React.ReactNode>;
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  icons
}: SegmentedBaseProps<T>) {
  return (
    <div className="relative inline-flex w-full max-w-[360px] select-none rounded-full bg-muted/60 p-1 ring-1 ring-border">
      {/* Highlight slider */}
      <span
        className="absolute inset-y-1 left-1 z-0 rounded-full bg-primary/90 transition-[transform,width] duration-500 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${options.indexOf(value)}00%)`
        }}
      />
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={[
              "relative z-10 flex-1 cursor-pointer rounded-full py-0.5 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium transition-colors flex items-center justify-center gap-2",
              active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            ].join(" ")}
          >
            {icons?.[opt]} {opt.replace(/-/g, " ")}
          </button>
        );
      })}
    </div>
  );
}

// Spesifik varian segmented
const TypeSegmented = (p: { value: TypeOption; onChange: (v: TypeOption) => void }) => (
  <SegmentedControl options={TYPE_OPTIONS} value={p.value} onChange={p.onChange} />
);
const GapSegmented = (p: { value: GapOption; onChange: (v: GapOption) => void }) => (
  <SegmentedControl options={GAP_OPTIONS} value={p.value} onChange={p.onChange} />
);

// ProcessingModeSegmented di-nonaktifkan (server mode disabled)

/* ------------------------------ ROW/COL COUNTERS -------------------------- */
interface RowColumnCountersProps {
  mode: TypeOption;
  rows: number;
  cols: number;
  setRows: React.Dispatch<React.SetStateAction<number>>;
  setCols: React.Dispatch<React.SetStateAction<number>>;
}

const RowColumnCounters: React.FC<RowColumnCountersProps> = ({
  mode,
  rows,
  cols,
  setRows,
  setCols
}) => {
  const MIN = 1;
  const MAX = 10;

  const dec = (setter: React.Dispatch<React.SetStateAction<number>>) => () =>
    setter(v => Math.max(MIN, v - 1));
  const inc = (setter: React.Dispatch<React.SetStateAction<number>>) => () =>
    setter(v => Math.min(MAX, v + 1));

  const wrap =
    "inline-flex items-center gap-3 rounded-full bg-muted/60 ring-1 ring-border p-1";
  const btn =
    "size-6 lg:size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95";
  const num = "min-w-7 text-center text-sm font-semibold tabular-nums px-1";

  return (
    <div className="flex items-start gap-4 w-full mt-4 flex-wrap">
      {(mode === "Grid" || mode === "Custom") && (
        <div className="flex flex-col gap-2">
          <SectionHeader
            icon={<IconLayoutRows className="h-4 w-4 md:h-6 md:w-6" />}
            title="Rows"
          />
          <div className={wrap}>
            <Button
              type="button"
              onClick={dec(setRows)}
              disabled={rows <= MIN}
              className={btn}
              aria-label="Decrease rows"
            >
              <IconMinus className="size-3 lg:size-4 text-background" />
            </Button>
            <span className={num}>{rows}</span>
            <Button
              type="button"
              onClick={inc(setRows)}
              disabled={rows >= MAX}
              className={btn}
              aria-label="Increase rows"
            >
              <IconPlus className="size-3 lg:size-4 text-background" />
            </Button>
          </div>
        </div>
      )}

      {(mode === "Carousel" || mode === "Custom") && (
        <div className="flex flex-col gap-2">
          <SectionHeader
            icon={<IconLayoutColumns className="h-4 w-4 md:h-6 md:w-6" />}
            title="Columns"
          />
          <div className={wrap}>
            <Button
              type="button"
              onClick={dec(setCols)}
              disabled={cols <= MIN}
              className={btn}
              aria-label="Decrease columns"
            >
              <IconMinus className="size-3 lg:size-4 text-background" />
            </Button>
            <span className={num}>{cols}</span>
            <Button
              type="button"
              onClick={inc(setCols)}
              disabled={cols >= MAX}
              className={btn}
              aria-label="Increase columns"
            >
              <IconPlus className="size-3 lg:size-4 text-background" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------- UPLOAD PLACEHOLDER ----------------------- */
// Placeholder upload (belum diaktifkan)
const UploadBox: React.FC = () => (
  <label className="flex flex-col items-center justify-center gap-2 w-full h-48 border border-dashed rounded-md text-xs text-muted-foreground cursor-pointer select-none">
    <span>Pilih gambar untuk mulai</span>
    <input type="file" className="hidden" disabled />
  </label>
);

/* ------------------------------- LIVE PREVIEW ------------------------------ */
interface LivePreviewProps {
  file: File;
  mode: TypeOption;
  gap: GapOption;
  rows: number;
  cols: number;
}

const LivePreview: React.FC<LivePreviewProps> = ({ file, mode, gap, rows, cols }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [url, setUrl] = React.useState<string | null>(null);

  // Buat object URL agar <img> tidak perlu dibaca base64
  React.useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Fungsi menggambar overlay wilayah crop
  const draw = React.useCallback(() => {
    if (!url) return;
    const canvas = canvasRef.current;
    const wrapper = containerRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = url;
    img.onload = () => {
      const maxW = wrapper.clientWidth;
      const maxH = wrapper.clientHeight;
      let w = img.width;
      let h = img.height;
      const ar = w / h;
      if (w > maxW) {
        w = maxW;
        h = w / ar;
      }
      if (h > maxH) {
        h = maxH;
        w = h * ar;
      }

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(255,0,0,0.85)";
      ctx.lineWidth = 1;

      if (mode === "Grid") {
        const cfg = GRID_CONST[gap];
        let effW = w;
        let rowH = effW * cfg.aspect;
        if (rowH * rows > h) {
          effW = (h / rows) / cfg.aspect;
          rowH = effW * cfg.aspect;
        }
        const totalH = rowH * rows;
        const sY = totalH < h ? (h - totalH) / 2 : 0;
        const sX = effW < w ? (w - effW) / 2 : 0;
        const scale = effW / cfg.compositeWidth;
        for (let r = 0; r < rows; r++) {
          ctx.strokeRect(sX, sY + r * rowH, effW, rowH);
          for (let i = 1; i < cfg.sliceOffsets.length; i++) {
            const x = sX + cfg.sliceOffsets[i] * scale;
            ctx.beginPath();
            ctx.moveTo(x, sY + r * rowH);
            ctx.lineTo(x, sY + (r + 1) * rowH);
            ctx.stroke();
          }
        }
      } else if (mode === "Carousel") {
        const aspectCarousel = 4 / 5;
        let cellW = w / cols;
        let cellH = cellW / aspectCarousel;
        if (cellH > h) {
          cellH = h;
          cellW = cellH * aspectCarousel;
        }
        const totalW = cellW * cols;
        const sX = (w - totalW) / 2;
        const sY = (h - cellH) / 2;
        for (let c = 0; c < cols; c++) {
          ctx.strokeRect(sX + c * cellW, sY, cellW, cellH);
        }
      } else {
        const cellW = w / cols;
        const cellH = h / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.strokeRect(c * cellW, r * cellH, cellW, cellH);
          }
        }
      }
      ctx.restore();
    };
  }, [url, mode, gap, rows, cols]);

  React.useEffect(() => {
    draw();
  }, [draw]);

  // Redraw saat container resize (responsive)
  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative flex items-center justify-center overflow-hidden rounded-md bg-muted"
    >
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
};

/* ------------------------------- SMALL HELPERS ----------------------------- */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  className?: string;
}> = ({ icon, title, className }) => (
  <div className={["flex items-center gap-2", className || ""].join(" ")}>
    {icon}
    <span className="text-xs lg:text-lg font-bold">{title}</span>
  </div>
);

// const InfoBubble: React.FC<{ kind: "blue" | "amber"; text: string }> = ({
//   kind,
//   text
// }) => {
//   const cls =
//     kind === "blue"
//       ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
//       : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300";
//   return (
//     <div className={`mt-2 p-2 rounded-md border ${cls}`}>
//       <p className="text-[10px] font-medium">{text}</p>
//     </div>
//   );
// };

export default SettingHomeComponents;
