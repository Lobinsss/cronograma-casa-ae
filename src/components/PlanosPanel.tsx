"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { PLANS } from "@/lib/planos";
import type { PlanosState, Role } from "@/lib/types";
import PlanViewer from "./PlanViewer";
import PlanCommentsSidebar from "./PlanCommentsSidebar";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const POLL_MS = 6000;

type ViewerMode = "navigate" | "comment";

export default function PlanosPanel({ role }: { role: Role }) {
  const [state, setState] = useState<PlanosState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState(PLANS[0].id);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [mode, setMode] = useState<ViewerMode>("navigate");
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const [pinText, setPinText] = useState("");
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const inFlight = useRef(false);
  const thumbsRef = useRef<Set<number>>(new Set());

  const plan = PLANS.find((p) => p.id === planId)!;

  const fetchState = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/planos", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setState({ pins: data.pins, generalComments: data.generalComments });
      }
    } catch {
      // reintento en el próximo ciclo
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga intencional al montar
    fetchState();
    const id = setInterval(fetchState, POLL_MS);
    return () => clearInterval(id);
  }, [fetchState]);

  // Contar hojas del PDF activo
  useEffect(() => {
    let cancelled = false;
    setPage(1);
    setThumbs({});
    thumbsRef.current = new Set();

    (async () => {
      try {
        const pdf = await pdfjs.getDocument({ url: plan.file }).promise;
        if (!cancelled) setPageCount(pdf.numPages);
      } catch {
        if (!cancelled) setPageCount(1);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [plan.file]);

  const handleThumb = useCallback((dataUrl: string, pageNum: number) => {
    if (thumbsRef.current.has(pageNum)) return;
    thumbsRef.current.add(pageNum);
    setThumbs((prev) => ({ ...prev, [pageNum]: dataUrl }));
  }, []);

  async function postAction(body: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch("/api/planos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo guardar");
        return false;
      }
      setState({ pins: data.pins, generalComments: data.generalComments });
      return true;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      return false;
    }
  }

  async function submitPin() {
    if (!pendingPin || !pinText.trim()) return;
    const ok = await postAction({
      action: "addPin",
      planId,
      page,
      x: pendingPin.x,
      y: pendingPin.y,
      text: pinText.trim(),
    });
    if (ok) {
      setPendingPin(null);
      setPinText("");
      setMode("navigate");
    }
  }

  const pagePins = (state?.pins ?? []).filter((p) => p.planId === planId && p.page === page);
  const pageGeneral = (state?.generalComments ?? []).filter(
    (c) => c.planId === planId && c.page === page
  );

  if (!state) {
    return (
      <div
        className="flex flex-1 items-center justify-center py-16 text-sm"
        style={{ color: "rgba(235,217,153,0.5)", fontFamily: "var(--font-body)" }}
      >
        Cargando planos…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div
          className="rounded-sm border-2 px-3 py-2 text-sm"
          style={{ borderColor: "var(--clay)", color: "var(--clay)" }}
        >
          {error}
        </div>
      )}

      {/* Selector de plano */}
      <div className="flex flex-wrap gap-2">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPlanId(p.id);
              setSelectedPinId(null);
            }}
            className="focus-ring rounded-sm border-2 px-3 py-2 text-xs font-bold uppercase tracking-wide"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: planId === p.id ? "var(--cream)" : "rgba(235,217,153,0.3)",
              color: planId === p.id ? "var(--cream)" : "rgba(235,217,153,0.65)",
              backgroundColor: planId === p.id ? "rgba(235,217,153,0.12)" : "transparent",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Modo + miniaturas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["navigate", "comment"] as ViewerMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="focus-ring rounded-sm border-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide"
              style={{
                fontFamily: "var(--font-body)",
                borderColor: mode === m ? "var(--primary)" : "rgba(235,217,153,0.3)",
                color: mode === m ? "var(--cream)" : "rgba(235,217,153,0.65)",
                backgroundColor: mode === m ? "var(--primary)" : "transparent",
              }}
            >
              {m === "navigate" ? "Navegar" : "Comentar"}
            </button>
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-wide opacity-50" style={{ fontFamily: "var(--font-body)" }}>
          Sesión: {role === "macondo" ? "Macondo" : "Cliente"}
        </span>
      </div>

      {pageCount > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setPage(n);
                setSelectedPinId(null);
              }}
              className="focus-ring shrink-0 overflow-hidden rounded-sm border-2"
              style={{
                borderColor: page === n ? "var(--cream)" : "rgba(235,217,153,0.25)",
                width: 56,
                height: 72,
              }}
            >
              {thumbs[n] ? (
                <img src={thumbs[n]} alt={`Hoja ${n}`} className="h-full w-full object-cover" />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center text-[10px]"
                  style={{ color: "rgba(235,217,153,0.5)" }}
                >
                  {n}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-w-0 flex-1">
          <PlanViewer
            pdfUrl={plan.file}
            page={page}
            pageCount={pageCount}
            pins={state.pins.filter((p) => p.planId === planId)}
            selectedPinId={selectedPinId}
            mode={mode}
            onPageRender={handleThumb}
            onPlacePin={(x, y) => setPendingPin({ x, y })}
            onSelectPin={setSelectedPinId}
          />
          {mode === "comment" && (
            <p className="mt-2 text-center text-[11px] opacity-60" style={{ fontFamily: "var(--font-body)" }}>
              Toca un punto del plano para colocar un pin · Pellizca para zoom
            </p>
          )}
        </div>

        <PlanCommentsSidebar
          pins={pagePins}
          generalComments={pageGeneral}
          selectedPinId={selectedPinId}
          onAddGeneral={(text) =>
            postAction({ action: "addGeneralComment", planId, page, text })
          }
          onReplyPin={(pinId, text) =>
            postAction({ action: "addReply", targetType: "pin", targetId: pinId, text })
          }
          onReplyGeneral={(commentId, text) =>
            postAction({ action: "addReply", targetType: "general", targetId: commentId, text })
          }
          onToggleResolved={(pinId) =>
            postAction({ action: "togglePinResolved", pinId })
          }
          onSelectPin={setSelectedPinId}
        />
      </div>

      {/* Diálogo nuevo pin */}
      {pendingPin && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={() => {
            setPendingPin(null);
            setPinText("");
          }}
        >
          <div
            className="w-full max-w-md rounded-sm border-2 p-5"
            style={{ borderColor: "var(--primary-light)", backgroundColor: "var(--paper)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              className="mb-3 text-sm font-bold uppercase"
              style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
            >
              Nuevo pin en el plano
            </h3>
            <textarea
              value={pinText}
              onChange={(e) => setPinText(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Describe el punto a revisar…"
              className="focus-ring mb-3 w-full resize-none rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
              style={{ borderColor: "rgba(80,84,35,0.25)", color: "var(--graphite)" }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setPendingPin(null);
                  setPinText("");
                }}
                className="focus-ring rounded-sm border-2 px-3 py-1.5 text-xs font-bold uppercase"
                style={{
                  borderColor: "rgba(80,84,35,0.3)",
                  color: "var(--graphite)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitPin}
                disabled={!pinText.trim()}
                className="focus-ring rounded-sm border-2 px-3 py-1.5 text-xs font-bold uppercase disabled:opacity-40"
                style={{
                  borderColor: "var(--terracotta)",
                  backgroundColor: "var(--terracotta)",
                  color: "var(--cream)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Colocar pin
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
