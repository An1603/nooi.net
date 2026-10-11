"use client";
import { useEffect, useState } from "react";
import { RelativeLink } from "@/components/ekid/RelativeLink";

export default function EkidRelativesPage() {
  // kidId có thể null: người thân (không sở hữu hồ sơ nào) vẫn cần nhập mã liên kết.
  const [kidId, setKidId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const kr = await fetch("/api/ekid/kids");
        if (!kr.ok) throw new Error("Không tải được hồ sơ bé");
        const kd = await kr.json();
        setKidId((kd.kids ?? [])[0]?.id ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Có lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-2 md:p-4 space-y-4" style={{ background: "#1a0a2e" }}>
      <h1 className="text-lg font-semibold text-foreground">Liên kết người thân</h1>
      <p className="text-sm text-muted-foreground">
        Nhập mã liên kết bạn nhận được, hoặc tạo mã/tìm người thân để gửi lời mời.
      </p>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {/* Luôn render để người thân (không sở hữu hồ sơ nào) vẫn nhập được mã. */}
          <RelativeLink kidId={kidId} />
        </>
      )}
    </div>
  );
}
