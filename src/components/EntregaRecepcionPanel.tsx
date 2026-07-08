"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EntregaSummary, InsumoRow, Role } from "@/lib/types";
import Stamp from "./Stamp";

const POLL_MS = 6000;

type EntregaData = {
  espacios: string[];
  items: InsumoRow[];
  summary: EntregaSummary;
};

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function InsumoEditForm({
  row,
  onSave,
  onCancel,
}: {
  row: InsumoRow;
  onSave: (data: {
    nuevoConcepto?: string;
    nuevaCantidad?: string;
    comentario?: string;
  }) => void;
  onCancel?: () => void;
}) {
  const [nuevoConcepto, setNuevoConcepto] = useState(row.nuevoConcepto ?? "");
  const [nuevaCantidad, setNuevaCantidad] = useState(
    row.nuevaCantidad != null ? String(row.nuevaCantidad) : ""
  );
  const [comentario, setComentario] = useState(row.comentario ?? "");

  return (
    <div
      className="mt-2 flex flex-col gap-2 rounded-sm border-2 p-3"
      style={{ borderColor: "rgba(169, 52, 0, 0.25)", backgroundColor: "rgba(169, 52, 0, 0.05)" }}
    >
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide opacity-60">Nuevo concepto (opcional)</span>
        <input
          type="text"
          value={nuevoConcepto}
          onChange={(e) => setNuevoConcepto(e.target.value)}
          placeholder="Reemplazo o especie nueva…"
          className="focus-ring rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
          style={{ borderColor: "rgba(80,84,35,0.25)", color: "var(--graphite)" }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide opacity-60">Nueva cantidad (opcional)</span>
        <input
          type="number"
          min={0}
          step="any"
          value={nuevaCantidad}
          onChange={(e) => setNuevaCantidad(e.target.value)}
          placeholder={formatQty(row.cantidad)}
          className="focus-ring rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
          style={{ borderColor: "rgba(80,84,35,0.25)", color: "var(--graphite)" }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide opacity-60">Comentario / motivo</span>
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          rows={2}
          className="focus-ring resize-none rounded-sm border-2 bg-transparent px-2 py-1.5 text-sm"
          style={{ borderColor: "rgba(80,84,35,0.25)", color: "var(--graphite)" }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({ nuevoConcepto, nuevaCantidad, comentario })
          }
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
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring rounded-sm border-2 px-3 py-1.5 text-[10px] font-bold uppercase"
            style={{
              borderColor: "rgba(80,84,35,0.3)",
              color: "var(--graphite)",
              fontFamily: "var(--font-body)",
            }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}

function InsumoRowView({
  row,
  role,
  editing,
  onToggleStatus,
  onStartEdit,
  onSaveEdit,
  onDelete,
}: {
  row: InsumoRow;
  role: Role;
  editing: boolean;
  onToggleStatus: (status: "igual" | "cambio") => void;
  onStartEdit: () => void;
  onSaveEdit: (data: {
    nuevoConcepto?: string;
    nuevaCantidad?: string;
    comentario?: string;
  }) => void;
  onDelete?: () => void;
}) {
  const isCambio = row.status === "cambio";
  const canEdit = role === "macondo";

  return (
    <li
      className="border-b py-3 last:border-b-0"
      style={{ borderColor: "rgba(80, 84, 35, 0.12)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isCambio && row.nuevoConcepto ? (
            <p className="text-sm leading-snug">
              <span className="line-through opacity-50" style={{ color: "var(--graphite)" }}>
                {row.producto}
              </span>
              <span className="mx-1.5 opacity-40">→</span>
              <span style={{ color: "var(--graphite)" }}>{row.nuevoConcepto}</span>
            </p>
          ) : (
            <p className="text-sm leading-snug" style={{ color: "var(--graphite)" }}>
              {row.producto}
              {row.isAdicional && (
                <span
                  className="ml-1.5 text-[10px] font-bold uppercase"
                  style={{ color: "var(--terracotta)" }}
                >
                  · Nuevo en obra
                </span>
              )}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--primary)" }}>
            <span>
              Cant.{" "}
              {isCambio && row.nuevaCantidad != null ? (
                <>
                  <span className="line-through opacity-50">{formatQty(row.cantidad)}</span>
                  <span className="mx-1">→</span>
                  <span>{formatQty(row.nuevaCantidad)}</span>
                </>
              ) : (
                formatQty(row.cantidad)
              )}
            </span>
          </div>

          {row.comentario && !editing && (
            <p className="mt-1.5 text-xs italic opacity-70" style={{ color: "var(--graphite)" }}>
              {row.comentario}
            </p>
          )}
        </div>

        {canEdit ? (
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            {!row.isAdicional && (
              <>
                <Stamp
                  active={!isCambio}
                  label="Igual"
                  activeLabel="Igual"
                  color="growth"
                  size="sm"
                  onClick={() => onToggleStatus("igual")}
                />
                <Stamp
                  active={isCambio}
                  label="Cambio"
                  activeLabel="Cambio"
                  color="clay"
                  size="sm"
                  onClick={() => onToggleStatus("cambio")}
                />
              </>
            )}
            {isCambio && !editing && (
              <button
                type="button"
                onClick={onStartEdit}
                className="focus-ring text-[10px] uppercase tracking-wide underline-offset-2 hover:underline"
                style={{ color: "var(--primary)", fontFamily: "var(--font-body)" }}
              >
                Editar
              </button>
            )}
            {row.isAdicional && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="focus-ring text-[10px] uppercase tracking-wide"
                style={{ color: "var(--terracotta)", fontFamily: "var(--font-body)" }}
              >
                Quitar
              </button>
            )}
          </div>
        ) : (
          <span
            className="shrink-0 rounded-full border-2 px-2 py-0.5 text-[10px] font-bold uppercase"
            style={{
              borderColor: isCambio ? "var(--terracotta)" : "var(--primary)",
              color: isCambio ? "var(--terracotta)" : "var(--primary)",
              fontFamily: "var(--font-body)",
            }}
          >
            {isCambio ? "Cambio" : "Igual"}
          </span>
        )}
      </div>

      {canEdit && isCambio && editing && (
        <InsumoEditForm row={row} onSave={onSaveEdit} onCancel={() => onStartEdit()} />
      )}
    </li>
  );
}

export default function EntregaRecepcionPanel({ role }: { role: Role }) {
  const [data, setData] = useState<EntregaData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEspacio, setNewEspacio] = useState("");
  const [newProducto, setNewProducto] = useState("");
  const [newCantidad, setNewCantidad] = useState("");
  const [newComentario, setNewComentario] = useState("");
  const inFlight = useRef(false);

  const fetchData = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/entrega-recepcion", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setData({
          espacios: json.espacios,
          items: json.items,
          summary: json.summary,
        });
      }
    } catch {
      // reintento en el próximo ciclo
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga intencional al montar
    fetchData();
    const id = setInterval(fetchData, POLL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  async function postAction(body: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch("/api/entrega-recepcion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error || "No se pudo guardar");
        return false;
      }
      setData({
        espacios: json.espacios,
        items: json.items,
        summary: json.summary,
      });
      return true;
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      return false;
    }
  }

  if (!data) {
    return (
      <div
        className="flex flex-1 items-center justify-center py-16 text-sm"
        style={{ color: "rgba(235,217,153,0.5)", fontFamily: "var(--font-body)" }}
      >
        Cargando insumos…
      </div>
    );
  }

  const { espacios, items, summary } = data;
  const diffCantidad = summary.cantidadActual - summary.cantidadPlaneada;

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div
          className="rounded-sm border-2 px-3 py-2 text-sm"
          style={{ borderColor: "var(--clay)", color: "var(--clay)" }}
        >
          {error}
        </div>
      )}

      {/* Resumen */}
      <div
        className="grid grid-cols-2 gap-3 rounded-sm border-2 p-4 sm:grid-cols-4"
        style={{ borderColor: "var(--primary-light)", backgroundColor: "rgba(44, 47, 24, 0.45)" }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-wide opacity-60">Insumos</div>
          <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>
            {summary.totalItems}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide opacity-60">En cambio</div>
          <div className="text-xl font-bold" style={{ color: "var(--terracotta)" }}>
            {summary.enCambio}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide opacity-60">Cant. planeada</div>
          <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>
            {formatQty(summary.cantidadPlaneada)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wide opacity-60">Cant. actual</div>
          <div className="text-xl font-bold" style={{ color: "var(--cream)" }}>
            {formatQty(summary.cantidadActual)}
            {diffCantidad !== 0 && (
              <span
                className="ml-1 text-sm font-semibold"
                style={{ color: diffCantidad > 0 ? "var(--terracotta)" : "var(--primary-light)" }}
              >
                ({diffCantidad > 0 ? "+" : ""}
                {formatQty(diffCantidad)})
              </span>
            )}
          </div>
        </div>
      </div>

      {role === "cliente" && (
        <p className="text-center text-[11px] opacity-50" style={{ fontFamily: "var(--font-body)" }}>
          Vista de solo lectura — los cambios los registra Macondo en obra.
        </p>
      )}

      {/* Lista por espacio */}
      {espacios.map((espacio) => {
        const grupo = items.filter((i) => i.espacio === espacio);
        const cambiosEnGrupo = grupo.filter((i) => i.status === "cambio").length;
        return (
          <section
            key={espacio}
            className="rounded-sm p-4"
            style={{ backgroundColor: "var(--paper)", color: "var(--graphite)" }}
          >
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3
                className="text-base font-bold uppercase tracking-tight"
                style={{ fontFamily: "var(--font-display)", color: "var(--primary)" }}
              >
                {espacio}
              </h3>
              <span className="text-[10px] uppercase tracking-wide opacity-50">
                {grupo.length} insumos
                {cambiosEnGrupo > 0 && (
                  <span style={{ color: "var(--terracotta)" }}> · {cambiosEnGrupo} cambio(s)</span>
                )}
              </span>
            </div>
            <ul>
              {grupo.map((row) => (
                <InsumoRowView
                  key={row.id}
                  row={row}
                  role={role}
                  editing={editingId === row.id}
                  onToggleStatus={(status) => {
                    postAction({ action: "toggleStatus", id: row.id, status });
                    if (status === "cambio") setEditingId(row.id);
                    else setEditingId(null);
                  }}
                  onStartEdit={() =>
                    setEditingId(editingId === row.id ? null : row.id)
                  }
                  onSaveEdit={async (form) => {
                    const ok = await postAction({
                      action: "updateItem",
                      id: row.id,
                      status: "cambio",
                      nuevoConcepto: form.nuevoConcepto,
                      nuevaCantidad: form.nuevaCantidad,
                      comentario: form.comentario,
                    });
                    if (ok) setEditingId(null);
                  }}
                  onDelete={
                    row.isAdicional
                      ? () => postAction({ action: "deleteAdicional", id: row.id })
                      : undefined
                  }
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Insumos adicionales en espacios no listados en CSV */}
      {items
        .filter((i) => i.isAdicional && !espacios.includes(i.espacio))
        .length > 0 && (
        <section
          className="rounded-sm p-4"
          style={{ backgroundColor: "var(--paper)", color: "var(--graphite)" }}
        >
          <h3
            className="mb-3 text-base font-bold uppercase"
            style={{ color: "var(--primary)", fontFamily: "var(--font-display)" }}
          >
            Otros / nuevos en obra
          </h3>
          <ul>
            {items
              .filter((i) => i.isAdicional && !espacios.includes(i.espacio))
              .map((row) => (
                <InsumoRowView
                  key={row.id}
                  row={row}
                  role={role}
                  editing={editingId === row.id}
                  onToggleStatus={() => {}}
                  onStartEdit={() => setEditingId(row.id)}
                  onSaveEdit={async (form) => {
                    const ok = await postAction({
                      action: "updateItem",
                      id: row.id,
                      nuevoConcepto: form.nuevoConcepto,
                      nuevaCantidad: form.nuevaCantidad,
                      comentario: form.comentario,
                    });
                    if (ok) setEditingId(null);
                  }}
                  onDelete={() => postAction({ action: "deleteAdicional", id: row.id })}
                />
              ))}
          </ul>
        </section>
      )}

      {/* Agregar especie nueva (solo Macondo) */}
      {role === "macondo" && (
        <div
          className="rounded-sm border-2 p-4"
          style={{ borderColor: "var(--primary-light)", backgroundColor: "rgba(44, 47, 24, 0.35)" }}
        >
          {!showAddForm ? (
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setNewEspacio(espacios[0] ?? "");
              }}
              className="focus-ring w-full rounded-sm border-2 py-2.5 text-xs font-bold uppercase tracking-wide"
              style={{
                borderColor: "var(--cream)",
                color: "var(--cream)",
                fontFamily: "var(--font-body)",
              }}
            >
              + Agregar especie nueva en obra
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <h3
                className="text-sm font-bold uppercase"
                style={{ color: "var(--cream)", fontFamily: "var(--font-display)" }}
              >
                Nueva especie en obra
              </h3>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(235,217,153,0.6)" }}>
                  Espacio
                </span>
                <select
                  value={newEspacio}
                  onChange={(e) => setNewEspacio(e.target.value)}
                  className="focus-ring rounded-sm border-2 bg-transparent px-2 py-2 text-sm"
                  style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                >
                  {espacios.map((e) => (
                    <option key={e} value={e} style={{ color: "var(--graphite)" }}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(235,217,153,0.6)" }}>
                  Producto / especie
                </span>
                <input
                  type="text"
                  value={newProducto}
                  onChange={(e) => setNewProducto(e.target.value)}
                  className="focus-ring rounded-sm border-2 bg-transparent px-2 py-2 text-sm"
                  style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(235,217,153,0.6)" }}>
                  Cantidad
                </span>
                <input
                  type="number"
                  min={1}
                  value={newCantidad}
                  onChange={(e) => setNewCantidad(e.target.value)}
                  className="focus-ring rounded-sm border-2 bg-transparent px-2 py-2 text-sm"
                  style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide" style={{ color: "rgba(235,217,153,0.6)" }}>
                  Comentario (opcional)
                </span>
                <input
                  type="text"
                  value={newComentario}
                  onChange={(e) => setNewComentario(e.target.value)}
                  className="focus-ring rounded-sm border-2 bg-transparent px-2 py-2 text-sm"
                  style={{ borderColor: "rgba(235,217,153,0.3)", color: "var(--cream)" }}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!newProducto.trim() || !newCantidad}
                  onClick={async () => {
                    const ok = await postAction({
                      action: "addItem",
                      espacio: newEspacio,
                      producto: newProducto.trim(),
                      cantidad: newCantidad,
                      comentario: newComentario.trim() || undefined,
                    });
                    if (ok) {
                      setShowAddForm(false);
                      setNewProducto("");
                      setNewCantidad("");
                      setNewComentario("");
                    }
                  }}
                  className="focus-ring rounded-sm border-2 px-4 py-2 text-xs font-bold uppercase disabled:opacity-40"
                  style={{
                    borderColor: "var(--primary)",
                    backgroundColor: "var(--primary)",
                    color: "var(--cream)",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="focus-ring rounded-sm border-2 px-4 py-2 text-xs font-bold uppercase"
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
      )}

      <p
        className="text-center text-[11px]"
        style={{ color: "rgba(235,217,153,0.35)", fontFamily: "var(--font-body)" }}
      >
        Sincronización cada {POLL_MS / 1000}s · Entrega-Recepción Casa AE
      </p>
    </div>
  );
}
