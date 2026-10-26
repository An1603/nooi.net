import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireOpcUser } from "@/lib/opc/auth";
import OpcShell from "@/components/opc/OpcShell";

export const metadata: Metadata = {
  title: { default: "OPC Center", template: "%s · OPC Center" },
  description: "Nền tảng vận hành OPC Center — CRM, cộng đồng, hồ sơ và dòng tiền.",
  manifest: "/opc-manifest.json",
};

export const dynamic = "force-dynamic";

export default async function OpcLayout({ children }: { children: ReactNode }) {
  const { nguoi, user, vaiTro, isStaff, isAdmin } = await requireOpcUser();

  return (
    <OpcShell
      user={{
        ten: nguoi?.ten ?? null,
        email: user.email,
        vaiTro,
        isStaff,
        isAdmin,
      }}
    >
      {children}
    </OpcShell>
  );
}
