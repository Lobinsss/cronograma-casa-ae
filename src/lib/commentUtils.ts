export function formatCommentTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function roleLabel(role: "macondo" | "cliente"): string {
  return role === "macondo" ? "Macondo" : "Cliente";
}
