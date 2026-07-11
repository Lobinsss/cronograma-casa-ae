import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { kvGet, kvSet } from "@/lib/redis";
import {
  buildScheduleView,
  emptyScheduleDatesState,
  findStageDefault,
  getMergedStages,
} from "@/lib/scheduleDates";
import type { StageDateChange } from "@/lib/types";
import crypto from "crypto";

const SCHEDULE_KEY = "casaae:cronograma:dates:v1";

async function loadStored() {
  const stored = await kvGet<ReturnType<typeof emptyScheduleDatesState>>(SCHEDULE_KEY);
  return {
    overrides: stored?.overrides ?? {},
    history: stored?.history ?? [],
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }
  const stored = await loadStored();
  const view = buildScheduleView(stored);
  return NextResponse.json({ ok: true, role, ...view });
}

export async function POST(req: NextRequest) {
  const role = await getRole();
  if (!role) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  if (role !== "macondo") {
    return NextResponse.json(
      { ok: false, error: "Solo Macondo puede modificar las fechas del cronograma" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as string | undefined;

  if (action !== "updateStageDates") {
    return NextResponse.json({ ok: false, error: "Acción inválida" }, { status: 400 });
  }

  const stageId = body?.stageId as string | undefined;
  const start = body?.start as string | undefined;
  const end = body?.end as string | undefined;
  const note = (body?.note as string | undefined)?.trim() || undefined;

  if (!stageId || !start || !end) {
    return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });
  }
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) {
    return NextResponse.json({ ok: false, error: "Formato de fecha inválido (AAAA-MM-DD)" }, { status: 400 });
  }
  if (start > end) {
    return NextResponse.json({ ok: false, error: "La fecha de inicio debe ser anterior al fin" }, { status: 400 });
  }

  const def = findStageDefault(stageId);
  if (!def) {
    return NextResponse.json({ ok: false, error: "Etapa no encontrada" }, { status: 404 });
  }

  const stored = await loadStored();
  const current = getMergedStages(stored.overrides).find((s) => s.id === stageId)!;

  if (current.start === start && current.end === end) {
    return NextResponse.json({ ok: false, error: "Sin cambios respecto a las fechas actuales" }, { status: 400 });
  }

  const entry: StageDateChange = {
    id: crypto.randomUUID(),
    stageId,
    stageName: def.name,
    prevStart: current.start,
    prevEnd: current.end,
    newStart: start,
    newEnd: end,
    author: role,
    changedAt: new Date().toISOString(),
    note,
  };

  stored.overrides[stageId] = { start, end };
  stored.history.push(entry);

  await kvSet(SCHEDULE_KEY, stored);
  const view = buildScheduleView(stored);
  return NextResponse.json({ ok: true, ...view });
}
