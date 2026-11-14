"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hashPassword, requireRole } from "@/lib/auth";
import { handleAction } from "@/lib/action-handler";

export async function getUsersAction() {
  const session = await requireRole(["ADMIN", "OWNER"]);

  const users = await prisma.user.findMany({
    where: { organizationId: session.organizationId },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    role: u.role,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createUserAction(data: {
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active?: boolean;
  password?: string;
}) {
  return handleAction("createUserAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    if (!data.name.trim()) {
      throw new Error("Staff name is required.");
    }
    if (!data.email.trim() || !data.email.includes("@")) {
      throw new Error("A valid email address is required.");
    }

    const rawPassword = data.password?.trim() ?? "";
    if (rawPassword.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    const existing = await prisma.user.findFirst({
      where: { email: data.email.trim().toLowerCase() },
    });
    if (existing) {
      throw new Error("A user with this email already exists.");
    }

    const hashedPassword = await hashPassword(rawPassword);

    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || null,
        role: data.role,
        active: data.active ?? true,
        passwordHash: hashedPassword,
      },
    });

    try {
      revalidatePath("/settings");
    } catch {}

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        role: user.role,
        active: user.active,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }, "Failed to create staff member.");
}

export async function updateUserAction(data: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  active?: boolean;
  password?: string;
}) {
  return handleAction("updateUserAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    if (!data.name.trim()) {
      throw new Error("Staff name is required.");
    }
    if (!data.email.trim() || !data.email.includes("@")) {
      throw new Error("A valid email address is required.");
    }

    // Verify existing user belongs to current org
    const targetUser = await prisma.user.findFirst({
      where: { id: data.id, organizationId: orgId },
    });
    if (!targetUser) {
      throw new Error("Staff member not found.");
    }

    // Check email uniqueness if email changed
    const duplicate = await prisma.user.findFirst({
      where: {
        email: data.email.trim().toLowerCase(),
        NOT: { id: data.id },
      },
    });
    if (duplicate) {
      throw new Error("This email is already in use by another staff member.");
    }

    const updatePayload: {
      name: string;
      email: string;
      phone: string | null;
      role: Role;
      active?: boolean;
      passwordHash?: string;
    } = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone?.trim() || null,
      role: data.role,
      active: data.active,
    };

    if (data.password && data.password.trim().length > 0) {
      if (data.password.trim().length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      updatePayload.passwordHash = await hashPassword(data.password.trim());
    }

    const updated = await prisma.user.update({
      where: { id: data.id },
      data: updatePayload,
    });

    try {
      revalidatePath("/settings");
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
  }, "Failed to update staff member.");
}

export async function toggleUserStatusAction(id: string, active: boolean) {
  return handleAction("toggleUserStatusAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const targetUser = await prisma.user.findFirst({
      where: { id, organizationId: session.organizationId },
    });
    if (!targetUser) {
      throw new Error("Staff member not found.");
    }

    if (targetUser.id === session.userId && !active) {
      throw new Error("Cannot deactivate your own administrator account.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { active },
    });

    try {
      revalidatePath("/settings");
    } catch {}

    return { active: updated.active };
  }, "Failed to update staff status.");
}

export async function deleteUserAction(id: string) {
  return handleAction("deleteUserAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const user = await prisma.user.findFirst({
      where: { id, organizationId: session.organizationId },
    });

    if (!user) {
      throw new Error("Staff member not found.");
    }

    if (user.id === session.userId) {
      throw new Error("Cannot delete your own account.");
    }

    if (user.role === "ADMIN" || user.role === "OWNER") {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: user.organizationId,
          role: { in: ["ADMIN", "OWNER"] },
          active: true,
        },
      });
      if (adminCount <= 1) {
        throw new Error("Cannot delete the last remaining active Administrator.");
      }
    }

    await prisma.user.delete({ where: { id } });

    try {
      revalidatePath("/settings");
    } catch {}

    return {};
  }, "Failed to delete staff member.");
}

export async function resetUserPasswordAction(data: {
  userId: string;
  newPassword: string;
}) {
  return handleAction("resetUserPasswordAction", async () => {
    const session = await requireRole(["ADMIN", "OWNER"]);
    const orgId = session.organizationId;

    const newPass = data.newPassword?.trim() ?? "";
    if (newPass.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const user = await prisma.user.findFirst({
      where: { id: data.userId, organizationId: orgId },
    });

    if (!user) {
      throw new Error("Staff member not found.");
    }

    const hashedPassword = await hashPassword(newPass);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        failedLogins: 0,
        lockedUntil: null,
      },
    });

    try {
      revalidatePath("/settings");
    } catch {}

    return {
      success: true,
      message: `Password for ${user.name} has been reset successfully.`,
    };
  }, "Failed to reset password.");
}
