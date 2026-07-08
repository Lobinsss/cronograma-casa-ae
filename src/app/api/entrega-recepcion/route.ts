import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { kvGet, kvSet } from "@/lib/redis";
import { findInsumo } from "@/lib/insumos";
import { buildEntregaView, emptyEntregaState } from "@/lib/entregaRecepcion";
import type { EntregaRecepcionState, InsumoEditable } from "@/lib/types";
import crypto from "crypto";

const ENTREGA_KEY = "casaae:entrega-recepcion:state:v1";

async function loadStored(): Promise<EntregaRecepcionState> {
  const stored = await kvGet<EntregaRecepcionState>(ENTREGA_KEY);
  return {
    items: stored?.items ?? {},
    adicionales: stored?.adicionales ?? [],
  };
}

export async function GET() {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const stored = await loadStored();
  const view = buildEntregaView(stored);
  return NextResponse.json({ ok: true, role, ...view });
}

export async function POST(req: NextRequest) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  if (role !== "macondo") {
    return NextResponse.json(
      { ok: false, error: "Solo Macondo puede editar la entrega-recepción" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (!action) {
    return NextResponse.json({ ok: false, error: "Acción requerida" }, { status: 400 });
  }

  const stored = await loadStored();

  if (action === "updateItem") {
    const id = body?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });
    }

    const isAdicional = stored.adicionales.some((a) => a.id === id);
    const isBase = !!findInsumo(id);
    if (!isAdicional && !isBase) {
      return NextResponse.json({ ok: false, error: "Insumo no encontrado" }, { status: 404 });
    }

    const status = body?.status as "igual" | "cambio" | undefined;
    const nuevoConcepto = (body?.nuevoConcepto as string | undefined)?.trim() || undefined;
    const nuevaCantidadRaw = body?.nuevaCantidad;
    const nuevaCantidad =
      nuevaCantidadRaw === "" || nuevaCantidadRaw == null
        ? undefined
        : Number(nuevaCantidadRaw);
    const comentario = (body?.comentario as string | undefined)?.trim() || undefined;

    if (status && status !== "igual" && status !== "cambio") {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }
    if (nuevaCantidad !== undefined && (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 0)) {
      return NextResponse.json({ ok: false, error: "Cantidad inválida" }, { status: 400 });
    }

    if (isAdicional) {
      stored.adicionales = stored.adicionales.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          producto: nuevoConcepto ?? a.producto,
          cantidad: nuevaCantidad ?? a.cantidad,
          comentario: comentario ?? a.comentario,
        };
      });
    } else {
      const prev: InsumoEditable = stored.items[id] ?? { status: "igual" };
      stored.items[id] = {
        status: status ?? prev.status,
        nuevoConcepto: nuevoConcepto ?? prev.nuevoConcepto,
        nuevaCantidad: nuevaCantidad ?? prev.nuevaCantidad,
        comentario: comentario ?? prev.comentario,
      };
    }

    await kvSet(ENTREGA_KEY, stored);
    const view = buildEntregaView(stored);
    return NextResponse.json({ ok: true, ...view });
  }

  if (action === "toggleStatus") {
    const id = body?.id as string | undefined;
    const status = body?.status as "igual" | "cambio" | undefined;
    if (!id || !status) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const isAdicional = stored.adicionales.some((a) => a.id === id);
    if (isAdicional) {
      return NextResponse.json(
        { ok: false, error: "Los insumos nuevos siempre quedan en cambio" },
        { status: 400 }
      );
    }
    if (!findInsumo(id)) {
      return NextResponse.json({ ok: false, error: "Insumo no encontrado" }, { status: 404 });
    }

    const prev = stored.items[id] ?? { status: "igual" };
    stored.items[id] = { ...prev, status };
    await kvSet(ENTREGA_KEY, stored);
    const view = buildEntregaView(stored);
    return NextResponse.json({ ok: true, ...view });
  }

  if (action === "addItem") {
    const espacio = (body?.espacio as string | undefined)?.trim();
    const producto = (body?.producto as string | undefined)?.trim();
    const cantidad = Number(body?.cantidad);
    const comentario = (body?.comentario as string | undefined)?.trim() || undefined;

    if (!espacio || !producto) {
      return NextResponse.json({ ok: false, error: "Espacio y producto requeridos" }, { status: 400 });
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return NextResponse.json({ ok: false, error: "Cantidad inválida" }, { status: 400 });
    }

    stored.adicionales.push({
      id: `add-${crypto.randomUUID()}`,
      espacio,
      producto,
      cantidad,
      comentario,
      addedAt: new Date().toISOString(),
    });

    await kvSet(ENTREGA_KEY, stored);
    const view = buildEntregaView(stored);
    return NextResponse.json({ ok: true, ...view });
  }

  if (action === "deleteAdicional") {
    const id = body?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID requerido" }, { status: 400 });
    }
    const before = stored.adicionales.length;
    stored.adicionales = stored.adicionales.filter((a) => a.id !== id);
    if (stored.adicionales.length === before) {
      return NextResponse.json({ ok: false, error: "Insumo adicional no encontrado" }, { status: 404 });
    }
    await kvSet(ENTREGA_KEY, stored);
    const view = buildEntregaView(stored);
    return NextResponse.json({ ok: true, ...view });
  }

  return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
}
