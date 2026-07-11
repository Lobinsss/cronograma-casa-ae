"use client";

import { STAGES } from "@/lib/schedule";
import { formatShort } from "@/lib/dateUtils";
import type { FullState, Role, ScheduleStageView } from "@/lib/types";
import Stamp from "./Stamp";

export default function ChecklistPanel({
  stages,
  state,
  role,
  onToggleDone,
  onTogglePago,
  onToggleValidated,
}: {
  stages: ScheduleStageView[];
  state: FullState;
  role: Role;
  onToggleDone: (id: string) => void;
  onTogglePago: (id: string) => void;
  onToggleValidated: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      {stages.map((stage) => {
        const stageTasks = STAGES.find((s) => s.id === stage.id)?.tasks ?? [];
        return (
        <div
          key={stage.id}
          className="rounded-sm p-4"
          style={{ backgroundColor: "var(--paper)", color: "var(--graphite)" }}
        >
          <div className="mb-3 flex items-baseline justify-between">
            <h3
              className="text-lg font-bold uppercase tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: stage.accent }}
            >
              {stage.name}
            </h3>
            <span
              className="text-[10px] uppercase tracking-wide opacity-60"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {formatShort(stage.start)} – {formatShort(stage.end)}
            </span>
          </div>

          <ul className="flex flex-col gap-2.5">
            {stageTasks.map((task) => {
              const st = state.tasks[task.id];
              const canValidate =
                task.requiresClientValidation &&
                !!st?.done &&
                (!task.requiresPayment || !!st?.pagoConfirmado);
              return (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 last:border-b-0 last:pb-0"
                  style={{ borderColor: "rgba(80, 84, 35, 0.15)" }}
                >
                  <span className={`text-sm ${st?.done ? "line-through opacity-50" : ""}`}>
                    {task.label}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {task.requiresPayment && (
                      <Stamp
                        active={!!st?.pagoConfirmado}
                        label="90% pago"
                        activeLabel="Pago OK"
                        color="clay"
                        size="sm"
                        disabled={role !== "macondo"}
                        onClick={() => onTogglePago(task.id)}
                      />
                    )}
                    <Stamp
                      active={!!st?.done}
                      label="Marcar hecho"
                      activeLabel="Hecho"
                      color="growth"
                      size="sm"
                      disabled={role !== "macondo"}
                      onClick={() => onToggleDone(task.id)}
                    />
                    {task.requiresClientValidation && (
                      <Stamp
                        active={!!st?.validated}
                        label="Validar"
                        activeLabel="Validado"
                        color="gold"
                        size="sm"
                        disabled={role !== "cliente" || !canValidate}
                        onClick={() => onToggleValidated(task.id)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </div>
  );
}
