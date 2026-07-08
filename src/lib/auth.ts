import { cookies } from "next/headers";
import crypto from "crypto";

export type Role = "macondo" | "cliente";

export const COOKIE_NAME = "cronograma_role";

const SECRET =
  process.env.SESSION_SECRET || "casa-ae-dev-secret-change-in-production";

function sign(value: string): string {
  const h = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(signed: string): Role | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(value)
    .digest("hex");
  if (sig.length !== expected.length) return null;
  const ok = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  if (!ok) return null;
  if (value === "macondo" || value === "cliente") return value;
  return null;
}

export function checkPassword(role: Role, password: string): boolean {
  const expected =
    role === "macondo"
      ? process.env.MACONDO_PASSWORD || "macondo2026"
      : process.env.CLIENTE_PASSWORD || "casaae2026";
  return password === expected;
}

export function makeSessionCookieValue(role: Role): string {
  return sign(role);
}

export async function getRole(): Promise<Role | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}
