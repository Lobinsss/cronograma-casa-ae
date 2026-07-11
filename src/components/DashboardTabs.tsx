"use client";

import { useEffect, useRef, useState } from "react";
import type { DashboardTab } from "@/lib/types";

const TABS: { id: DashboardTab; label: string; shortLabel: string }[] = [
  { id: "cronograma", label: "Cronograma", shortLabel: "Cronograma" },
  { id: "planos", label: "Planos", shortLabel: "Planos" },
  { id: "entrega", label: "Entrega-Recepción", shortLabel: "Entrega" },
];

export default function DashboardTabs({
  active,
  onChange,
}: {
  active: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeTab = TABS.find((t) => t.id === active)!;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  function selectTab(id: DashboardTab) {
    onChange(id);
    setMenuOpen(false);
  }

  const tabButtonClass =
    "focus-ring -mb-0.5 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors whitespace-nowrap";

  return (
    <nav
      className="relative border-b-2"
      style={{ borderColor: "var(--primary-light)", backgroundColor: "var(--primary-deeper)" }}
      aria-label="Secciones de la bitácora"
    >
      {/* Móvil: menú hamburguesa */}
      <div ref={menuRef} className="relative mx-auto max-w-5xl md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Abrir menú de secciones"
            onClick={() => setMenuOpen((o) => !o)}
            className="focus-ring flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-sm border-2"
            style={{ borderColor: "rgba(235,217,153,0.35)", color: "var(--cream)" }}
          >
            <span
              className="block h-0.5 w-5 rounded-full transition-transform"
              style={{
                backgroundColor: "var(--cream)",
                transform: menuOpen ? "translateY(4px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block h-0.5 w-5 rounded-full transition-opacity"
              style={{ backgroundColor: "var(--cream)", opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block h-0.5 w-5 rounded-full transition-transform"
              style={{
                backgroundColor: "var(--cream)",
                transform: menuOpen ? "translateY(-4px) rotate(-45deg)" : "none",
              }}
            />
          </button>
          <span
            className="text-xs font-bold uppercase tracking-wide"
            style={{ color: "var(--cream)", fontFamily: "var(--font-body)" }}
          >
            {activeTab.shortLabel}
          </span>
          <div className="w-10" />
        </div>

        {menuOpen && (
          <div
            className="absolute left-4 right-4 top-full z-30 flex flex-col rounded-sm border-2 py-1 shadow-lg"
            style={{
              borderColor: "var(--primary-light)",
              backgroundColor: "var(--primary-deeper)",
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className="focus-ring px-4 py-3 text-left text-xs font-bold uppercase tracking-wide"
                style={{
                  fontFamily: "var(--font-body)",
                  color: active === tab.id ? "var(--cream)" : "rgba(235,217,153,0.65)",
                  backgroundColor:
                    active === tab.id ? "rgba(235,217,153,0.1)" : "transparent",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Escritorio: pestañas sin scroll */}
      <div className="mx-auto hidden max-w-5xl flex-wrap justify-center gap-1 px-5 md:flex">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => selectTab(tab.id)}
            className={tabButtonClass}
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
