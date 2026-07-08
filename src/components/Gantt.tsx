"use client";

import { STAGES } from "@/lib/schedule";
import { parseISO, daysBetween, formatShort, todayISO } from "@/lib/dateUtils";
import type { FullState } from "@/lib/types";

const RANGE_START = "2026-07-06";
const RANGE_END = "2026-07-29";
const TOTAL_DAYS = daysBetween(RANGE_START, RANGE_END) + 1;

function pct(days: number) {
  return (days / TOTAL_DAYS) * 100;
}

function stageProgress(stageId: string, state: FullState): number {
  const stage = STAGES.find((s) => s.id === stageId)!;
  const total = stage.tasks.length;
  const done = stage.tasks.filter((t) => state.tasks[t.id]?.done).length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export default function Gantt({ state }: { state: FullState }) {
  const today = todayISO();
  const showToday = today >= RANGE_START && today <= RANGE_END;
  const todayOffset = showToday ? daysBetween(RANGE_START, today) : 0;

  // Marcas de semana para la regla superior
  const weekTicks: { offset: number; label: string }[] = [];
  for (let i = 0; i <= TOTAL_DAYS; i += 7) {
    const d = new Date(parseISO(RANGE_START).getTime() + i * 86400000);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    weekTicks.push({ offset: i, label: formatShort(iso) });
  }

  return (
    <div
      className="rounded-sm border-2 p-5"
      style={{ borderColor: "var(--blue-line)", backgroundColor: "rgba(13,25,48,0.6)" }}
    >
      <div className="mb-4 flex items-baseline justify-between">
        <h2
          className="text-xl font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--paper)" }}
        >
          Cronograma · Obra
        </h2>
        <span
          className="text-[11px] uppercase tracking-widest"
          style={{ color: "var(--blue-line)", fontFamily: "var(--font-mono)" }}
        >
          {formatShort(RANGE_START)} — {formatShort(RANGE_END)} 2026
        </span>
      </div>

      {/* Regla de semanas */}
      <div className="relative mb-2 h-5 border-b" style={{ borderColor: "rgba(111,168,199,0.3)" }}>
        {weekTicks.map((t) => (
          <div
            key={t.offset}
            className="absolute top-0 text-[10px]"
            style={{
              left: `${pct(t.offset)}%`,
              color: "rgba(243,240,230,0.5)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Filas de etapas */}
      <div className="relative flex flex-col gap-4 py-2">
        {showToday && (
          <div
            className="absolute top-0 bottom-0 w-px z-10"
            style={{ left: `${pct(todayOffset)}%`, backgroundColor: "var(--clay)" }}
          >
            <div
              className="absolute -top-2 -translate-x-1/2 text-[9px] uppercase whitespace-nowrap"
              style={{ color: "var(--clay)", fontFamily: "var(--font-mono)" }}
            >
              hoy
            </div>
          </div>
        )}

        {STAGES.map((stage) => {
          const offset = daysBetween(RANGE_START, stage.start);
          const length = daysBetween(stage.start, stage.end) + 1;
          const progress = stageProgress(stage.id, state);
          return (
            <div key={stage.id} className="flex items-center gap-3">
              <div
                className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wide"
                style={{ color: stage.accent, fontFamily: "var(--font-mono)" }}
              >
                {stage.shortLabel}
              </div>
              <div className="relative h-8 flex-1 rounded-sm" style={{ backgroundColor: "rgba(243,240,230,0.05)" }}>
                <div
                  className="absolute top-0 h-full rounded-sm border-2"
                  style={{
                    left: `${pct(offset)}%`,
                    width: `${pct(length)}%`,
                    borderColor: stage.accent,
                    backgroundColor: "rgba(0,0,0,0.15)",
                  }}
                >
                  <div
                    className="h-full rounded-[1px] transition-all"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: stage.accent,
                      opacity: 0.55,
                    }}
                  />
                </div>
              </div>
              <div
                className="w-10 shrink-0 text-right text-xs"
                style={{ fontFamily: "var(--font-mono)", color: "rgba(243,240,230,0.6)" }}
              >
                {progress}%
              </div>
            </div>
          );
        })}
      </div>

      <p
        className="mt-4 text-[11px] leading-relaxed"
        style={{ color: "rgba(243,240,230,0.45)", fontFamily: "var(--font-mono)" }}
      >
        Las etapas corren en paralelo por diseño: riego, suministro y plantación se traslapan
        durante la obra.
      </p>
    </div>
  );
}
