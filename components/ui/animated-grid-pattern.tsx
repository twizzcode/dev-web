"use client";

import { motion } from "motion/react";
import {
  ComponentPropsWithoutRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export interface AnimatedGridPatternProps
  extends ComponentPropsWithoutRef<"svg"> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: string | number;
  numSquares?: number;
  maxOpacity?: number;
  duration?: number;
  maxCyclesPerSquare?: number; // safety cap
}

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  maxCyclesPerSquare = 2,
  ...props
}: AnimatedGridPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const cyclesRef = useRef<Record<number, number>>({});
  const frameRef = useRef<number | null>(null);
  const pendingUpdatesRef = useRef<Set<number>>(new Set());

  const getPos = useCallback(() => {
    if (!dimensions.width || !dimensions.height) return [0, 0];
    return [
      Math.floor((Math.random() * dimensions.width) / width),
      Math.floor((Math.random() * dimensions.height) / height),
    ];
  }, [dimensions.width, dimensions.height, width, height]);

  const generateSquares = useCallback(
    (count: number) => Array.from({ length: count }, (_, i) => ({ id: i, pos: getPos() })),
    [getPos],
  );

  const [squares, setSquares] = useState(() => generateSquares(numSquares));

  const flushPending = useCallback(() => {
    if (pendingUpdatesRef.current.size === 0) return;
    setSquares((current) =>
      current.map((sq) =>
        pendingUpdatesRef.current.has(sq.id)
          ? { ...sq, pos: getPos() }
          : sq,
      ),
    );
    pendingUpdatesRef.current.clear();
    frameRef.current = null;
  }, [getPos]);

  const queueUpdate = useCallback(
    (id: number) => {
      const used = cyclesRef.current[id] || 0;
      if (used >= maxCyclesPerSquare) return; // cap
      cyclesRef.current[id] = used + 1;
      pendingUpdatesRef.current.add(id);
      if (frameRef.current == null) {
        frameRef.current = requestAnimationFrame(flushPending);
      }
    },
    [flushPending, maxCyclesPerSquare],
  );

  useEffect(() => () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); }, []);

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      cyclesRef.current = {};
      setSquares(generateSquares(numSquares));
    }
  }, [dimensions, numSquares, generateSquares]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className,
      )}
      {...props}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M.5 ${height}V.5H${width}`} fill="none" strokeDasharray={strokeDasharray} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map(({ pos: [sx, sy], id }, index) => (
          <motion.rect
            key={`${id}-${index}-${sx}-${sy}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: maxOpacity }}
            transition={{ duration, repeat: 1, delay: index * 0.1, repeatType: "reverse" }}
            onAnimationComplete={() => queueUpdate(id)}
            width={width - 1}
            height={height - 1}
            x={sx * width + 1}
            y={sy * height + 1}
            fill="currentColor"
            strokeWidth={0}
          />
        ))}
      </svg>
    </svg>
  );
}
