import { PosShell } from "@/components/shared/PosShell";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PosShell>{children}</PosShell>;
}
