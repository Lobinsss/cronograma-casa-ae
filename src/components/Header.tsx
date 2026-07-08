"use client";

import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";

export default function Header({
  role,
  doneTasks,
  totalTasks,
  validatedCount,
  totalValidatable,
}: {
  role: Role;
  doneTasks: number;
  totalTasks: number;
  validatedCount: number;
  totalValidatable: number;
}) {
  const router = useRouter();
  const pctDone = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <header
      className="border-b-2 px-5 py-4"
      style={{ borderColor: "var(--blue-line)", backgroundColor: "var(--ink-navy-deep)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <div>
          <div
            className="text-[11px] uppercase tracking-[0.2em]"
            style={{ color: "var(--blue-line)", fontFamily: "var(--font-body)" }}
          >
            Proyecto · Casa AE
          </div>
          <h1
            className="text-2xl font-bold uppercase tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "var(--paper)" }}
          >
            Bitácora de obra
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div
              className="text-[10px] uppercase tracking-wide"
              style={{ color: "rgba(235,217,153,0.5)", fontFamily: "var(--font-body)" }}
            >
              Avance de obra
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 w-24 overflow-hidden rounded-full"
                style={{ backgroundColor: "rgba(235,217,153,0.2)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pctDone}%`, backgroundColor: "var(--growth)" }}
                />
              </div>
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-body)", color: "var(--paper)" }}
              >
                {doneTasks}/{totalTasks}
              </span>
            </div>
            {totalValidatable > 0 && (
              <div
                className="mt-0.5 text-[10px]"
                style={{ color: "var(--cream)", fontFamily: "var(--font-body)" }}
              >
                Validado por cliente: {validatedCount}/{totalValidatable}
              </div>
            )}
          </div>

          <div
            className="rounded-sm border-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
            style={{
              borderColor: role === "macondo" ? "var(--cream)" : "var(--terracotta)",
              color: role === "macondo" ? "var(--cream)" : "var(--terracotta)",
              fontFamily: "var(--font-body)",
            }}
          >
            {role === "macondo" ? "Macondo" : "Cliente"}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="focus-ring text-xs underline-offset-2 hover:underline"
            style={{ color: "rgba(235,217,153,0.5)", fontFamily: "var(--font-body)" }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
