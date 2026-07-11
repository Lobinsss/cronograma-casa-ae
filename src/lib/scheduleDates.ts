import { STAGES, type Stage } from "@/lib/schedule";
import type { ScheduleDatesState, ScheduleStageView, ScheduleView } from "@/lib/types";

export function emptyScheduleDatesState(): ScheduleDatesState {
  return { overrides: {}, history: [] };
}

export function getMergedStages(
  overrides: Record<string, { start: string; end: string }>
): ScheduleStageView[] {
  return STAGES.map((s) => ({
    id: s.id,
    name: s.name,
    shortLabel: s.shortLabel,
    start: overrides[s.id]?.start ?? s.start,
    end: overrides[s.id]?.end ?? s.end,
    accent: s.accent,
  }));
}

export function getRangeBounds(stages: Pick<Stage, "start" | "end">[]): {
  rangeStart: string;
  rangeEnd: string;
} {
  if (stages.length === 0) {
    return { rangeStart: "2026-07-06", rangeEnd: "2026-07-29" };
  }
  let rangeStart = stages[0].start;
  let rangeEnd = stages[0].end;
  for (const s of stages) {
    if (s.start < rangeStart) rangeStart = s.start;
    if (s.end > rangeEnd) rangeEnd = s.end;
  }
  return { rangeStart, rangeEnd };
}

export function buildScheduleView(stored: ScheduleDatesState): ScheduleView {
  const stages = getMergedStages(stored.overrides);
  const { rangeStart, rangeEnd } = getRangeBounds(stages);
  return {
    stages,
    rangeStart,
    rangeEnd,
    history: [...stored.history].sort(
      (a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
    ),
  };
}

export function findStageDefault(stageId: string): Stage | undefined {
  return STAGES.find((s) => s.id === stageId);
}
