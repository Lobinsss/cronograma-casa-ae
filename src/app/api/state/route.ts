import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { kvGet, kvSet } from "@/lib/redis";
import { allTaskIds, allMilestoneIds, findTask } from "@/lib/schedule";
import type { TaskState, MilestoneState, FullState } from "@/lib/types";

const STATE_KEY = "casaae:cronograma:state:v1";

function emptyTaskState(): TaskState {
  return { done: false, validated: false };
}

function emptyMilestoneState(): MilestoneState {
  return { done: false };
}

async function loadState(): Promise<FullState> {
  const stored = await kvGet<FullState>(STATE_KEY);
  const tasks: Record<string, TaskState> = {};
  const milestones: Record<string, MilestoneState> = {};

  for (const id of allTaskIds()) {
    tasks[id] = stored?.tasks?.[id] ?? emptyTaskState();
  }
  for (const id of allMilestoneIds()) {
    milestones[id] = stored?.milestones?.[id] ?? emptyMilestoneState();
  }
  return { tasks, milestones };
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
  const kind = body?.kind as "task" | "milestone" | undefined;
  const id = body?.id as string | undefined;
  const action = body?.action as
    | "toggleDone"
    | "toggleValidated"
    | "togglePago"
    | undefined;

  if (!kind || !id || !action) {
    return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
  }

  const state = await loadState();
  const now = new Date().toISOString();

  if (kind === "milestone") {
    if (role !== "macondo") {
      return NextResponse.json(
        { ok: false, error: "Solo Macondo puede marcar visitas de mantenimiento" },
        { status: 403 }
      );
    }
    if (!state.milestones[id]) {
      return NextResponse.json({ ok: false, error: "Visita no encontrada" }, { status: 404 });
    }
    if (action !== "toggleDone") {
      return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
    }
    const current = state.milestones[id];
    const nextDone = !current.done;
    state.milestones[id] = {
      done: nextDone,
      doneAt: nextDone ? now : undefined,
    };
    await kvSet(STATE_KEY, state);
    return NextResponse.json({ ok: true, ...state });
  }

  // kind === "task"
  const found = findTask(id);
  if (!found || !state.tasks[id]) {
    return NextResponse.json({ ok: false, error: "Tarea no encontrada" }, { status: 404 });
  }
  const { task } = found;
  const current = state.tasks[id];

  if (action === "toggleDone") {
    if (role !== "macondo") {
      return NextResponse.json(
        { ok: false, error: "Solo Macondo puede marcar el avance físico" },
        { status: 403 }
      );
    }
    const nextDone = !current.done;
    state.tasks[id] = {
      ...current,
      done: nextDone,
      doneAt: nextDone ? now : undefined,
      // Si Macondo desmarca la tarea, se retira también la validación del
      // cliente para mantener la consistencia del flujo de aprobación.
      validated: nextDone ? current.validated : false,
      validatedAt: nextDone ? current.validatedAt : undefined,
    };
  } else if (action === "togglePago") {
    if (role !== "macondo") {
      return NextResponse.json(
        { ok: false, error: "Solo Macondo puede registrar el pago" },
        { status: 403 }
      );
    }
    if (!task.requiresPayment) {
      return NextResponse.json({ ok: false, error: "Esta tarea no requiere pago" }, { status: 400 });
    }
    const nextPago = !current.pagoConfirmado;
    state.tasks[id] = {
      ...current,
      pagoConfirmado: nextPago,
      pagoAt: nextPago ? now : undefined,
    };
  } else if (action === "toggleValidated") {
    if (role !== "cliente") {
      return NextResponse.json(
        { ok: false, error: "Solo el cliente puede validar esta tarea" },
        { status: 403 }
      );
    }
    if (!task.requiresClientValidation) {
      return NextResponse.json(
        { ok: false, error: "Esta tarea no requiere validación de cliente" },
        { status: 400 }
      );
    }
    if (!current.done) {
      return NextResponse.json(
        { ok: false, error: "Macondo debe marcar la tarea como hecha antes de validar" },
        { status: 400 }
      );
    }
    if (task.requiresPayment && !current.pagoConfirmado) {
      return NextResponse.json(
        { ok: false, error: "Falta registrar el 90% de pago antes de validar la entrega" },
        { status: 400 }
      );
    }
    const nextValidated = !current.validated;
    state.tasks[id] = {
      ...current,
      validated: nextValidated,
      validatedAt: nextValidated ? now : undefined,
    };
  } else {
    return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
  }

  await kvSet(STATE_KEY, state);
  return NextResponse.json({ ok: true, ...state });
}
