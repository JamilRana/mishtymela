"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuth, hashPassword, verifyPassword, setSessionCookie, signToken } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getProfileUserAction() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      organization: {
        select: {
          name: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    active: user.active,
    organizationName: user.organization.name,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function updateSelfProfileAction(data: {
  name: string;
  phone?: string;
  email: string;
}) {
  return handleAction("updateSelfProfileAction", async () => {
    const session = await requireAuth();

    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone?.trim() || null;

    if (!cleanName) {
      throw new Error("Full name is required.");
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("A valid email address is required.");
    }

    // Check if email already used by another user
    const existing = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        NOT: { id: session.userId },
      },
    });

    if (existing) {
      throw new Error("This email address is already in use by another user.");
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
      },
    });

    // Update active JWT session cookie with new name & email
    const token = await signToken({
      userId: updated.id,
      role: updated.role,
      organizationId: updated.organizationId,
      name: updated.name,
      email: updated.email,
    });
    await setSessionCookie(token);

    try {
      revalidatePath("/profile");
      revalidatePath("/settings");
      revalidatePath("/dashboard");
    } catch {}

    return {
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || "",
        role: updated.role,
        active: updated.active,
        createdAt: updated.createdAt.toISOString(),
      },
    };
  }, "Failed to update profile.");
}

export async function changeSelfPasswordAction(data: {
  currentPassword?: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return handleAction("changeSelfPasswordAction", async () => {
    const session = await requireAuth();

    const newPass = data.newPassword.trim();
    const confirmPass = data.confirmPassword.trim();

    if (newPass.length < 6) {
      throw new Error("New password must be at least 6 characters long.");
    }

    if (newPass !== confirmPass) {
      throw new Error("New password and confirm password do not match.");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error("User account not found.");
    }

    // If user already has a password, verify the current one
    if (user.passwordHash) {
      if (!data.currentPassword || data.currentPassword.trim().length === 0) {
        throw new Error("Please enter your current password.");
      }
      const isMatch = await verifyPassword(data.currentPassword, user.passwordHash);
      if (!isMatch) {
        throw new Error("Current password is incorrect.");
      }
    }

    const hashed = await hashPassword(newPass);

    await prisma.user.update({
      where: { id: session.userId },
      data: {
        passwordHash: hashed,
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    return {
      success: true,
      message: "Password changed successfully.",
    };
  }, "Failed to change password.");
}
