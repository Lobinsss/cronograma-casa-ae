"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { STAGES } from "@/lib/schedule";
import type { FullState, Role } from "@/lib/types";
import Header from "./Header";
import Gantt from "./Gantt";
import ChecklistPanel from "./ChecklistPanel";
import MilestonesTrack from "./MilestonesTrack";

const POLL_MS = 6000;

export default function Dashboard({ role }: { role: Role }) {
  const [state, setState] = useState<FullState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const fetchState = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setState({ tasks: data.tasks, milestones: data.milestones });
      }
    } catch {
      // silencioso — se reintenta en el próximo ciclo de polling
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    // Carga inicial + sondeo periódico del estado compartido en Redis.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga de datos intencional al montar
    fetchState();
    const id = setInterval(fetchState, POLL_MS);
    return () => clearInterval(id);
  }, [fetchState]);

  async function sendAction(kind: "task" | "milestone", id: string, action: string) {
    setError(null);
    try {
      const res = await fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, action }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo actualizar");
        return;
      }
      setState({ tasks: data.tasks, milestones: data.milestones });
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    }
  }

  if (!state) {
    return (
      <div
        className="flex flex-1 items-center justify-center text-sm"
        style={{ color: "rgba(243,240,230,0.5)", fontFamily: "var(--font-mono)" }}
      >
        Cargando bitácora…
      </div>
    );
  }

  const allTasks = STAGES.flatMap((s) => s.tasks);
  const doneTasks = allTasks.filter((t) => state.tasks[t.id]?.done).length;
  const validatable = allTasks.filter((t) => t.requiresClientValidation);
  const validatedCount = validatable.filter((t) => state.tasks[t.id]?.validated).length;

  return (
    <>
      <Header
        role={role}
        doneTasks={doneTasks}
        totalTasks={allTasks.length}
        validatedCount={validatedCount}
        totalValidatable={validatable.length}
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-5 py-6">
        {error && (
          <div
            className="rounded-sm border-2 px-3 py-2 text-sm"
            style={{ borderColor: "var(--clay)", color: "var(--clay)" }}
          >
            {error}
          </div>
        )}

        <Gantt state={state} />

        <ChecklistPanel
          state={state}
          role={role}
          onToggleDone={(id) => sendAction("task", id, "toggleDone")}
          onTogglePago={(id) => sendAction("task", id, "togglePago")}
          onToggleValidated={(id) => sendAction("task", id, "toggleValidated")}
        />

        <MilestonesTrack
          state={state}
          role={role}
          onToggle={(id) => sendAction("milestone", id, "toggleDone")}
        />

        <p
          className="pb-4 text-center text-[11px]"
          style={{ color: "rgba(243,240,230,0.35)", fontFamily: "var(--font-mono)" }}
        >
          Sincronización cada {POLL_MS / 1000}s · Casa AE 2026
        </p>
      </main>
    </>
  );
}
