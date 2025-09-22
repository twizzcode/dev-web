"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { IconCloudUpload, IconX, IconRefresh, IconFile } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

interface UploadingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  failed?: boolean;
  file?: File;
}

interface ImageUploadProps {
  maxSizeMB?: number;
  accept?: string[]; // e.g. ['image/png','image/jpeg']
  onComplete?: (files: UploadingFile[]) => void;
  onFilesChange?: (files: UploadingFile[]) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  maxSizeMB = 30,
  accept = ["image/png", "image/jpeg"],
  onComplete,
  onFilesChange,
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = React.useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const readableSize = (bytes: number) => {
    if (bytes > 1024 * 1024)
      return (bytes / 1024 / 1024).toFixed(1) + " MB";
    if (bytes > 1024)
      return (bytes / 1024).toFixed(1) + " KB";
    return bytes + " B";
  };

  // Queue for external callbacks to avoid triggering parent state updates inside child render/setState cycle
  const pendingRef = React.useRef<UploadingFile[] | null>(null);
  const completedRef = React.useRef<UploadingFile[] | null>(null);

  // Effect flushes queued callbacks after render commit
  React.useEffect(() => {
    if (pendingRef.current) {
      const payload = pendingRef.current;
      pendingRef.current = null;
      onFilesChange?.(payload);
    }
    if (completedRef.current) {
      const payload = completedRef.current;
      completedRef.current = null;
      onComplete?.(payload);
    }
  });

  const queueChange = (next: UploadingFile[]) => {
    pendingRef.current = next;
  };

  const simulateUpload = (file: UploadingFile) => {
    let progress = 0;
    const speed = 15 + Math.random() * 25; // pseudo speed
    const id = file.id;
    const interval = setInterval(() => {
      progress += Math.random() * speed;
      if (progress >= 100) progress = 100;
      setFiles((prev) => {
        const updated = prev.map(f => f.id === id ? { ...f, progress } : f);
        queueChange(updated);
        if (progress === 100) {
          clearInterval(interval);
          completedRef.current = updated;
        }
        return updated;
      });
    }, 180);
  };

  const validateAndAdd = (list: FileList | File[]) => {
    const arr = Array.from(list);
    const newOnes: UploadingFile[] = [];
    arr.forEach(file => {
      const validType = accept.includes(file.type);
      const validSize = file.size <= maxBytes;
      const id = crypto.randomUUID();
      newOnes.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        failed: !(validType && validSize),
        file,
      });
    });
    if (!newOnes.length) return;
    setFiles(prev => {
      const next = [...newOnes, ...prev];
      queueChange(next);
      return next;
    });
    // start uploads for valid ones
    newOnes.filter(f => !f.failed).forEach(f => simulateUpload(f));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) validateAndAdd(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) validateAndAdd(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const retry = (id: string) => {
    setFiles(prev => {
      const next = prev.map(f => f.id === id ? { ...f, failed: false, progress: 0 } : f);
      queueChange(next);
      return next;
    });
    const target = files.find(f => f.id === id);
    if (target) simulateUpload({ ...target, failed: false, progress: 0 });
  };

  const remove = (id: string) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      queueChange(next);
      return next;
    });
  };

  const hasStarted = files.some(f => !f.failed);
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {!hasStarted && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          className={cn(
            "relative group flex flex-col items-center justify-center rounded-xl border border-dashed transition-all cursor-pointer p-8 text-center",
            "bg-muted/40 hover:bg-muted/60",
            dragActive && "bg-primary/10 border-primary",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept.join(",")}
            multiple
            onChange={onInputChange}
            className="hidden"
          />
          <div className={cn("size-14 rounded-full flex items-center justify-center mb-4 transition-colors",
            dragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            <IconCloudUpload className="size-7" />
          </div>
          <p className="text-sm font-medium">Drag & Drop or Click to Upload</p>
          <p className="text-xs text-muted-foreground mt-1">PNG / JPG up to {maxSizeMB}MB</p>
          <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-transparent group-hover:ring-primary/30 transition-all" />
          {dragActive && <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary animate-pulse" />}
        </div>
      )}
      {hasStarted && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            <IconCloudUpload className="size-4 mr-1" /> Add More
          </Button>
          <p className="text-[11px] text-muted-foreground">Uploading {files.filter(f=>!f.failed).length} file(s)</p>
          <input
            ref={inputRef}
            type="file"
            accept={accept.join(",")}
            multiple
            onChange={onInputChange}
            className="hidden"
          />
        </div>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-3 max-h-64 overflow-auto pr-1">
          {files.map(file => {
            const pct = Math.round(file.progress);
            return (
              <li key={file.id} className={cn("relative rounded-lg border p-3 bg-card/80 backdrop-blur-sm", file.failed && "border-destructive/60")}>                
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 size-10 rounded-md flex items-center justify-center border bg-muted/50",
                    file.failed ? "border-destructive/40 text-destructive" : "text-muted-foreground"
                  )}>
                    <IconFile className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                    <p className={cn("text-xs", file.failed ? "text-destructive" : "text-muted-foreground")}>{readableSize(file.size)}</p>
                    <div className="mt-2 h-2 w-full rounded bg-muted overflow-hidden">
                      <div
                        className={cn("h-full transition-all",
                          file.failed ? "bg-destructive" : "bg-primary"
                        )}
                        style={{ width: pct + "%" }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {file.failed ? (
                      <Button size="sm" variant="outline" onClick={() => retry(file.id)} className="h-7 px-2 text-xs">Retry</Button>
                    ) : pct === 100 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Done</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium">{pct}%</span>
                    )}
                    <button
                      onClick={() => remove(file.id)}
                      className="text-muted-foreground/60 hover:text-foreground transition-colors"
                      aria-label="Remove file"
                    >
                      <IconX className="size-4" />
                    </button>
                  </div>
                </div>
                {file.failed && (
                  <div className="mt-2 text-[11px] text-destructive">Invalid file (only PNG/JPG & &lt;= {maxSizeMB}MB)</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  );
};
