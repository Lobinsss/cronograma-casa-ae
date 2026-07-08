"use client";

import { MILESTONES } from "@/lib/schedule";
import { formatLong } from "@/lib/dateUtils";
import type { FullState, Role } from "@/lib/types";
import Stamp from "./Stamp";

export default function MilestonesTrack({
  state,
  role,
  onToggle,
}: {
  state: FullState;
  role: Role;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className="rounded-sm border-2 p-5"
      style={{ borderColor: "var(--gold-stamp)", backgroundColor: "rgba(13,25,48,0.6)" }}
    >
      <div className="mb-1 flex items-baseline justify-between">
        <h2
          className="text-xl font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--paper)" }}
        >
          Garantía y mantenimiento
        </h2>
      </div>
      <p
        className="mb-4 text-[11px]"
        style={{ color: "rgba(243,240,230,0.5)", fontFamily: "var(--font-mono)" }}
      >
        Una visita mensual por 3 meses a partir de la entrega de obra. Fechas ajustadas a días
        hábiles, excluyendo festivos oficiales.
      </p>

      <div className="flex flex-col gap-3">
        {MILESTONES.map((m, i) => {
          const st = state.milestones[m.id];
          return (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-b-0 last:pb-0"
              style={{ borderColor: "rgba(243,240,230,0.1)" }}
            >
              <div>
                <div
                  className="text-[10px] uppercase tracking-widest"
                  style={{ color: "var(--gold-stamp)", fontFamily: "var(--font-mono)" }}
                >
                  Visita {i + 1} de 3
                </div>
                <div className="text-sm" style={{ color: "var(--paper)" }}>
                  {formatLong(m.date)}
                </div>
              </div>
              <Stamp
                active={!!st?.done}
                label="Marcar realizada"
                activeLabel="Realizada"
                color="growth"
                disabled={role !== "macondo"}
                onClick={() => onToggle(m.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
