"use client";

import type { DashboardTab } from "@/lib/types";

export default function DashboardTabs({
  active,
  onChange,
}: {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  const tabs: { id: DashboardTab; label: string }[] = [
    { id: "cronograma", label: "Cronograma" },
    { id: "planos", label: "Planos" },
    { id: "entrega", label: "Entrega-Recepción" },
  ];

  return (
    <nav
      className="flex gap-1 border-b-2 px-5"
      style={{ borderColor: "var(--primary-light)", backgroundColor: "var(--primary-deeper)" }}
      aria-label="Secciones de la bitácora"
    >
      <div className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className="focus-ring -mb-0.5 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors"
            style={{
              fontFamily: "var(--font-body)",
              borderColor: active === tab.id ? "var(--cream)" : "transparent",
              color: active === tab.id ? "var(--cream)" : "rgba(235,217,153,0.55)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
