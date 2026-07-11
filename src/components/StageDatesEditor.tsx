"use client";

import { useState } from "react";
import { formatShort } from "@/lib/dateUtils";
import { formatCommentTime, roleLabel } from "@/lib/commentUtils";
import type { Role, ScheduleStageView, StageDateChange } from "@/lib/types";

function HistoryList({ history }: { history: StageDateChange[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm opacity-50" style={{ color: "var(--cream)", fontFamily: "var(--font-body)" }}>
        Aún no hay cambios registrados en las fechas del cronograma.
      </p>
    );
  }

  return (
    <ol className="flex max-h-64 flex-col gap-2 overflow-y-auto">
      {history.map((h) => (
        <li
          key={h.id}
          className="rounded-sm border-2 p-3 text-xs"
          style={{ borderColor: "rgba(235,217,153,0.15)", color: "rgba(235,217,153,0.85)" }}
        >
          <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
            <span className="font-bold uppercase" style={{ color: "var(--cream)" }}>
              {h.stageName}
            </span>
            <span className="opacity-60">{formatCommentTime(h.changedAt)}</span>
          </div>
          <p>
            <span className="line-through opacity-50">
              {formatShort(h.prevStart)} – {formatShort(h.prevEnd)}
            </span>
            <span className="mx-1.5">→</span>
            <span style={{ color: "var(--cream)" }}>
              {formatShort(h.newStart)} – {formatShort(h.newEnd)}
            </span>
          </p>
          <p className="mt-1 opacity-60">
            {roleLabel(h.author)}
            {h.note ? ` · ${h.note}` : ""}
          </p>
        </li>
      ))}
    </ol>
  );
}

export default function StageDatesEditor({
  stages,
  history,
  role,
  onUpdate,
}: {
  stages: ScheduleStageView[];
  history: StageDateChange[];
  role: Role;
  onUpdate: (
    stageId: string,
    start: string,
    end: string,
    note?: string
  ) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [showHistory, setShowHistory] = useState(role === "cliente");

  function beginEdit(stage: ScheduleStageView) {
    setEditingId(stage.id);
    setStart(stage.start);
    setEnd(stage.end);
    setNote("");
  }

  async function save(stageId: string) {
    const ok = await onUpdate(stageId, start, end, note.trim() || undefined);
    if (ok) setEditingId(null);
  }

  // Cliente: solo backlog, sin panel de edición
  if (role === "cliente") {
    return (
      <div
        className="rounded-sm border-2 p-5"
        style={{ borderColor: "var(--primary-light)", backgroundColor: "rgba(44, 47, 24, 0.45)" }}
      >
        <h2
          className="mb-4 text-lg font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--paper)" }}
        >
          Historial de fechas
        </h2>
        <HistoryList history={history} />
      </div>
    );
  }

  return (
    <div
      className="rounded-sm border-2 p-5"
      style={{ borderColor: "var(--primary-light)", backgroundColor: "rgba(44, 47, 24, 0.45)" }}
    >
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2
          className="text-lg font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--paper)" }}
        >
          Fechas de etapas
        </h2>
        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="focus-ring text-[10px] uppercase tracking-wide underline-offset-2 hover:underline"
            style={{ color: "var(--cream)", fontFamily: "var(--font-body)" }}
          >
            {showHistory ? "Ocultar historial" : `Historial (${history.length})`}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="rounded-sm border-2 p-3"
            style={{ borderColor: "rgba(235,217,153,0.2)", backgroundColor: "rgba(44,47,24,0.35)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div
                  className="text-xs font-bold uppercase tracking-wide"
                  style={{ color: stage.accent, fontFamily: "var(--font-body)" }}
                >
                  {stage.name}
                </div>
                <div className="text-sm" style={{ color: "var(--cream)" }}>
                  {formatShort(stage.start)} – {formatShort(stage.end)}
                </div>
              </div>
              {editingId !== stage.id && (
                <button
                  type="button"
                  onClick={() => beginEdit(stage)}
                  className="focus-ring rounded-sm border-2 px-3 py-1.5 text-[10px] font-bold uppercase"
                  style={{
                    borderColor: "var(--cream)",
                    color: "var(--cream)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Editar fechas
                </button>
              )}
            </div>

            {editingId === stage.id && (
              <div className="mt-3 flex flex-col gap-2 border-t pt-3" style={{ borderColor: "rgba(235,217,153,0.15)" }}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase opacity-60" style={{ color: "var(--cream)" }}>
                      Inicio
                    </span>
                    <input
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="focus-ring rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
                      style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase opacity-60" style={{ color: "var(--cream)" }}>
                      Fin
                    </span>
                    <input
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="focus-ring rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
                      style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase opacity-60" style={{ color: "var(--cream)" }}>
                    Motivo del cambio (opcional)
                  </span>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ej. retraso por clima, ajuste de suministro…"
                    className="focus-ring rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
                    style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                  />
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => save(stage.id)}
                    className="focus-ring rounded-sm border-2 px-3 py-1.5 text-[10px] font-bold uppercase"
                    style={{
                      borderColor: "var(--primary)",
                      backgroundColor: "var(--primary)",
                      color: "var(--cream)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="focus-ring rounded-sm border-2 px-3 py-1.5 text-[10px] font-bold uppercase"
                    style={{
                      borderColor: "rgba(235,217,153,0.3)",
                      color: "var(--cream)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showHistory && history.length > 0 && (
        <div className="mt-4 border-t pt-4" style={{ borderColor: "rgba(235,217,153,0.15)" }}>
          <h3
            className="mb-3 text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--cream)", fontFamily: "var(--font-body)" }}
          >
            Backlog de cambios
          </h3>
          <HistoryList history={history} />
        </div>
      )}
    </div>
  );
}
