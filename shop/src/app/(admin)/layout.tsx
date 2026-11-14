import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shared/AppShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const [user, org] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, role: true, active: true },
    }),
    prisma.organization.findFirst({
      select: { id: true, name: true, address: true, phone: true, email: true, receiptFooter: true },
    }),
  ]);

  if (!user || !user.active) {
    redirect("/login");
  }

  return (
    <AppShell
      initialSession={{
        userId: user.id,
        name: user.name,
        role: user.role,
        organizationId: session.organizationId,
      }}
      initialShopInfo={org || undefined}
    >
      {children}
    </AppShell>
  );
}
