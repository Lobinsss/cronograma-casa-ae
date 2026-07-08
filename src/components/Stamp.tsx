"use client";

type StampProps = {
  active: boolean;
  label: string;
  activeLabel: string;
  color: "growth" | "gold" | "clay";
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
};

const COLOR_MAP: Record<StampProps["color"], { border: string; text: string; bg: string }> = {
  growth: { border: "var(--growth)", text: "var(--growth)", bg: "rgba(76, 122, 94, 0.12)" },
  gold: { border: "var(--gold-stamp)", text: "var(--gold-stamp)", bg: "rgba(201, 154, 61, 0.12)" },
  clay: { border: "var(--clay)", text: "var(--clay)", bg: "rgba(181, 83, 60, 0.12)" },
};

export default function Stamp({
  active,
  label,
  activeLabel,
  color,
  disabled,
  onClick,
  size = "md",
}: StampProps) {
  const c = COLOR_MAP[color];
  const dims = size === "sm" ? "text-[10px] px-2 py-1" : "text-xs px-3 py-1.5";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`focus-ring shrink-0 rounded-full border-2 font-semibold uppercase tracking-wide transition-all ${dims} ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:brightness-110"
      } ${active ? "stamp-animate" : ""}`}
      style={{
        borderColor: active ? c.border : "rgba(243,240,230,0.28)",
        color: active ? c.text : "rgba(243,240,230,0.55)",
        backgroundColor: active ? c.bg : "transparent",
        fontFamily: "var(--font-mono)",
        transform: active ? "rotate(-2deg)" : "none",
      }}
    >
      {active ? `✓ ${activeLabel}` : label}
    </button>
  );
}
