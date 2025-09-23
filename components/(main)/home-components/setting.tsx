"use client";

import * as React from "react";
import {
  IconSettings,
  IconLayoutGridRemove,
  IconServer,
  IconDeviceDesktop,
  IconLayoutRows,
  IconLayoutColumns,
  IconMinus,
  IconPlus
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

// --- Option types ---
const TYPE_OPTIONS = ["Grid", "Carousel", "Custom"] as const;
type TypeOption = typeof TYPE_OPTIONS[number];
const GAP_OPTIONS = ["with-gap", "without-gap"] as const;
type GapOption = typeof GAP_OPTIONS[number];
const PROCESSING_OPTIONS = ["client", "server"] as const;
type ProcessingMode = typeof PROCESSING_OPTIONS[number];

interface SettingHomeComponentsProps {
  files?: File[];
  onBack?: () => void;
  onCropped?: (images: string[]) => void;
}

const SettingHomeComponents: React.FC<SettingHomeComponentsProps> = ({ files = [], onBack, onCropped }) => {
  const [typeValue, setTypeValue] = React.useState<TypeOption>("Grid");
  const [gridGap, setGridGap] = React.useState<GapOption>("with-gap");
  const [processingMode, setProcessingMode] = React.useState<ProcessingMode>("client");
  const [rows, setRows] = React.useState(1);
  const [cols, setCols] = React.useState(1);
  const [cropping, setCropping] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => { if (typeValue === "Grid") setCols(1); if (typeValue === "Carousel") setRows(1); }, [typeValue]);
  const firstImageFile = React.useMemo(() => files.find(f => f.type.startsWith("image/")) || null, [files]);

  // Convert to data URL (server)
  const fileToDataUrl = async (file: File) => {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return `data:${file.type};base64,${btoa(binary)}`;
  };

  // Client crop
  const cropOnClient = React.useCallback(async (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("Gambar gagal dimuat")); });
    const W = img.width; const H = img.height; const outputs: string[] = [];
    if (typeValue === "Grid") {
      const aspect = gridGap === "with-gap" ? 0.4313099041533546 : 0.4340836012861736;
      const compositeWidth = gridGap === "with-gap" ? 3130 : 3110;
      const sliceOffsets = gridGap === "with-gap" ? [0,1025,2050] : [0,1015,2030];
      const outH = 1350;
      let effW = W; let rowH = effW * aspect; if (rowH * rows > H) { effW = (H / rows) / aspect; rowH = effW * aspect; }
      const startX = effW < W ? (W - effW)/2 : 0; const totalH = rowH * rows; const startY = totalH < H ? (H - totalH)/2 : 0;
      for (let r=0; r<rows; r++) {
        const rowCanvas = document.createElement('canvas'); rowCanvas.width = compositeWidth; rowCanvas.height = outH; const rowCtx = rowCanvas.getContext('2d')!;
        rowCtx.drawImage(img, startX, startY + r*rowH, effW, rowH, 0,0, compositeWidth, outH);
        for (let i=0;i<sliceOffsets.length;i++) { const sc = document.createElement('canvas'); sc.width=1080; sc.height=outH; const sctx = sc.getContext('2d')!; sctx.drawImage(rowCanvas, sliceOffsets[i],0,1080,outH,0,0,1080,outH); outputs.push(sc.toDataURL('image/png')); }
      }
    } else if (typeValue === "Carousel") {
      const ar = 4/5; let cw = W/cols; let ch = cw/ar; if (ch > H) { ch = H; cw = ch*ar; } const sx = (W - cw*cols)/2; const sy = (H - ch)/2;
      for (let c=0;c<cols;c++){ const cv = document.createElement('canvas'); cv.width=1080; cv.height=1350; const ctx = cv.getContext('2d')!; ctx.drawImage(img, sx + c*cw, sy, cw, ch, 0,0,1080,1350); outputs.push(cv.toDataURL('image/png')); }
    } else { // Custom
      const cw = W/cols; const ch = H/rows;
      for (let r=0;r<rows;r++) for (let c=0;c<cols;c++){ const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch; const ctx=cv.getContext('2d')!; ctx.drawImage(img, c*cw, r*ch, cw, ch, 0,0,cw,ch); outputs.push(cv.toDataURL('image/png')); }
    }
    URL.revokeObjectURL(url);
    if (!outputs.length) throw new Error("Tidak ada hasil crop");
    onCropped?.(outputs);
  }, [typeValue, gridGap, rows, cols, onCropped]);

  // Server crop
  const cropOnServer = React.useCallback(async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const res = await fetch('/api/crop', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ image: dataUrl, type: typeValue, rows, cols, gridGap }) });
    if (!res.ok) { let msg = `Server error ${res.status}`; try { const j = await res.json(); if (j.error) msg = j.error; } catch {} throw new Error(msg); }
    const json = await res.json(); if (!json.success || !Array.isArray(json.images) || !json.images.length) throw new Error('Server tidak mengembalikan gambar');
    onCropped?.(json.images as string[]);
  }, [typeValue, rows, cols, gridGap, onCropped]);

  const handleCrop = React.useCallback(async () => {
    if (!firstImageFile) return; setCropping(true); setError(null);
    try { if (processingMode === 'server') await cropOnServer(firstImageFile); else await cropOnClient(firstImageFile); }
    catch(e){ setError(e instanceof Error ? e.message : 'Error'); }
    finally { setCropping(false); }
  }, [firstImageFile, processingMode, cropOnServer, cropOnClient]);

  const handleRetry = () => { setError(null); void handleCrop(); };
  const switchToClient = () => { setProcessingMode('client'); setError(null); };

  return (
    <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-5 lg:gap-4 h-full">
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-3 flex flex-col flex-1 h-full border relative">
        {firstImageFile ? <LivePreview file={firstImageFile} mode={typeValue} gap={gridGap} rows={rows} cols={cols} /> : <div className="flex-1 flex items-center justify-center"><UploadBox /></div>}
      </div>
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-2 flex flex-col flex-1 h-full border relative">
        <div className="flex flex-col gap-2">
          <SectionHeader icon={<IconSettings className="h-4 w-4 md:h-6 md:w-6" />} title="Cut Mode" />
          <TypeSegmented value={typeValue} onChange={setTypeValue} />
          <SectionHeader icon={<IconServer className="h-4 w-4 md:h-6 md:w-6" />} title="Processing" className="mt-4" />
          <ProcessingModeSegmented value={processingMode} onChange={setProcessingMode} />
          {typeValue === 'Grid' && (
            <div className="mt-2 flex flex-col gap-2">
              <SectionHeader icon={<IconLayoutGridRemove className="h-4 w-4 md:h-6 md:w-6" />} title="Type of Grid" />
              <GapSegmented value={gridGap} onChange={setGridGap} />
            </div>
          )}
          <RowColumnCounters mode={typeValue} rows={rows} cols={cols} setRows={setRows} setCols={setCols} />
          {typeValue !== 'Custom' && (
            <p className="mt-2 text-[11px] font-medium text-muted-foreground">{typeValue === 'Grid' ? (gridGap === 'with-gap' ? `Recommended: 3130px x ${rows*1350}px` : `Recommended: 3110px x ${rows*1350}px`) : typeValue === 'Carousel' ? `${cols*1080}px x 1350px` : null}</p>
          )}
          {processingMode === 'server' && <InfoBubble kind='blue' text='Server processing: lebih cepat & hemat memory' />}
          {processingMode === 'client' && <InfoBubble kind='amber' text='Client processing: semua proses di browser' />}
        </div>
        <div className="mt-auto flex gap-3 pt-4">
          <Button variant="secondary" className="flex-1 rounded-full font-medium" onClick={() => onBack?.()} disabled={!onBack}>Back</Button>
          <Button variant="default" className="flex-1 rounded-full font-semibold" disabled={cropping || !firstImageFile} onClick={handleCrop}>{cropping ? (processingMode === 'server' ? 'Processing on server...' : 'Processing...') : `Cut Image ${processingMode === 'server' ? '(Server)' : '(Client)'}`}</Button>
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
            <p className="text-xs text-red-600 dark:text-red-500 mt-1 break-all">{error}</p>
            <div className="flex gap-2 mt-2 flex-wrap">
              <button onClick={handleRetry} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors">Try Again</button>
              {processingMode === 'server' && <button onClick={switchToClient} className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors">Try Client Mode</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Segmented control generic
interface SegmentedBaseProps<T extends string> { options: readonly T[]; value: T; onChange: (v: T) => void; icons?: Record<string, React.ReactNode>; }
function SegmentedControl<T extends string>({ options, value, onChange, icons }: SegmentedBaseProps<T>) {
  return (
    <div className="relative inline-flex w-full max-w-[360px] select-none rounded-full bg-muted/60 p-1 ring-1 ring-border">
      <span className="absolute inset-y-1 left-1 z-0 rounded-full bg-primary/90 transition-[transform,width] duration-500 ease-out" style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${options.indexOf(value)}00%)` }} />
      {options.map(opt => {
        const active = opt === value;
        return (
          <button key={opt} type="button" aria-pressed={active} onClick={() => onChange(opt)} className={["relative z-10 flex-1 cursor-pointer rounded-full py-0.5 lg:px-4 lg:py-1.5 text-xs lg:text-sm font-medium transition-colors flex items-center justify-center gap-2", active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"].join(" ")}>{icons?.[opt]} {opt.replace(/-/g, " ")}</button>
        );
      })}
    </div>
  );
}
const TypeSegmented = (p: { value: TypeOption; onChange: (v: TypeOption) => void }) => <SegmentedControl options={TYPE_OPTIONS} value={p.value} onChange={p.onChange} />;
const GapSegmented = (p: { value: GapOption; onChange: (v: GapOption) => void }) => <SegmentedControl options={GAP_OPTIONS} value={p.value} onChange={p.onChange} />;
const ProcessingModeSegmented = (p: { value: ProcessingMode; onChange: (v: ProcessingMode) => void }) => <SegmentedControl options={PROCESSING_OPTIONS} value={p.value} onChange={p.onChange} icons={{ server: <IconServer className="h-3 w-3 lg:h-4 lg:w-4" />, client: <IconDeviceDesktop className="h-3 w-3 lg:h-4 lg:w-4" /> }} />;

// Counters
interface RowColumnCountersProps { mode: TypeOption; rows: number; cols: number; setRows: React.Dispatch<React.SetStateAction<number>>; setCols: React.Dispatch<React.SetStateAction<number>>; }
const RowColumnCounters: React.FC<RowColumnCountersProps> = ({ mode, rows, cols, setRows, setCols }) => {
  const MIN = 1, MAX = 10;
  const dec = (s: React.Dispatch<React.SetStateAction<number>>) => () => s(v => Math.max(MIN, v - 1));
  const inc = (s: React.Dispatch<React.SetStateAction<number>>) => () => s(v => Math.min(MAX, v + 1));
  const wrap = "inline-flex items-center gap-3 rounded-full bg-muted/60 ring-1 ring-border p-1";
  const btn = "size-6 lg:size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95";
  const num = "min-w-7 text-center text-sm font-semibold tabular-nums px-1";
  return (
    <div className="flex items-start gap-4 w-full mt-4 flex-wrap">
      {(mode === 'Grid' || mode === 'Custom') && (
        <div className="flex flex-col gap-2">
          <SectionHeader icon={<IconLayoutRows className="h-4 w-4 md:h-6 md:w-6" />} title="Rows" />
          <div className={wrap}>
            <Button type='button' onClick={dec(setRows)} disabled={rows <= MIN} className={btn} aria-label='Decrease rows'><IconMinus className="size-3 lg:size-4" /></Button>
            <span className={num}>{rows}</span>
            <Button type='button' onClick={inc(setRows)} disabled={rows >= MAX} className={btn} aria-label='Increase rows'><IconPlus className="size-3 lg:size-4" /></Button>
          </div>
        </div>
      )}
      {(mode === 'Carousel' || mode === 'Custom') && (
        <div className="flex flex-col gap-2">
          <SectionHeader icon={<IconLayoutColumns className="h-4 w-4 md:h-6 md:w-6" />} title="Columns" />
          <div className={wrap}>
            <Button type='button' onClick={dec(setCols)} disabled={cols <= MIN} className={btn} aria-label='Decrease columns'><IconMinus className="size-3 lg:size-4" /></Button>
            <span className={num}>{cols}</span>
            <Button type='button' onClick={inc(setCols)} disabled={cols >= MAX} className={btn} aria-label='Increase columns'><IconPlus className="size-3 lg:size-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder upload (disabled here)
const UploadBox: React.FC = () => (
  <label className="flex flex-col items-center justify-center gap-2 w-full h-48 border border-dashed rounded-md text-xs text-muted-foreground cursor-pointer select-none">
    <span>Pilih gambar untuk mulai</span>
    <input type='file' className='hidden' disabled />
  </label>
);

// Live preview canvas overlay
interface LivePreviewProps { file: File; mode: TypeOption; gap: GapOption; rows: number; cols: number; }
const LivePreview: React.FC<LivePreviewProps> = ({ file, mode, gap, rows, cols }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => { const u = URL.createObjectURL(file); setUrl(u); return () => URL.revokeObjectURL(u); }, [file]);
  const draw = React.useCallback(() => {
    if (!url) return; const canvas = canvasRef.current; const wrapper = containerRef.current; if (!canvas || !wrapper) return; const ctx = canvas.getContext('2d'); if (!ctx) return; const img = new Image(); img.src = url; img.onload = () => {
      const maxW = wrapper.clientWidth, maxH = wrapper.clientHeight; let w = img.width, h = img.height; const ar = w/h; if (w>maxW){ w=maxW; h=w/ar; } if (h>maxH){ h=maxH; w=h*ar; }
      canvas.width = w; canvas.height = h; ctx.clearRect(0,0,w,h); ctx.drawImage(img,0,0,w,h); ctx.save(); ctx.strokeStyle='rgba(255,0,0,0.85)'; ctx.lineWidth=1;
      if (mode==='Grid') {
        const ar2 = gap==='with-gap'?0.4313099041533546:0.4340836012861736; let effW=w; let rowH=effW*ar2; if (rowH*rows>h){ effW=(h/rows)/ar2; rowH=effW*ar2; }
        const compW = gap==='with-gap'?3130:3110; const offs = gap==='with-gap'?[0,1025,2050]:[0,1015,2030]; const totalH=rowH*rows; const sY= totalH<h ? (h-totalH)/2 :0; const sX= effW<w ? (w-effW)/2 :0; const scale = effW/compW;
        for (let r=0;r<rows;r++){ ctx.strokeRect(sX, sY + r*rowH, effW, rowH); for (let i=1;i<offs.length;i++){ const x = sX + offs[i]*scale; ctx.beginPath(); ctx.moveTo(x, sY + r*rowH); ctx.lineTo(x, sY + (r+1)*rowH); ctx.stroke(); }}
      } else if (mode==='Carousel') {
        const arC=4/5; let cw=w/cols; let ch=cw/arC; if (ch>h){ ch=h; cw=ch*arC; } const totalW=cw*cols; const sX=(w-totalW)/2; const sY=(h-ch)/2; for (let c=0;c<cols;c++) ctx.strokeRect(sX + c*cw, sY, cw, ch);
      } else {
        const cw=w/cols, ch=h/rows; for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) ctx.strokeRect(c*cw, r*ch, cw, ch);
      }
      ctx.restore();
    };
  }, [url, mode, gap, rows, cols]);
  React.useEffect(() => { draw(); }, [draw]);
  React.useEffect(() => { if (!containerRef.current) return; const ro = new ResizeObserver(() => draw()); ro.observe(containerRef.current); return () => ro.disconnect(); }, [draw]);
  return <div ref={containerRef} className="flex-1 relative flex items-center justify-center overflow-hidden rounded-md bg-muted"><canvas ref={canvasRef} className="max-w-full max-h-full" /></div>;
};

// Small UI helpers
const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; className?: string }> = ({ icon, title, className }) => (
  <div className={["flex items-center gap-2", className || ""].join(" ")}>{icon}<span className="text-xs lg:text-lg font-bold">{title}</span></div>
);
const InfoBubble: React.FC<{ kind: 'blue' | 'amber'; text: string }> = ({ kind, text }) => {
  const cls = kind==='blue' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
  return <div className={`mt-2 p-2 rounded-md border ${cls}`}><p className="text-[10px] font-medium">{text}</p></div>;
};

export default SettingHomeComponents;
