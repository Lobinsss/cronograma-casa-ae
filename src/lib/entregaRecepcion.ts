import { loadInsumos, espaciosOrdenados } from "@/lib/insumos";
import type {
  EntregaRecepcionState,
  InsumoEditable,
  InsumoRow,
  EntregaSummary,
} from "@/lib/types";

export function emptyEntregaState(): EntregaRecepcionState {
  return { items: {}, adicionales: [] };
}

function defaultEditable(
  id: string,
  preMarked: boolean,
  notaCsv?: string,
  stored?: InsumoEditable
): InsumoEditable {
  if (stored) return stored;
  if (preMarked) {
    return { status: "cambio", comentario: notaCsv };
  }
  return { status: "igual" };
}

export function buildEntregaView(stored: EntregaRecepcionState): {
  espacios: string[];
  items: InsumoRow[];
  summary: EntregaSummary;
} {
  const base = loadInsumos();
  const espacios = espaciosOrdenados(base);
  const rows: InsumoRow[] = [];

  for (const b of base) {
    const edit = defaultEditable(b.id, b.preMarkedCambio, b.notaCsv, stored.items[b.id]);
    rows.push({
      id: b.id,
      espacio: b.espacio,
      producto: b.producto,
      cantidad: b.cantidad,
      status: edit.status,
      nuevoConcepto: edit.nuevoConcepto,
      nuevaCantidad: edit.nuevaCantidad,
      comentario: edit.comentario,
      isAdicional: false,
      preMarked: b.preMarkedCambio,
    });
  }

  for (const a of stored.adicionales) {
    rows.push({
      id: a.id,
      espacio: a.espacio,
      producto: a.producto,
      cantidad: a.cantidad,
      status: "cambio",
      comentario: a.comentario,
      isAdicional: true,
      preMarked: false,
    });
  }

  let enCambio = 0;
  let cantidadPlaneada = 0;
  let cantidadActual = 0;

  for (const r of rows) {
    cantidadPlaneada += r.cantidad;
    if (r.status === "cambio") {
      enCambio++;
      cantidadActual += r.nuevaCantidad ?? r.cantidad;
    } else {
      cantidadActual += r.cantidad;
    }
  }

  return {
    espacios,
    items: rows,
    summary: {
      totalItems: rows.length,
      enCambio,
      cantidadPlaneada,
      cantidadActual,
    },
  };
}