"use server";

import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  getSession,
  hashPassword,
  setSessionCookie,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12); // equalises timing for unknown emails
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;
const fail = (error: string) => ({ success: false as const, error });

export async function loginAction(formData: { email?: string; password?: string }) {
  try {
    const email = formData.email?.trim().toLowerCase();
    const password = formData.password ?? "";
    if (!email || !password) return fail("Email and password are required.");

    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.lockedUntil && user.lockedUntil > new Date()) {
      return fail("Too many failed attempts. Try again in 15 minutes.");
    }

    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !user.passwordHash || !ok || !user.active) {
      if (user) {
        const fails = user.failedLogins + 1;
        await prisma.user.update({
          where: { id: user.id },
          data: fails >= MAX_FAILS
            ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) }
            : { failedLogins: fails },
        });
      }
      return fail("Invalid email or password."); // same message for every failure: no account probing
    }

    if (user.failedLogins || user.lockedUntil) {
      await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    }

    const token = await signToken({
      userId: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId,
    });
    await setSessionCookie(token);
    return {
      success: true as const,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, organizationId: user.organizationId },
    };
  } catch (err) {
    console.error("loginAction error:", err);
    return fail("Authentication failed. Please try again.");
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  try {
    revalidatePath("/", "layout");
  } catch {}
  return { success: true as const };
}

export async function getCurrentSessionAction() {
  return await getSession();
}
