import { decode } from "next-auth/jwt";
import type { Role } from "@prisma/client";

export type MobileAuthSession = {
  userId: string;
  role: Role;
  name: string;
};

const MOBILE_ALLOWED_ROLES: Role[] = ["ADMIN", "PENARIK"];

export async function requireMobileAuth(req: Request): Promise<MobileAuthSession> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  if (!token) {
    throw new Error("Unauthorized");
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET belum dikonfigurasi.");
  }

  const payload = await decode({ token, secret });
  const userId = payload?.id ? String(payload.id) : "";
  const role = payload?.role as Role | undefined;

  if (!userId || !role || !MOBILE_ALLOWED_ROLES.includes(role)) {
    throw new Error("Unauthorized");
  }

  return {
    userId,
    role,
    name: payload?.name ? String(payload.name) : "",
  };
}

export function unauthorizedMobileResponse(headers: Record<string, string>) {
  return Response.json({ success: false, error: "Unauthorized" }, { status: 401, headers });
}
