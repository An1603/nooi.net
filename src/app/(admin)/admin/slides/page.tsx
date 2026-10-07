"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Lock,
  Loader2,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const DECK_LABELS: Record<string, string> = {
  "cau-truc-nooi": "Cấu trúc NOOI — bản cổ đông (FINAL v5)",
  "opc-center": "OPC Center — Doanh nghiệp 1 người",
  "gop-von-theo-loi-ich": "Góp vốn theo lợi ích",
  "hop-tac-ben-vung": "Hợp tác bền vững",
  "nooi-forest": "NOOI Forest — Living Mountain",
  "quan-chieu-hanh-su": "Quán chiếu hành sự",
  "cau-truc-doanh-nghiep": "Cấu trúc doanh nghiệp (link cũ)",
  "checkin-sanmay": "Check-in săn mây & F&B tại điểm (M01 — hạch toán & giá)",
  "hoc-vien-chuyen-hoa": "Học viện & Chuyển hóa (M04 — hạch toán & giá)",
};

export default function AdminSlidesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [master, setMaster] = useState("");
  const [newMaster, setNewMaster] = useState("");
  const [decks, setDecks] = useState<Record<string, string>>({});
  const [newDecks, setNewDecks] = useState<Record<string, string>>({});
  const [rotate, setRotate] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/slides", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Không tải được cấu hình");
      } else {
        setMaster(data.master || "");
        setDecks(data.decks || {});
        setNewDecks({});
        setNewMaster("");
      }
    } catch {
      setError("Không kết nối được dịch vụ slides");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { decks: newDecks };
      if (newMaster.trim()) payload.master = newMaster.trim();
      if (rotate) payload.rotate = true;
      const res = await fetch("/api/admin/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Lưu thất bại");
      } else {
        toast.success(
          data.changed?.length
            ? `Đã lưu: ${data.changed.join(", ")}`
            : "Không có thay đổi nào"
        );
        if (rotate) toast.info("Toàn bộ phiên đăng nhập slides đã bị thu hồi.");
        await load();
        setRotate(false);
      }
    } catch {
      toast.error("Không lưu được");
    }
    setSaving(false);
  };

  const changedCount =
    (newMaster.trim() ? 1 : 0) +
    Object.values(newDecks).filter((v) => (v || "").trim()).length +
    (rotate ? 1 : 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Lock className="size-6 text-primary" />
          Slides &amp; Bảo mật
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Quản lý mật khẩu truy cập kho tài liệu nội bộ{" "}
          <a
            href="https://slides.nooi.net/"
            target="_blank"
            rel="noopener"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            slides.nooi.net <ExternalLink className="size-3.5" />
          </a>
          . Mật khẩu chung mở toàn bộ; mật mã riêng chỉ mở đúng một tài liệu.
        </p>
      </div>

      {error && (
        <Card className="p-4 border-red-500/40 bg-red-500/5">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <ShieldAlert className="size-4" /> {error}
          </p>
        </Card>
      )}

      {loading ? (
        <Card className="p-8 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </Card>
      ) : (
        <>
          {/* Mật khẩu chung */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Mật khẩu chung (admin)</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dùng để mở toàn bộ tài liệu và vào trang quản trị.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShow((s) => !s)}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                <span className="ml-1 text-xs">{show ? "Ẩn" : "Hiện"}</span>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Hiện tại</Label>
                <Input
                  readOnly
                  type={show ? "text" : "password"}
                  value={master}
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Đổi thành (để trống = giữ nguyên)
                </Label>
                <Input
                  type="text"
                  value={newMaster}
                  onChange={(e) => setNewMaster(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="mt-1 font-mono text-sm"
                  autoComplete="off"
                />
              </div>
            </div>
          </Card>

          {/* Mật mã từng tài liệu */}
          <Card className="p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Mật mã riêng từng tài liệu</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chia sẻ link + mật mã của đúng tài liệu đó cho đối tác. Ô trống = giữ nguyên.
              </p>
            </div>
            <div className="space-y-3">
              {Object.keys(decks).map((slug) => (
                <div key={slug} className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
                  <div>
                    <Label className="text-xs">
                      {DECK_LABELS[slug] || slug}
                      <span className="text-muted-foreground font-normal"> · /{slug}/</span>
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        readOnly
                        type={show ? "text" : "password"}
                        value={decks[slug] || ""}
                        className="font-mono text-sm bg-muted/40"
                      />
                      <Input
                        type="text"
                        placeholder="mã mới"
                        value={newDecks[slug] || ""}
                        onChange={(e) =>
                          setNewDecks((d) => ({ ...d, [slug]: e.target.value }))
                        }
                        className="font-mono text-sm"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Lưu */}
          <Card className="p-5 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rotate}
                onChange={(e) => setRotate(e.target.checked)}
                className="mt-1 size-4 accent-red-500"
              />
              <span className="text-sm">
                <span className="font-medium">Đăng xuất toàn bộ phiên</span>
                <span className="block text-xs text-muted-foreground">
                  Thu hồi khẩn cấp: mọi người (kể cả anh/chị) phải đăng nhập lại bằng mật khẩu mới.
                </span>
              </span>
            </label>
            <div className="flex items-center gap-3">
              <Button onClick={save} disabled={saving || changedCount === 0}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span className="ml-2">
                  {changedCount > 0 ? `Lưu ${changedCount} thay đổi` : "Lưu"}
                </span>
              </Button>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className="size-4" />
                <span className="ml-2">Tải lại</span>
              </Button>
              {changedCount === 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Đang khớp với cấu hình hiện tại
                </span>
              )}
            </div>
          </Card>

          <p className="text-xs text-muted-foreground">
            Ghi chú: mật khẩu được lưu trong cấu hình của dịch vụ slides và tự động đồng bộ về
            vault. Đổi mật khẩu có hiệu lực ngay, không cần khởi động lại.
          </p>
        </>
      )}
    </div>
  );
}