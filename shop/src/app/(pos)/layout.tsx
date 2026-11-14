import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PosShell } from "@/components/shared/PosShell";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, active: true },
  });

  if (!user || !user.active) {
    redirect("/login");
  }

  return <PosShell>{children}</PosShell>;
}
