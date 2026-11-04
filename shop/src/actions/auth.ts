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

export async function loginAction(formData: { email?: string; password?: string }) {
  try {
    const email = formData.email?.trim().toLowerCase();
    const password = formData.password?.trim();

    if (!email || !password) {
      return { success: false as const, error: "Email and password are required." };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return { success: false as const, error: "Invalid email or password." };
    }

    if (!user.active) {
      return { success: false as const, error: "Your account has been deactivated. Please contact an administrator." };
    }

    if (!user.passwordHash) {
      return { success: false as const, error: "No password configured for this user. Please contact an administrator." };
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return { success: false as const, error: "Invalid email or password." };
    }

    const token = await signToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    await setSessionCookie(token);

    return {
      success: true as const,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  } catch (err: any) {
    console.error("loginAction error:", err);
    return { success: false as const, error: "Authentication failed. Please try again." };
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
