"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RoleChoice = "macondo" | "cliente";

export default function LoginGate() {
  const router = useRouter();
  const [role, setRole] = useState<RoleChoice>("macondo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full max-w-sm rounded-sm border-2 p-8"
        style={{
          borderColor: "var(--blue-line)",
          backgroundColor: "var(--ink-navy-deep)",
        }}
      >
        <div
          className="mb-1 text-[11px] uppercase tracking-[0.2em]"
          style={{ color: "var(--blue-line)", fontFamily: "var(--font-body)" }}
        >
          Proyecto · Casa AE
        </div>
        <h1
          className="mb-6 text-3xl font-bold uppercase tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "var(--paper)" }}
        >
          Bitácora de obra
        </h1>

        <div className="mb-5 grid grid-cols-2 gap-2">
          {(["macondo", "cliente"] as RoleChoice[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="focus-ring rounded-sm border-2 py-2 text-sm font-semibold uppercase tracking-wide transition-colors"
              style={{
                fontFamily: "var(--font-body)",
                borderColor: role === r ? "var(--cream)" : "rgba(235,217,153,0.3)",
                color: role === r ? "var(--cream)" : "rgba(235,217,153,0.65)",
                backgroundColor: role === r ? "rgba(235,217,153,0.12)" : "transparent",
              }}
            >
              {r === "macondo" ? "Macondo" : "Cliente"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span
              className="text-[11px] uppercase tracking-wide"
              style={{ color: "rgba(235,217,153,0.65)", fontFamily: "var(--font-body)" }}
            >
              Contraseña de acceso
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="focus-ring rounded-sm border-2 bg-transparent px-3 py-2 text-base"
              style={{ borderColor: "rgba(235,217,153,0.35)", color: "var(--paper)" }}
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="text-sm" style={{ color: "var(--clay)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="focus-ring mt-2 rounded-sm border-2 py-2.5 text-sm font-bold uppercase tracking-wide transition-opacity disabled:opacity-40"
            style={{
              borderColor: "var(--primary)",
              backgroundColor: "var(--primary)",
              color: "var(--cream)",
              fontFamily: "var(--font-body)",
            }}
          >
            {loading ? "Entrando…" : "Entrar a la obra"}
          </button>
        </form>
      </div>
    </main>
  );
}
