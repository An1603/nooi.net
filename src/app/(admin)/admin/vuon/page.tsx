"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Sprout,
  Loader2,
  RefreshCw,
  FileText,
  KeyRound,
  Undo2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

type Dong = {
  id: number;
  ma: string;
  ten: string;
  ten_nguoi: string;
  trang_thai: string;
  muc: number | null;
  diem_chot: number | null;
  nhan_luc: string | null;
  link: string | null;
  ghi_chu: string | null;
};

type Muc = {
  id: number;
  loai: string;
  noi_dung: string | null;
  links: string[];
  files: { ten: string; ten_goc?: string; url: string }[];
  luc: string;
  tien_do: number | null;
};

const TEN_TRANG_THAI: Record<string, string> = {
  da_nhan: "Đang làm",
  da_nop: "Chờ nghiệm thu",
  da_cham: "Đã chấm — chờ chọn gói",
  da_chon: "Đã chọn gói",
  da_tra: "Đã trả quả",
  tra_ve: "Đã trả về chợ",
};

const MAU: Record<string, string> = {
  da_nhan: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  da_nop: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  da_cham: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  da_chon: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  da_tra: "bg-emerald-600/20 text-emerald-200 border-emerald-600/40",
  tra_ve: "bg-red-500/15 text-red-300 border-red-500/30",
};

const MUC = [0, 50, 80, 100, 130];

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("vi-VN");

const ngay = (s: string | null) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");

