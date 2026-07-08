import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { kvGet, kvSet } from "@/lib/redis";
import { findPlan } from "@/lib/planos";
import type { PlanosState, PlanPin, PlanGeneralComment, CommentReply } from "@/lib/types";
import crypto from "crypto";

const PLANOS_KEY = "casaae:planos:state:v1";

function emptyState(): PlanosState {
  return { pins: [], generalComments: [] };
}

async function loadState(): Promise<PlanosState> {
  const stored = await kvGet<PlanosState>(PLANOS_KEY);
  return {
    pins: stored?.pins ?? [],
    generalComments: stored?.generalComments ?? [],
  };
}

function newId(): string {
  return crypto.randomUUID();
}

export async function GET() {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  const state = await loadState();
  return NextResponse.json({ ok: true, role, ...state });
}

export async function POST(req: NextRequest) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (!action) {
    return NextResponse.json({ ok: false, error: "Acción requerida" }, { status: 400 });
  }

  const state = await loadState();
  const now = new Date().toISOString();

  if (action === "addPin") {
    const planId = body?.planId as string | undefined;
    const page = Number(body?.page);
    const x = Number(body?.x);
    const y = Number(body?.y);
    const text = (body?.text as string | undefined)?.trim();

    if (!planId || !findPlan(planId) || !Number.isFinite(page) || page < 1) {
      return NextResponse.json({ ok: false, error: "Plano o página inválidos" }, { status: 400 });
    }
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) {
      return NextResponse.json({ ok: false, error: "Coordenadas inválidas" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ ok: false, error: "El comentario no puede estar vacío" }, { status: 400 });
    }

    const pin: PlanPin = {
      id: newId(),
      planId,
      page,
      x,
      y,
      author: role,
      text,
      createdAt: now,
      resolved: false,
      replies: [],
    };
    state.pins.push(pin);
    await kvSet(PLANOS_KEY, state);
    return NextResponse.json({ ok: true, ...state });
  }

  if (action === "addGeneralComment") {
    const planId = body?.planId as string | undefined;
    const page = Number(body?.page);
    const text = (body?.text as string | undefined)?.trim();

    if (!planId || !findPlan(planId) || !Number.isFinite(page) || page < 1) {
      return NextResponse.json({ ok: false, error: "Plano o página inválidos" }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ ok: false, error: "El comentario no puede estar vacío" }, { status: 400 });
    }

    const comment: PlanGeneralComment = {
      id: newId(),
      planId,
      page,
      author: role,
      text,
      createdAt: now,
      replies: [],
    };
    state.generalComments.push(comment);
    await kvSet(PLANOS_KEY, state);
    return NextResponse.json({ ok: true, ...state });
  }

  if (action === "addReply") {
    const targetType = body?.targetType as "pin" | "general" | undefined;
    const targetId = body?.targetId as string | undefined;
    const text = (body?.text as string | undefined)?.trim();

    if (!targetType || !targetId || !text) {
      return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
    }

    const reply: CommentReply = {
      id: newId(),
      author: role,
      text,
      createdAt: now,
    };

    if (targetType === "pin") {
      const pin = state.pins.find((p) => p.id === targetId);
      if (!pin) {
        return NextResponse.json({ ok: false, error: "Pin no encontrado" }, { status: 404 });
      }
      pin.replies.push(reply);
    } else if (targetType === "general") {
      const comment = state.generalComments.find((c) => c.id === targetId);
      if (!comment) {
        return NextResponse.json({ ok: false, error: "Comentario no encontrado" }, { status: 404 });
      }
      comment.replies.push(reply);
    } else {
      return NextResponse.json({ ok: false, error: "Tipo de destino inválido" }, { status: 400 });
    }

    await kvSet(PLANOS_KEY, state);
    return NextResponse.json({ ok: true, ...state });
  }

  if (action === "togglePinResolved") {
    const pinId = body?.pinId as string | undefined;
    if (!pinId) {
      return NextResponse.json({ ok: false, error: "Pin requerido" }, { status: 400 });
    }
    const pin = state.pins.find((p) => p.id === pinId);
    if (!pin) {
      return NextResponse.json({ ok: false, error: "Pin no encontrado" }, { status: 404 });
    }
    pin.resolved = !pin.resolved;
    await kvSet(PLANOS_KEY, state);
    return NextResponse.json({ ok: true, ...state });
  }

  return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
}
