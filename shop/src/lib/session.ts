import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "sweet_shop_session";

const secretKey = process.env.AUTH_SECRET || "sweet-shop-default-secure-secret-key-32-chars-min!";
const JWT_SECRET = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
}

/**
 * Sign a session payload into a JWT.
 */
export async function signToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify a JWT string and return the session payload.
 * Fully Edge and Node runtime compatible.
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
      organizationId: payload.organizationId as string,
    };
  } catch {
    return null;
  }
}

/**
 * Read the session from the incoming cookies in Server Components / Actions.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Enforce authentication. Throws if unauthenticated.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !session.userId || !session.organizationId) {
    throw new Error("Unauthorized: Active session required.");
  }
  return session;
}

/**
 * Enforce role-based access control. Throws if role is insufficient.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Forbidden: Role '${session.role}' is not authorized for this operation.`);
  }
  return session;
}

/**
 * Set the HTTP-only session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === "production",
  });
}

/**
 * Clear the session cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
}