export default function AdminVuonPage() {
  const [ds, setDs] = useState<Dong[]>([]);
  const [loading, setLoading] = useState(true);
  const [dangChay, setDangChay] = useState<number | null>(null);
  const [loc, setLoc] = useState("");
  const [q, setQ] = useState("");
  const [mo, setMo] = useState<number | null>(null);
  const [mucMap, setMucMap] = useState<Record<number, number>>({});
  const [dongThoiGian, setDongThoiGian] = useState<Record<number, Muc[]>>({});
  const [quyen, setQuyen] = useState<Record<number, string>>({});

  const tai = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/vuon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ds" }),
        cache: "no-store",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.loi || "Không tải được danh sách");
      setDs(d.ds || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    tai();
  }, [tai]);

  const goi = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/vuon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.loi || "Lỗi");
    return d;
  };

  const cham = async (r: Dong, muc: number) => {
    setDangChay(r.id);
    try {
      const d = await goi({ action: "cham", ma: r.ma, nguoi: r.ten_nguoi, muc });
      toast.success(`Đã chấm ${r.ma}: ${muc}% → ${fmt(d.diem_chot)} điểm`);
      await tai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi chấm điểm");
    } finally {
      setDangChay(null);
    }
  };

  const traQua = async (r: Dong) => {
    if (!confirm(`Trả quả cho ${r.ma} — ${r.ten_nguoi}? Việc này ghi vào sổ và không hoàn tác.`)) return;
    setDangChay(r.id);
    try {
      await goi({ action: "tra", id: r.id });
      toast.success("Đã trả quả");
      await tai();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi trả quả");
    } finally {
      setDangChay(null);
    }
  };

  const capQuyen = async (r: Dong) => {
    const email = (quyen[r.id] || "").trim();
    if (!email) return toast.error("Nhập email cần cấp quyền");
    setDangChay(r.id);
    try {
      await goi({ action: "quyen", ma: r.ma, email });
      toast.success(`Đã cấp quyền xem minh chứng ${r.ma} cho ${email}`);
      setQuyen((v) => ({ ...v, [r.id]: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cấp quyền");
    } finally {
      setDangChay(null);
    }
  };

  const xem = async (r: Dong) => {
    if (mo === r.id) {
      setMo(null);
      return;
    }
    setMo(r.id);
    if (dongThoiGian[r.id]) return;
    try {
      const d = await goi({ action: "nhatky", id: r.id });
      setDongThoiGian((v) => ({ ...v, [r.id]: d.muc || [] }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải báo cáo");
    }
  };

  const dem = useMemo(() => {
    const d = { tong: ds.length, dang_lam: 0, cho: 0, xong: 0 };
    for (const r of ds) {
      if (r.trang_thai === "da_nhan") d.dang_lam++;
      else if (r.trang_thai === "da_nop") d.cho++;
      else if (r.trang_thai === "da_tra") d.xong++;
    }
    return d;
  }, [ds]);

  const hien = ds.filter((r) => {
    if (loc && r.trang_thai !== loc) return false;
    const k = q.trim().toLowerCase();
    if (!k) return true;
    return (
      r.ma.toLowerCase().includes(k) ||
      r.ten.toLowerCase().includes(k) ||
      r.ten_nguoi.toLowerCase().includes(k)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="size-6 text-emerald-400" />
            Sàn việc — Vườn NOOI
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            100 hạt đang mở · nghiệm thu, chấm điểm, cấp quyền xem minh chứng, trả quả
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={tai} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            <span className="ml-2">Tải lại</span>
          </Button>
          <a
            href="https://vuon.nooi.net/"
            target="_blank"
            rel="noopener"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink className="size-4" />
            <span className="ml-2">Mở chợ hạt</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { nhan: "Tổng lượt nhận", so: dem.tong, mau: "text-foreground" },
          { nhan: "Đang làm", so: dem.dang_lam, mau: "text-sky-300" },
          { nhan: "Chờ nghiệm thu", so: dem.cho, mau: "text-amber-300" },
          { nhan: "Đã trả quả", so: dem.xong, mau: "text-emerald-300" },
        ].map((x) => (
          <Card key={x.nhan} className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{x.nhan}</div>
            <div className={`text-2xl font-bold mt-1 ${x.mau}`}>{x.so}</div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Tìm theo mã hạt, tên việc, tên người…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={loc}
          onChange={(e) => setLoc(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(TEN_TRANG_THAI).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {loading && ds.length === 0 && (
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Đang tải…
          </div>
        )}
        {!loading && hien.length === 0 && (
          <Card className="p-6 text-sm text-muted-foreground">Chưa có lượt nhận hạt nào khớp.</Card>
        )}

        {hien.map((r) => (
          <Card key={r.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/5 border border-border/40">
                    {r.ma}
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded border ${MAU[r.trang_thai] || "border-border/40"}`}
                  >
                    {TEN_TRANG_THAI[r.trang_thai] || r.trang_thai}
                  </span>
                  {r.muc != null && (
                    <span className="text-[11px] text-muted-foreground">
                      mức {r.muc}% → {fmt(r.diem_chot)} điểm
                    </span>
                  )}
                </div>
                <div className="font-medium mt-1 truncate">{r.ten}</div>
                <div className="text-sm text-muted-foreground">
                  {r.ten_nguoi} · nhận {ngay(r.nhan_luc)}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={mucMap[r.id] ?? ""}
                  onChange={(e) => setMucMap((v) => ({ ...v, [r.id]: Number(e.target.value) }))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="">Mức…</option>
                  {MUC.map((m) => (
                    <option key={m} value={m}>
                      {m}%
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  disabled={mucMap[r.id] == null || dangChay === r.id}
                  onClick={() => cham(r, mucMap[r.id])}
                >
                  Chấm
                </Button>
                <Button size="sm" variant="outline" onClick={() => xem(r)}>
                  {mo === r.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  <span className="ml-1">Báo cáo</span>
                </Button>
                {r.trang_thai === "da_chon" && (
                  <Button size="sm" variant="outline" onClick={() => traQua(r)} disabled={dangChay === r.id}>
                    <Undo2 className="size-4" />
                    <span className="ml-1">Trả quả</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Email được xem minh chứng của hạt này"
                value={quyen[r.id] || ""}
                onChange={(e) => setQuyen((v) => ({ ...v, [r.id]: e.target.value }))}
                className="h-9 max-w-xs"
              />
              <Button size="sm" variant="ghost" onClick={() => capQuyen(r)} disabled={dangChay === r.id}>
                Cấp quyền
              </Button>
            </div>

            {mo === r.id && (
              <div className="border-t border-border/30 pt-3 space-y-3">
                {!dongThoiGian[r.id] && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Đang tải báo cáo…
                  </div>
                )}
                {(dongThoiGian[r.id] || []).length === 0 && dongThoiGian[r.id] && (
                  <div className="text-sm text-muted-foreground">Chưa có cập nhật nào.</div>
                )}
                {(dongThoiGian[r.id] || []).map((m) => (
                  <div key={m.id} className="text-sm space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="uppercase tracking-wide">{m.loai}</span>
                      <span>·</span>
                      <span>{m.luc?.slice(0, 16)}</span>
                      {m.tien_do != null && (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-border/40">
                          {m.tien_do}%
                        </span>
                      )}
                    </div>
                    {m.noi_dung && <div className="whitespace-pre-wrap">{m.noi_dung}</div>}
                    {(m.links || []).map((l, i) => (
                      <a
                        key={i}
                        href={l}
                        target="_blank"
                        rel="noopener"
                        className="text-primary hover:underline block text-xs truncate"
                      >
                        {l}
                      </a>
                    ))}
                    {(m.files || []).map((f, i) => (
                      <a
                        key={i}
                        href={`/api/admin/vuon/tep?ten=${encodeURIComponent(f.ten)}`}
                        target="_blank"
                        rel="noopener"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-xs mr-3"
                      >
                        <FileText className="size-3" />
                        {f.ten_goc || f.ten}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
