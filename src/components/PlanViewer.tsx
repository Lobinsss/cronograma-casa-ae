"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PlanPin } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_SCALE = 0.4;
const MAX_SCALE = 5;

type ViewerMode = "navigate" | "comment";

type PlanViewerProps = {
  pdfUrl: string;
  page: number;
  pageCount: number;
  pins: PlanPin[];
  selectedPinId: string | null;
  mode: ViewerMode;
  onPageRender?: (thumbDataUrl: string, pageNum: number) => void;
  onPlacePin: (x: number, y: number) => void;
  onSelectPin: (pinId: string | null) => void;
};

export default function PlanViewer({
  pdfUrl,
  page,
  pageCount,
  pins,
  selectedPinId,
  mode,
  onPageRender,
  onPlacePin,
  onSelectPin,
}: PlanViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfRef = useRef<pdfjs.PDFDocumentProxy | null>(null);

  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    pointers: new Map<number, { x: number; y: number }>(),
    pinchDist: 0,
    pinchScale: 1,
  });

  // Cargar PDF una vez por URL
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRenderError(null);

    (async () => {
      try {
        pdfRef.current = null;
        const task = pdfjs.getDocument({ url: pdfUrl });
        const pdf = await task.promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setLoading(false);
      } catch {
        if (!cancelled) {
          setRenderError("No se pudo cargar el plano");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  // Renderizar página activa
  useEffect(() => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    if (!pdf || !canvas || !container || loading) return;

    let cancelled = false;

    (async () => {
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;

        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const fitScale = (container.clientWidth - 8) / baseViewport.width;
        const renderScale = Math.min(Math.max(fitScale, 0.5), 2);
        const viewport = pdfPage.getViewport({ scale: renderScale });

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setPageSize({ w: viewport.width, h: viewport.height });

        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (cancelled) return;

        // Miniatura para selector de páginas
        if (onPageRender) {
          const thumbScale = 0.15;
          const thumbVp = pdfPage.getViewport({ scale: thumbScale });
          const off = document.createElement("canvas");
          off.width = thumbVp.width;
          off.height = thumbVp.height;
          const offCtx = off.getContext("2d");
          if (offCtx) {
            await pdfPage.render({ canvasContext: offCtx, viewport: thumbVp, canvas: off }).promise;
            onPageRender(off.toDataURL("image/jpeg", 0.6), page);
          }
        }

        setScale(1);
        setPan({ x: 0, y: 0 });
      } catch {
        if (!cancelled) setRenderError("Error al renderizar la hoja");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, page, loading, onPageRender]);

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => clampScale(s * delta));
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = viewportRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    const d = dragRef.current;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (d.pointers.size === 1) {
      d.active = true;
      d.moved = false;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.panX = pan.x;
      d.panY = pan.y;
    } else if (d.pointers.size === 2) {
      const pts = [...d.pointers.values()];
      d.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      d.pinchScale = scale;
      d.active = false;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d.pointers.has(e.pointerId)) return;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (d.pointers.size === 2) {
      const pts = [...d.pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (d.pinchDist > 0) {
        const ratio = dist / d.pinchDist;
        setScale(clampScale(d.pinchScale * ratio));
      }
      return;
    }

    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    setPan({ x: d.panX + dx, y: d.panY + dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const layer = layerRef.current;

    if (d.pointers.size === 1 && mode === "comment" && !d.moved && layer) {
      const rect = layer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        onPlacePin(x, y);
      }
    }

    d.pointers.delete(e.pointerId);
    if (d.pointers.size === 0) {
      d.active = false;
      d.pinchDist = 0;
    } else if (d.pointers.size === 1) {
      const remaining = [...d.pointers.values()][0];
      d.active = true;
      d.moved = false;
      d.startX = remaining.x;
      d.startY = remaining.y;
      d.panX = pan.x;
      d.panY = pan.y;
    }
  };

  const pagePins = pins.filter((p) => p.page === page);

  return (
    <div
      ref={viewportRef}
      className="relative h-[55vh] min-h-[280px] w-full overflow-hidden rounded-sm border-2 touch-none sm:h-[60vh]"
      style={{
        borderColor: "var(--primary-light)",
        backgroundColor: "rgba(44, 47, 24, 0.45)",
        cursor: mode === "comment" ? "crosshair" : "grab",
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm"
          style={{ color: "rgba(235,217,153,0.6)", fontFamily: "var(--font-body)" }}
        >
          Cargando plano…
        </div>
      )}
      {renderError && (
        <div
          className="absolute inset-0 flex items-center justify-center text-sm"
          style={{ color: "var(--terracotta)", fontFamily: "var(--font-body)" }}
        >
          {renderError}
        </div>
      )}

      {!loading && !renderError && (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          <div
            ref={layerRef}
            className="relative"
            style={{ width: pageSize.w, height: pageSize.h }}
          >
            <canvas ref={canvasRef} className="block max-w-none shadow-md" />

            {pagePins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                className="focus-ring absolute z-10 -translate-x-1/2 -translate-y-full"
                style={{
                  left: `${pin.x}%`,
                  top: `${pin.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPin(pin.id === selectedPinId ? null : pin.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow"
                  style={{
                    borderColor: pin.resolved ? "var(--primary)" : "var(--terracotta)",
                    backgroundColor: pin.resolved ? "var(--primary)" : "var(--terracotta)",
                    color: "var(--cream)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {pin.resolved ? "✓" : "!"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="pointer-events-none absolute bottom-2 left-2 rounded-sm px-2 py-1 text-[10px] uppercase tracking-wide"
        style={{
          backgroundColor: "rgba(44, 47, 24, 0.75)",
          color: "rgba(235,217,153,0.7)",
          fontFamily: "var(--font-body)",
        }}
      >
        Hoja {page}/{pageCount} · {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
