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

const COLOR_MAP: Record<
  StampProps["color"],
  { border: string; text: string; bg: string; inactiveBg: string }
> = {
  growth: {
    border: "var(--primary)",
    text: "var(--primary)",
    bg: "rgba(80, 84, 35, 0.22)",
    inactiveBg: "rgba(80, 84, 35, 0.1)",
  },
  gold: {
    border: "var(--primary-deeper)",
    text: "var(--primary-deeper)",
    bg: "rgba(44, 47, 24, 0.18)",
    inactiveBg: "rgba(44, 47, 24, 0.08)",
  },
  clay: {
    border: "var(--terracotta)",
    text: "var(--terracotta)",
    bg: "rgba(169, 52, 0, 0.18)",
    inactiveBg: "rgba(169, 52, 0, 0.1)",
  },
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
  const dims = size === "sm" ? "text-[10px] px-2.5 py-1" : "text-xs px-3 py-1.5";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`focus-ring shrink-0 rounded-full border-2 font-semibold uppercase tracking-wide transition-all ${dims} ${
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:brightness-95"
      } ${active ? "stamp-animate" : ""}`}
      style={{
        borderColor: c.border,
        color: c.text,
        backgroundColor: active ? c.bg : c.inactiveBg,
        fontFamily: "var(--font-body)",
        transform: active ? "rotate(-2deg)" : "none",
        boxShadow: active ? "0 1px 0 rgba(44, 47, 24, 0.12)" : "none",
      }}
    >
      {active ? `✓ ${activeLabel}` : label}
    </button>
  );
}
