"use client"

import React from "react";

import { 
  IconSettings,
  IconMinus,
  IconPlus,
  IconLayoutRows,
  IconLayoutColumns,
  IconLayoutGridRemove
 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface SettingHomeComponentsProps {
  files?: File[];
  onBack?: () => void;
  onCropped?: (images: string[]) => void;
}

const SettingHomeComponents: React.FC<SettingHomeComponentsProps> = ({ files = [], onBack, onCropped }) => {
  const [typeValue, setTypeValue] = React.useState<TypeOption>("Grid")
  const [gridGap, setGridGap] = React.useState<GapOption>("with-gap")
  const [rows, setRows] = React.useState(1);
  const [cols, setCols] = React.useState(1);
  const [cropping, setCropping] = React.useState(false);
  const [processingMode, setProcessingMode] = React.useState<'client'|'server'>('client');

  // Reset hidden dimension to 1 when it becomes hidden (mirrors earlier behavior)
  React.useEffect(() => {
    if (typeValue === 'Grid') {
      setCols(1);
    } else if (typeValue === 'Carousel') {
      setRows(1);
    }
  }, [typeValue]);

  const firstImageFile = React.useMemo(() => {
    return files.find(f => f.type.startsWith('image/')) || null;
  }, [files]);

  const handleCrop = async () => {
    if (!firstImageFile) return;
    setCropping(true);
    try {
      if (processingMode === 'server') {
        const fd = new FormData();
        fd.append('file', firstImageFile);
        fd.append('payload', JSON.stringify({
          mode: typeValue,
          rows,
          cols,
          gap: gridGap,
          format: 'png',
          quality: 100,
          lossless: true
        }));
        const res = await fetch('/api/crop', { method: 'POST', body: fd });
        if (!res.ok) {
          let detail = '';
          try { const errJson = await res.json(); if (errJson?.error) detail = errJson.error + (errJson?.detail ? ` - ${errJson.detail}` : ''); } catch {}
          const message = `Server crop failed${detail ? ': ' + detail : ''} (status ${res.status})`;
          console.error(message);
          throw new Error(message);
        }
        interface ServerSlice { index: number; dataUrl: string }
        interface ServerResponse { type: 'array'; slices?: ServerSlice[] }
        const data: ServerResponse = await res.json();
        const images: string[] = (data.slices || []).map((s)=> s.dataUrl);
        onCropped?.(images);
        return;
      }
      const arrayBuffer = await firstImageFile.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: firstImageFile.type });
      const imgUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = imgUrl;
      await new Promise(res => { img.onload = res; img.onerror = res; });
      const originalWidth = img.width;
      const originalHeight = img.height;
      const cropped: string[] = [];

      if (typeValue === 'Grid') {
        // Reference logic: maintain aspect by shrinking effective width first if height would overflow.
        const aspectRatio = gridGap === 'with-gap' ? 0.4313099041533546 : 0.4340836012861736; // rowHeight / effectiveWidth
        const compositeWidth = gridGap === 'with-gap' ? 3130 : 3110;
        const sliceOffsets = gridGap === 'with-gap' ? [0,1025,2050] : [0,1015,2030];
        const outputSliceHeight = 1350;
        // Start with full original width as effective width
        let effectiveWidth = originalWidth;
        let rowHeight = effectiveWidth * aspectRatio;
        let totalHeight = rowHeight * rows;
        if (totalHeight > originalHeight) {
          // Need to reduce width so that resulting rowHeight fits: rowHeight = effectiveWidth * aspect <= originalHeight/rows
          // => effectiveWidth <= (originalHeight/rows)/aspectRatio
          effectiveWidth = (originalHeight / rows) / aspectRatio;
          rowHeight = effectiveWidth * aspectRatio;
          totalHeight = rowHeight * rows; // now fits
        }
        const startX = effectiveWidth < originalWidth ? (originalWidth - effectiveWidth)/2 : 0;
        const startY = totalHeight < originalHeight ? (originalHeight - totalHeight)/2 : 0;
        for (let r = 0; r < rows; r++) {
          const cropY = startY + r * rowHeight;
          const rowCanvas = document.createElement('canvas');
          rowCanvas.width = compositeWidth;
          rowCanvas.height = outputSliceHeight;
          const rowCtx = rowCanvas.getContext('2d');
          rowCtx?.drawImage(
            img,
            startX,
            cropY,
            effectiveWidth,
            rowHeight,
            0,
            0,
            compositeWidth,
            outputSliceHeight
          );
          for (let i = 0; i < 3; i++) {
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = 1080;
            sliceCanvas.height = outputSliceHeight;
            const sliceCtx = sliceCanvas.getContext('2d');
            sliceCtx?.drawImage(
              rowCanvas,
              sliceOffsets[i],
              0,
              1080,
              outputSliceHeight,
              0,
              0,
              1080,
              outputSliceHeight
            );
            cropped.push(sliceCanvas.toDataURL('image/png'));
          }
        }
      } else if (typeValue === 'Carousel') {
        const aspectRatio = 4/5;
        const totalCols = cols;
        let targetWidth = originalWidth / totalCols;
        let targetHeight = targetWidth / aspectRatio;
        if (targetHeight > originalHeight) {
          targetHeight = originalHeight;
          targetWidth = targetHeight * aspectRatio;
        }
        const startX = (originalWidth - targetWidth * totalCols)/2;
        const startY = (originalHeight - targetHeight)/2;
        for (let c = 0; c < totalCols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = 1080;
          canvas.height = 1350;
          const ctx = canvas.getContext('2d');
            ctx?.drawImage(
              img,
              startX + c*targetWidth,
              startY,
              targetWidth,
              targetHeight,
              0,
              0,
              1080,
              1350
            );
          cropped.push(canvas.toDataURL('image/png'));
        }
      } else if (typeValue === 'Custom') {
        const totalCols = cols;
        const totalRows = rows;
        const cellWidth = originalWidth / totalCols;
        const cellHeight = originalHeight / totalRows;
        for (let r = 0; r < totalRows; r++) {
          for (let c = 0; c < totalCols; c++) {
            const canvas = document.createElement('canvas');
            canvas.width = cellWidth;
            canvas.height = cellHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(
              img,
              c*cellWidth,
              r*cellHeight,
              cellWidth,
              cellHeight,
              0,
              0,
              cellWidth,
              cellHeight
            );
            cropped.push(canvas.toDataURL('image/png'));
          }
        }
      }
      onCropped?.(cropped);
      URL.revokeObjectURL(imgUrl);
    } catch (e) {
      console.error('Crop failed', e);
    } finally {
      setCropping(false);
    }
  };
  return (
    <div className="flex flex-1 flex-col gap-3 lg:grid lg:grid-cols-5 lg:gap-4 h-full">
      {/* Left section */}
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-3 flex flex-col flex-1 h-full border relative">
        {firstImageFile ? (
          <LivePreview file={firstImageFile} mode={typeValue} gap={gridGap} rows={rows} cols={cols} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <UploadBox onSelect={()=> onBack ? null : undefined} />
          </div>
        )}
      </div>

      {/* Right section - 2/5 width on large screens, full width on mobile/tablet */}
    <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-2 flex flex-col flex-1 h-full border relative">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <IconSettings className="h-4 w-4 md:h-6 md:w-6" />
                <span className="text-xs lg:text-lg font-bold">Cut Mode</span>
            </div>

            <TypeSegmented value={typeValue} onChange={setTypeValue} />
        </div>
        <RowColumnCounters mode={typeValue} rows={rows} cols={cols} setRows={setRows} setCols={setCols} />
        {typeValue === "Grid" && (
          <div className="mt-2 lg:mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <IconLayoutGridRemove className="h-4 w-4 md:h-6 md:w-6" />
              <span className="text-xs lg:text-lg font-bold">Type of Grid</span>
            </div>
            <GapSegmented value={gridGap} onChange={setGridGap} />
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2">
          <span className="font-bold text-xs">Processing</span>
          <div className="inline-flex rounded-full bg-muted/60 ring-1 ring-border p-1 text-[10px]">
            {(['client','server'] as const).map(m => {
              const active = processingMode===m;
              return (
                <button key={m} type="button" onClick={()=>setProcessingMode(m)}
                  className={["px-3 py-1 rounded-full font-medium transition-colors", active?"bg-primary/90 text-primary-foreground":"text-muted-foreground hover:text-foreground"].join(' ')}>
                  {m === 'client' ? 'Client' : 'Server'}
                </button>
              )
            })}
          </div>
          <p className="text-[9px] text-muted-foreground leading-snug max-w-xs">Client cepat & hemat bandwidth. Server untuk gambar besar / device lemah.</p>
        </div>
        {typeValue !== 'Custom' && (
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">
            {typeValue === 'Grid' ? (
              gridGap === 'with-gap' ? `Recommended: 3130px x ${rows*1350}px` : `Recommended: 3110px x ${rows*1350}px`
            ) : typeValue === 'Carousel' ? (
              `${cols*1080}px x 1350px`
            ) : null}
          </p>
        )}
        <div className="mt-auto flex gap-3">
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
            {cropping ? 'Processing…' : 'Cut Image'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Segmented control component
const options = ["Grid", "Carousel", "Custom"] as const
type TypeOption = typeof options[number]

const gapOptions = ["with-gap", "without-gap"] as const
type GapOption = typeof gapOptions[number]

interface TypeSegmentedProps {
  value: TypeOption
  onChange: (v: TypeOption) => void
}

interface GapSegmentedProps {
  value: GapOption
  onChange: (v: GapOption) => void
}
const GapSegmented: React.FC<GapSegmentedProps> = ({ value, onChange }) => {
  return (
    <div className="relative inline-flex w-full max-w-[360px] select-none rounded-full bg-muted/60 p-1 ring-1 ring-border">
      <span
        className="absolute inset-y-1 left-1 z-0 rounded-full bg-primary/90 transition-[transform,width] duration-600 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${gapOptions.length})`,
          transform: `translateX(${gapOptions.indexOf(value)}00%)`,
        }}
      />
      {gapOptions.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={[
              "relative z-10 flex-1 cursor-pointer rounded-full py-0.5 lg:px-4 lg:py-1.5 text-sm font-medium transition-colors capitalize",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {opt.replace('-', ' ')}
          </button>
        )
      })}
    </div>
  )
}
const TypeSegmented: React.FC<TypeSegmentedProps> = ({ value, onChange }) => {

  return (
    <div className="relative inline-flex w-full max-w-[360px] select-none rounded-full bg-muted/60 p-1 ring-1 ring-border">
      {/* Indicator */}
      <span
        className="absolute inset-y-1 left-1 z-0 rounded-full bg-primary/90 transition-[transform,width] duration-600 ease-out"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${options.indexOf(value)}00%)`,
        }}
      />
      {options.map((opt) => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className={[
              "relative z-10 flex-1 cursor-pointer rounded-full py-0.5 lg:px-4 lg:py-1.5 text-sm font-medium transition-colors",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// Row / Column counters with + - controls (1-10)
interface RowColumnCountersProps {
  mode: TypeOption;
  rows: number;
  cols: number;
  setRows: React.Dispatch<React.SetStateAction<number>>;
  setCols: React.Dispatch<React.SetStateAction<number>>;
}
const RowColumnCounters: React.FC<RowColumnCountersProps> = ({ mode, rows, cols, setRows, setCols }) => {
  const MIN = 1;
  const MAX = 10;
  const dec = (setter: React.Dispatch<React.SetStateAction<number>>) => () => setter(v => Math.max(MIN, v - 1));
  const inc = (setter: React.Dispatch<React.SetStateAction<number>>) => () => setter(v => Math.min(MAX, v + 1));
  const wrapperClass = "inline-flex items-center gap-3 rounded-full bg-muted/60 ring-1 ring-border p-1";
  const circleBtn = "size-6 lg:size-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer";
  const numberClass = "min-w-7 text-center text-sm font-semibold tabular-nums px-1";
  return (
    <div className="flex items-start justify-start gap-4 w-full mt-2 lg:mt-6">
      {(mode === 'Grid' || mode === 'Custom') && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <IconLayoutRows className="h-4 w-4 md:h-6 md:w-6" />
            <span className="text-xs lg:text-lg font-bold">Rows</span>
          </div>
          <div className={wrapperClass}>
            <Button type="button" onClick={dec(setRows)} disabled={rows <= MIN} aria-label="Decrease rows" className={circleBtn}>
              <IconMinus className="size-3 lg:size-4 text-background" />
            </Button>
            <span className={numberClass}>{rows}</span>
            <Button type="button" onClick={inc(setRows)} disabled={rows >= MAX} aria-label="Increase rows" className={circleBtn}>
              <IconPlus className="size-3 lg:size-4 text-background" />
            </Button>
          </div>
        </div>
      )}
      {(mode === 'Carousel' || mode === 'Custom') && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <IconLayoutColumns className="h-4 w-4 md:h-6 md:w-6" />
            <span className="text-xs lg:text-lg font-bold">Columns</span>
          </div>
          <div className={wrapperClass}>
            <Button type="button" onClick={dec(setCols)} disabled={cols <= MIN} aria-label="Decrease columns" className={circleBtn}>
              <IconMinus className="size-3 lg:size-4 text-background" />
            </Button>
            <span className={numberClass}>{cols}</span>
            <Button type="button" onClick={inc(setCols)} disabled={cols >= MAX} aria-label="Increase columns" className={circleBtn}>
              <IconPlus className="size-3 lg:size-4 text-background" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingHomeComponents;

// Simple placeholder upload box (since main flow lifts files elsewhere)
interface UploadBoxProps { onSelect?: (files: File[]) => void }
const UploadBox: React.FC<UploadBoxProps> = ({ onSelect }) => {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const list = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    if (list.length && onSelect) onSelect(list);
  };
  return (
    <label className="flex flex-col items-center justify-center gap-2 w-full h-48 border border-dashed rounded-md text-xs text-muted-foreground cursor-pointer hover:bg-muted/40 transition">
      <span>Pilih gambar untuk mulai</span>
      <input type="file" accept="image/*" multiple className="hidden" onChange={handleChange} />
    </label>
  );
};

// Live preview canvas component
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

  // Create object URL once
  React.useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const draw = React.useCallback(() => {
    if (!url) return;
    const canvas = canvasRef.current;
    const wrapper = containerRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const maxW = wrapper.clientWidth;
      const maxH = wrapper.clientHeight;
      let w = img.width;
      let h = img.height;
      const ar = w / h;
      if (w > maxW) { w = maxW; h = w / ar; }
      if (h > maxH) { h = maxH; w = h * ar; }
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(img, 0, 0, w, h);
      // draw overlay grid
      ctx.save();
      ctx.strokeStyle = 'rgba(255,0,0,0.85)';
      ctx.lineWidth = 1;
      if (mode === 'Grid') {
        const aspectRatio = gap === 'with-gap' ? 0.4313099041533546 : 0.4340836012861736; // rowH / effectiveWidth
        // Start assuming effective width spans displayed width w
        let effectiveWidth = w;
        let rowH = effectiveWidth * aspectRatio;
        if (rowH * rows > h) {
          // Need to reduce effective width so height fits
          effectiveWidth = (h / rows) / aspectRatio;
          rowH = effectiveWidth * aspectRatio; // = h/rows
        }
        const totalH = rowH * rows;
        const startY = totalH < h ? (h - totalH)/2 : 0;
        const startX = effectiveWidth < w ? (w - effectiveWidth)/2 : 0;
        const compositeWidth = gap === 'with-gap' ? 3130 : 3110;
        const offsets = gap === 'with-gap' ? [0,1025,2050] : [0,1015,2030];
        const scale = effectiveWidth / compositeWidth;
        for (let r = 0; r < rows; r++) {
          ctx.strokeRect(startX, startY + r*rowH, effectiveWidth, rowH);
          for (let i = 1; i < offsets.length; i++) {
            const x = startX + offsets[i] * scale;
            ctx.beginPath();
            ctx.moveTo(x, startY + r*rowH);
            ctx.lineTo(x, startY + (r+1)*rowH);
            ctx.stroke();
          }
        }
      } else if (mode === 'Carousel') {
        const aspectRatio = 4/5;
        const totalCols = cols;
        let cellW = w / totalCols;
        let cellH = cellW / aspectRatio;
        if (cellH > h) {
          cellH = h;
          cellW = cellH * aspectRatio;
        }
        const totalW = cellW * totalCols;
        const startX = (w - totalW)/2;
        const startY = (h - cellH)/2;
        for (let c = 0; c < totalCols; c++) {
          ctx.strokeRect(startX + c*cellW, startY, cellW, cellH);
        }
      } else if (mode === 'Custom') {
        const cellW = w / cols;
        const cellH = h / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.strokeRect(c*cellW, r*cellH, cellW, cellH);
          }
        }
      }
      ctx.restore();
    };
  }, [url, mode, gap, rows, cols]);

  // Redraw on dependencies change
  React.useEffect(() => { draw(); }, [draw]);
  // Resize observer to keep responsive
  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div ref={containerRef} className="flex-1 relative flex items-center justify-center overflow-hidden rounded-md bg-muted">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>
  );
};
