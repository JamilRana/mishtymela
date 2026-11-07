import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";
import { getSession, type SessionPayload } from "./session";

export {
  SESSION_COOKIE_NAME, signToken, verifyToken, getSession, setSessionCookie, clearSessionCookie,
} from "./session";
export type { SessionPayload } from "./session";

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 12);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/** Valid session AND an active user right now. Role and org come from the database, not the token. */
export async function requireAuth(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s?.userId) throw new Error("Unauthorized: Active session required.");
  const u = await prisma.user.findUnique({
    where: { id: s.userId },
    select: { name: true, email: true, role: true, active: true, organizationId: true },
  });
  if (!u || !u.active) throw new Error("Unauthorized: Account is inactive.");
  return { userId: s.userId, name: u.name, email: u.email, role: u.role, organizationId: u.organizationId };
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionPayload> {
  const s = await requireAuth();
  if (!allowedRoles.includes(s.role)) throw new Error("Forbidden: You are not allowed to do this.");
  return s;
}
