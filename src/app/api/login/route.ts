import { NextRequest, NextResponse } from "next/server";
import { checkPassword, makeSessionCookieValue, COOKIE_NAME, Role } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const role = body?.role as Role | undefined;
  const password = body?.password as string | undefined;

  if (!role || (role !== "macondo" && role !== "cliente") || !password) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos" },
      { status: 400 }
    );
  }

  if (!checkPassword(role, password)) {
    return NextResponse.json(
      { ok: false, error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(COOKIE_NAME, makeSessionCookieValue(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 120, // 120 días — dura toda la obra
  });
  return res;
}
