"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';

const ASPECT = 0.5625; // 9:16 -> width/height = 0.5625
const IMG_HEIGHT_RATIO = 0.75;
const DEFAULT_CUSTOM_COLOR = '#222831';
const EXPORT_W = 1080;
const EXPORT_H = 1920;
const DEFAULT_CONTENT_BLUR = 10;

const MODES = ['content','white','black','custom'] as const;
export type ReelsMode = typeof MODES[number];

interface ReelsSettingsProps {
  image?: string; // dataURL or remote URL
  onReset?: () => void;
  onChangeImage?: (dataUrl: string) => void;
}

export const ReelsSettings: React.FC<ReelsSettingsProps> = ({ image, onReset, onChangeImage }) => {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);
  const containerRef = useRef<HTMLDivElement|null>(null);
  const imgElRef = useRef<HTMLImageElement|null>(null);

  const [containerH, setContainerH] = useState(0);
  const [canvasSize, setCanvasSize] = useState<{w:number;h:number}|null>(null);
  const [guideRect, setGuideRect] = useState<{top:number;height:number}|null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const [mode, setMode] = useState<ReelsMode>('content');
  const [modeIndex, setModeIndex] = useState(0);
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM_COLOR);
  const [customInput, setCustomInput] = useState(DEFAULT_CUSTOM_COLOR);
  const [contentBlur, setContentBlur] = useState(DEFAULT_CONTENT_BLUR);
  const [exporting, setExporting] = useState(false);

  const avgCache = useRef<Record<string,string>>({});

  const measure = () => { if (containerRef.current) setContainerH(containerRef.current.clientHeight); };
  useEffect(()=>{ measure(); window.addEventListener('resize', measure); return ()=> window.removeEventListener('resize', measure); },[]);

  const loadImage = (src:string) => new Promise<HTMLImageElement>((res,rej)=>{ const im = new Image(); im.crossOrigin='anonymous'; im.onload=()=>res(im); im.onerror=rej; im.src=src; });

  const getAverage = (img:HTMLImageElement,sx:number,sy:number,sw:number,sh:number,key:string) => {
    if (avgCache.current[key]) return avgCache.current[key];
    try { const off=document.createElement('canvas'); off.width=1; off.height=1; const ctx=off.getContext('2d'); if(!ctx) return '#000'; ctx.drawImage(img,sx,sy,sw,sh,0,0,1,1); const d=ctx.getImageData(0,0,1,1).data; const c=`rgb(${d[0]},${d[1]},${d[2]})`; avgCache.current[key]=c; return c; } catch { return '#000'; }
  };

  const drawComposite = (ctx:CanvasRenderingContext2D,W:number,H:number,img:HTMLImageElement,useMode:ReelsMode,useColor:string,useBlur:number) => {
    ctx.clearRect(0,0,W,H);
    if (useMode==='white') ctx.fillStyle='#fff'; else if (useMode==='black') ctx.fillStyle='#000'; else if (useMode==='custom') ctx.fillStyle=useColor; else ctx.fillStyle='transparent';
    ctx.fillRect(0,0,W,H);
    const nW=img.naturalWidth; const nH=img.naturalHeight; const targetH=H*IMG_HEIGHT_RATIO; const scale=targetH/nH; const targetW=nW*scale; const destY=(H-targetH)/2;
    let srcX=0; let visW=nW; if (targetW>W){ visW=W/scale; srcX=(nW-visW)/2; }
    if (useMode==='content' && destY>0){ const sliceH=destY/scale; const topColor=getAverage(img,srcX,0,visW,sliceH,`t:${srcX}:${visW}:${sliceH}`); const botColor=getAverage(img,srcX,nH-sliceH,visW,sliceH,`b:${srcX}:${visW}:${sliceH}`); ctx.fillStyle=topColor; ctx.fillRect(0,0,W,destY); ctx.fillStyle=botColor; ctx.fillRect(0,destY+targetH,W,destY); ctx.filter=`blur(${useBlur}px)`; ctx.drawImage(img,srcX,0,visW,sliceH,0,0,W,destY); ctx.drawImage(img,srcX,nH-sliceH,visW,sliceH,0,destY+targetH,W,destY); ctx.filter='none'; }
    const destX = targetW<=W ? (W-targetW)/2 : 0;
    ctx.drawImage(img,srcX,0,visW,nH,destX,destY,targetW<=W?targetW:W,targetH);
    return {destY,targetImgH:targetH};
  };

  const redraw = useCallback((overrideMode?:ReelsMode,overrideColor?:string,overrideBlur?:number) => {
    if(!imgElRef.current || !canvasRef.current || !containerH) return;
    const H=containerH; const W=Math.round(H*ASPECT); const canvas=canvasRef.current; if(canvas.width!==W||canvas.height!==H){ canvas.width=W; canvas.height=H; setCanvasSize({w:W,h:H}); }
    const ctx=canvas.getContext('2d'); if(!ctx) return; const r=drawComposite(ctx,W,H,imgElRef.current,overrideMode||mode,overrideColor||customColor,overrideBlur===undefined?contentBlur:overrideBlur); setGuideRect({top:r.destY,height:r.targetImgH});
  },[containerH,mode,customColor,contentBlur]);

  useEffect(()=>{ let cancel=false; if(!image){ imgElRef.current=null; return; } (async()=>{ try{ const im=await loadImage(image); if(cancel) return; imgElRef.current=im; redraw(); }catch(e){ console.error('load fail',e);} })(); return()=>{ cancel=true; }; },[image,redraw]);
  useEffect(()=>{ if(imgElRef.current) redraw(); },[containerH,redraw]);
  useEffect(()=>{ if(imgElRef.current) redraw(); },[redraw]);

  useEffect(()=>{ if(!canvasRef.current) return; canvasRef.current.style.backgroundColor = mode==='white'? '#fff': mode==='black'? '#000': mode==='custom'? customColor : 'transparent'; },[mode,customColor]);

  const changeMode=(next:ReelsMode)=>{ if(next===mode) return; setMode(next); setModeIndex(MODES.indexOf(next)); requestAnimationFrame(()=>redraw(next)); };

  const handleColorInput=(val:string)=>{ setCustomInput(val); const trimmed=val.trim(); const hexOk=/^#([0-9a-f]{3}|([0-9a-f]{6}))$/i.test(trimmed); const fnOk=/^(rgb|rgba|hsl|hsla)\(/i.test(trimmed); if(hexOk||fnOk){ setCustomColor(trimmed); redraw(undefined,trimmed); } };

  const download = () => {
    if(exporting || !imgElRef.current) return; setExporting(true);
    try { const off=document.createElement('canvas'); off.width=EXPORT_W; off.height=EXPORT_H; const ctx=off.getContext('2d'); if(!ctx) throw new Error('ctx'); drawComposite(ctx,EXPORT_W,EXPORT_H,imgElRef.current,mode,customColor,contentBlur); off.toBlob(b=>{ if(!b){ setExporting(false); return; } const url=URL.createObjectURL(b); const a=document.createElement('a'); a.href=url; a.download='reels_1080x1920.png'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); setExporting(false); },'image/png'); } catch(e){ console.error(e); setExporting(false); }
  };

  const disabled = !imgElRef.current;

  return (
    <div className="flex flex-1 flex-col overflow-hidden gap-3 lg:grid lg:grid-cols-5 lg:gap-4 h-full">
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-3 flex flex-col flex-[3] min-h-0 lg:h-full border relative overflow-hidden">
        <div ref={containerRef} className="flex-1 flex items-center justify-center">
          <canvas ref={canvasRef} className={`rounded border max-w-full max-h-full transition filter ${!image? 'blur-sm opacity-60':''}`} />
          {!image && (
            <UploadDrop onPick={(data)=> onChangeImage?.(data)} />
          )}
          {showGuide && guideRect && canvasSize && (
            <div className="pointer-events-none absolute" style={{ left:0, top:guideRect.top, width:canvasSize.w, height:guideRect.height }}>
              <div className="w-full h-full border-2 border-red-500/80 rounded-sm" />
            </div>
          )}
        </div>
      </div>
      <div className="bg-sidebar p-3 lg:p-4 rounded-lg lg:col-span-2 flex flex-col flex-[2] min-h-0 lg:h-full border overflow-hidden">
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h3 className="font-bold text-sm mb-2">Reels Mode</h3>
            <div className="relative flex h-9 w-full rounded-full bg-muted/60 select-none overflow-hidden ring-1 ring-border">
              <div className="absolute inset-y-1 left-1 rounded-full bg-primary/90 transition-transform duration-500" style={{ width:`calc((100% - 0.5rem)/${MODES.length})`, transform:`translateX(${modeIndex}00%)` }} />
              {MODES.map(m=>{
                const active=m===mode; return (
                  <button key={m} disabled={disabled} onClick={()=>changeMode(m)} type="button" className={`relative z-10 flex-1 text-xs font-medium capitalize transition-colors ${active? 'text-primary-foreground':'text-muted-foreground hover:text-foreground'} ${disabled?'opacity-50 cursor-not-allowed':''}`}>{m}</button>
                );
              })}
            </div>
          </div>
          {/* Blur control */}
          <div className={`${mode==='content'? 'opacity-100':'opacity-30 pointer-events-none'} transition`}> 
            <label className="flex items-center justify-between text-xs font-medium mb-1"><span>Blur</span><span className="tabular-nums">{contentBlur}px</span></label>
            <input type="range" min={0} max={40} step={1} value={contentBlur} disabled={disabled || mode!=='content'} onChange={e=>{ const v=Number(e.target.value); setContentBlur(v); redraw(undefined,undefined,v); }} className="w-full" />
          </div>
          {/* Custom color */}
          <div className={`${mode==='custom'? 'opacity-100':'opacity-30 pointer-events-none'} transition flex flex-col gap-2`}>
            <span className="text-xs font-medium">Custom Background</span>
            <div className="flex items-center gap-2">
              <input type="color" disabled={disabled || mode!=='custom'} value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(customColor)? customColor : '#000000'} onChange={e=>{ if(mode!=='custom') return; setCustomColor(e.target.value); setCustomInput(e.target.value); redraw(undefined,e.target.value); }} className="h-8 w-8 p-0 border rounded" />
              <input disabled={disabled || mode!=='custom'} value={customInput} onChange={e=>{ if(mode!=='custom') return; handleColorInput(e.target.value); }} placeholder="#112233 / rgb(0,0,0)" className="flex-1 h-8 text-[11px] px-3 rounded-full border text-foreground bg-background" />
            </div>
          </div>
          {/* Guide toggle */}
          <div className="flex items-center gap-3 mt-2">
            <label className="text-xs font-medium">Preview Guide</label>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input type="checkbox" className="sr-only" checked={showGuide} disabled={disabled} onChange={()=>setShowGuide(s=>!s)} />
              <span className={`h-5 w-9 rounded-full transition-colors ${showGuide?'bg-green-500':'bg-muted-foreground/40'} relative`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${showGuide? 'translate-x-4':''}`} />
              </span>
            </label>
          </div>
          <div className="mt-auto flex gap-3 pt-4">
            <button type="button" disabled={disabled || exporting} onClick={()=>{ onReset?.(); setMode('content'); setModeIndex(0); setCustomColor(DEFAULT_CUSTOM_COLOR); setCustomInput(DEFAULT_CUSTOM_COLOR); setContentBlur(DEFAULT_CONTENT_BLUR); }} className={`flex-1 h-9 rounded-full border text-xs font-medium transition ${disabled? 'opacity-50 cursor-not-allowed':'hover:bg-muted'}`}>Back</button>
            <button type="button" disabled={disabled || exporting} onClick={download} className={`flex-1 h-9 rounded-full text-xs font-semibold transition ${disabled? 'opacity-50 cursor-not-allowed':'bg-primary text-primary-foreground hover:opacity-90'}`}>{exporting? 'Saving…':'Download'}</button>
          </div>
        </div>
        {!image && <div className="absolute inset-0 pointer-events-none" />}
      </div>
    </div>
  );
};

export default ReelsSettings;

// Inline upload drop component
const UploadDrop: React.FC<{ onPick:(dataUrl:string)=>void }> = ({ onPick }) => {
  const inputRef = React.useRef<HTMLInputElement|null>(null);
  const onFiles = (files: FileList|File[]) => {
    const arr = Array.from(files).filter(f=>f.type.startsWith('image/'));
    if (!arr.length) return;
    const file = arr[0];
    const reader = new FileReader();
    reader.onload = () => { if(reader.result) onPick(reader.result as string); };
    reader.readAsDataURL(file);
  };
  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer?.files) onFiles(e.dataTransfer.files);
  };
  const onClick = () => inputRef.current?.click();
  return (
    <div onDrop={onDrop} onDragOver={(e)=>{e.preventDefault();}} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-xs rounded-md border border-dashed border-border/60 text-muted-foreground bg-background/50 backdrop-blur-md px-4">
      <p className="font-medium">Tarik & letakkan gambar di sini</p>
      <p className="text-[10px] opacity-70">atau klik untuk pilih file</p>
      <button type="button" onClick={onClick} className="mt-2 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition">Pilih File</button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e)=>{ if(e.target.files) onFiles(e.target.files); }} />
    </div>
  );
};
