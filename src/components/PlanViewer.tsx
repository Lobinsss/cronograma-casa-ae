"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjs from "pdfjs-dist";
import type { PlanPin } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 5;
const ZOOM_STEP = 1.25;
const MAX_CANVAS_PIXELS = 14_000_000;

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

const btnBase =
  "focus-ring flex h-11 w-11 items-center justify-center rounded-sm border-2 text-lg font-bold leading-none active:scale-95 sm:h-10 sm:w-10";

function getDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 2.5);
}

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
  const fitScaleRef = useRef(1);
  const renderGenRef = useRef(0);
  const lastRenderedPageRef = useRef(page);

  const [zoom, setZoom] = useState(1);
  const [gestureMul, setGestureMul] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [pageSize, setPageSize] = useState({ w: 0, h: 0 });
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [animatePan, setAnimatePan] = useState(false);

  const zoomRef = useRef(1);
  const gestureMulRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const dragRef = useRef({
    active: false,
    moved: false,
    pinching: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0,
    pointers: new Map<number, { x: number; y: number }>(),
    pinchDist: 0,
    pinchStartZoom: 1,
  });

  const clampZoom = useCallback(
    (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z)),
    []
  );

  const displayZoom = zoom * gestureMul;

  const flushPan = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setPan({ ...panRef.current });
    });
  }, []);

  const flushGesture = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setGestureMul(gestureMulRef.current);
    });
  }, []);

  const commitZoom = useCallback(
    (next: number) => {
      const clamped = clampZoom(next);
      zoomRef.current = clamped;
      gestureMulRef.current = 1;
      setGestureMul(1);
      setZoom(clamped);
    },
    [clampZoom]
  );

  const resetView = useCallback(() => {
    setAnimatePan(true);
    commitZoom(1);
    panRef.current = { x: 0, y: 0 };
    setPan({ x: 0, y: 0 });
  }, [commitZoom]);

  const zoomBy = useCallback(
    (factor: number) => {
      commitZoom(zoomRef.current * factor);
    },
    [commitZoom]
  );

  // Cargar PDF
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

  // Renderizar PDF a resolución nativa según zoom (no escalar bitmap con CSS)
  useEffect(() => {
    const pdf = pdfRef.current;
    const canvas = canvasRef.current;
    const container = viewportRef.current;
    if (!pdf || !canvas || !container || loading) return;

    let zoomToRender = zoom;
    if (lastRenderedPageRef.current !== page) {
      lastRenderedPageRef.current = page;
      zoomToRender = 1;
      zoomRef.current = 1;
      gestureMulRef.current = 1;
      panRef.current = { x: 0, y: 0 };
      setZoom(1);
      setGestureMul(1);
      setPan({ x: 0, y: 0 });
    }

    const gen = ++renderGenRef.current;
    let cancelled = false;
    setRendering(true);

    (async () => {
      try {
        const pdfPage = await pdf.getPage(page);
        if (cancelled || gen !== renderGenRef.current) return;

        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const fitScale = (container.clientWidth - 8) / baseViewport.width;
        fitScaleRef.current = fitScale;

        const pdfScale = fitScale * zoomToRender;
        const viewport = pdfPage.getViewport({ scale: pdfScale });

        let dpr = getDpr();
        while (
          viewport.width * viewport.height * dpr * dpr > MAX_CANVAS_PIXELS &&
          dpr > 1
        ) {
          dpr -= 0.25;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const pixelW = Math.floor(viewport.width * dpr);
        const pixelH = Math.floor(viewport.height * dpr);

        canvas.width = pixelW;
        canvas.height = pixelH;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, pixelW, pixelH);
        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        await pdfPage.render({ canvasContext: ctx, viewport, canvas }).promise;
        if (cancelled || gen !== renderGenRef.current) return;

        setPageSize({ w: viewport.width, h: viewport.height });

        if (onPageRender && zoomToRender === 1) {
          const thumbVp = pdfPage.getViewport({ scale: 0.15 });
          const off = document.createElement("canvas");
          off.width = thumbVp.width;
          off.height = thumbVp.height;
          const offCtx = off.getContext("2d");
          if (offCtx) {
            await pdfPage.render({ canvasContext: offCtx, viewport: thumbVp, canvas: off }).promise;
            onPageRender(off.toDataURL("image/jpeg", 0.7), page);
          }
        }
      } catch {
        if (!cancelled && gen === renderGenRef.current) {
          setRenderError("Error al renderizar la hoja");
        }
      } finally {
        if (gen === renderGenRef.current) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, page, loading, zoom, onPageRender]);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      commitZoom(zoomRef.current * delta);
    },
    [commitZoom]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-zoom-control]")) return;

    const el = viewportRef.current;
    if (!el) return;

    setAnimatePan(false);
    el.setPointerCapture(e.pointerId);
    const d = dragRef.current;
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (d.pointers.size === 1) {
      d.active = true;
      d.moved = false;
      d.pinching = false;
      d.startX = e.clientX;
      d.startY = e.clientY;
      d.panX = panRef.current.x;
      d.panY = panRef.current.y;
    } else if (d.pointers.size === 2) {
      const pts = [...d.pointers.values()];
      d.pinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      d.pinchStartZoom = zoomRef.current;
      d.pinching = true;
      d.active = false;
      gestureMulRef.current = 1;
      setGestureMul(1);
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
        const preview = clampZoom(d.pinchStartZoom * (dist / d.pinchDist));
        gestureMulRef.current = preview / zoomRef.current;
        flushGesture();
      }
      return;
    }

    if (!d.active) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    panRef.current = { x: d.panX + dx, y: d.panY + dy };
    flushPan();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const layer = layerRef.current;

    if (d.pointers.size === 1 && mode === "comment" && !d.moved && !d.pinching && layer) {
      const rect = layer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
        onPlacePin(x, y);
      }
    }

    const wasPinching = d.pinching;
    d.pointers.delete(e.pointerId);

    if (d.pointers.size === 0) {
      if (wasPinching || gestureMulRef.current !== 1) {
        commitZoom(zoomRef.current * gestureMulRef.current);
      }
      d.active = false;
      d.pinching = false;
      d.pinchDist = 0;
    } else if (d.pointers.size === 1) {
      const remaining = [...d.pointers.values()][0];
      d.active = true;
      d.pinching = false;
      d.moved = false;
      d.startX = remaining.x;
      d.startY = remaining.y;
      d.panX = panRef.current.x;
      d.panY = panRef.current.y;
    }
  };

  const pagePins = pins.filter((p) => p.page === page);

  const controlStyle = {
    borderColor: "var(--primary-light)",
    backgroundColor: "rgba(44, 47, 24, 0.9)",
    color: "var(--cream)",
    fontFamily: "var(--font-body)",
    touchAction: "manipulation" as const,
  };

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
          className="absolute inset-0 z-10 flex items-center justify-center text-sm"
          style={{ color: "rgba(235,217,153,0.6)", fontFamily: "var(--font-body)" }}
        >
          Cargando plano…
        </div>
      )}
      {renderError && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center text-sm"
          style={{ color: "var(--terracotta)", fontFamily: "var(--font-body)" }}
        >
          {renderError}
        </div>
      )}

      {!loading && !renderError && (
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate3d(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px), 0) scale(${gestureMul})`,
            transformOrigin: "center center",
            willChange: "transform",
            transition: animatePan ? "transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
          }}
        >
          <div
            ref={layerRef}
            className="relative"
            style={{
              width: pageSize.w,
              height: pageSize.h,
              opacity: rendering ? 0.85 : 1,
              transition: "opacity 0.15s ease",
            }}
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
                  touchAction: "manipulation",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPin(pin.id === selectedPinId ? null : pin.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 text-[10px] font-bold shadow sm:h-6 sm:w-6"
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

      {rendering && !loading && (
        <div
          className="pointer-events-none absolute right-14 top-2 z-10 rounded-sm px-2 py-1 text-[10px] uppercase tracking-wide"
          style={{
            backgroundColor: "rgba(44, 47, 24, 0.8)",
            color: "rgba(235,217,153,0.7)",
            fontFamily: "var(--font-body)",
          }}
        >
          Mejorando…
        </div>
      )}

      {!loading && !renderError && (
        <div
          data-zoom-control
          className="absolute right-2 top-2 z-20 flex flex-col gap-1.5"
          style={{ touchAction: "manipulation" }}
        >
          <button
            type="button"
            data-zoom-control
            aria-label="Acercar"
            className={btnBase}
            style={controlStyle}
            disabled={rendering}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => zoomBy(ZOOM_STEP)}
          >
            +
          </button>
          <button
            type="button"
            data-zoom-control
            aria-label="Alejar"
            className={btnBase}
            style={controlStyle}
            disabled={rendering}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => zoomBy(1 / ZOOM_STEP)}
          >
            −
          </button>
          <button
            type="button"
            data-zoom-control
            aria-label="Restablecer tamaño"
            className={`${btnBase} text-sm`}
            style={controlStyle}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={resetView}
          >
            ⟲
          </button>
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
        Hoja {page}/{pageCount} · {Math.round(displayZoom * 100)}%
      </div>
    </div>
  );
}
