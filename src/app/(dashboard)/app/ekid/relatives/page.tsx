"use client";
import { useEffect, useState } from "react";
import { RelativeLink } from "@/components/ekid/RelativeLink";

export default function EkidRelativesPage() {
  const [kidId, setKidId] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const kr = await fetch("/api/ekid/kids").then((r) => r.json());
      setKidId((kr.kids ?? [])[0]?.id ?? null);
    })();
  }, []);
  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Liên kết người thân</h1>
      <p className="text-sm text-muted-foreground">
        Tạo mã liên kết gửi cho cha/mẹ/người giám hộ, hoặc tìm theo tên.
      </p>
      {kidId ? (
        <RelativeLink kidId={kidId} />
      ) : (
        <p className="text-sm text-muted-foreground">Chưa có hồ sơ bé.</p>
      )}
    </div>
  );
}
