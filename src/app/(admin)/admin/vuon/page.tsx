"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Users,
  X,
} from "lucide-react";

/* ───────────────────────── kiểu dữ liệu ───────────────────────── */

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

type Hat = {
  ma: string;
  ten: string;
  nhom: string;
  ten_nhom?: string;
  diem: number;
  bac: string;
  mo_ta?: string;
  san_pham?: string;
  tieu_chi?: string;
  doi_tuong?: string;
  so_cho: number;
  han: string;
  uu_tien?: string;
  qua_kem?: string;
  nguoi_duyet?: string;
  an?: boolean;
  da_nhan?: number;
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

type Nguoi = {
  user_id: string;
  ten: string;
  email: string;
  dien_thoai: string;
  cap_do?: number;
  ngay_tao?: string;
  avatar?: string;
  slug?: string;
};
type Quyen = { email: string; ten: string; vai_tro: string; luc: string };

const NHOM = [
  ["TA", "Thương hiệu & truyền thông"],
  ["TK", "Tri thức & giáo trình"],
  ["CN", "Công nghệ & sản phẩm số"],
  ["VH", "Vận hành & tổ chức"],
  ["QH", "Kinh doanh & quan hệ"],
  ["TT", "Tâm thức & văn hoá"],
  ["CD", "Cộng đồng & xã hội"],
  ["SK", "Sáng kiến & tối ưu"],
  ["NL", "Nguồn lực"],
  ["KN", "Khởi nghiệp & khởi sự"],
] as const;

const BAC = ["A+", "A", "B", "C", "D"];
const UU_TIEN = ["Bình thường", "Cao", "GẤP"];
const QUA_KEM = ["Thư cảm ơn điện tử", "Chứng nhận", "Chứng nhận có chữ ký Chủ tịch + bảng vàng năm"];

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

const MUC_CHAM = [0, 50, 80, 100, 130];

const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString("vi-VN"));
const ngay = (s: string | null) => (s ? s.slice(0, 10).split("-").reverse().join("/") : "—");

/* ───────────────────────── ô chọn người ───────────────────────── */

function ChonNguoi({
  onChon,
  placeholder = "Tìm theo tên, email hoặc số điện thoại…",
}: {
  onChon: (n: Nguoi) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const [ds, setDs] = useState<Nguoi[]>([]);
  const [mo, setMo] = useState(false);
  const [dangTim, setDangTim] = useState(false);
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hen.current) clearTimeout(hen.current);
    if (q.trim().length < 1) {
      setDs([]);
      return;
    }
    hen.current = setTimeout(async () => {
      setDangTim(true);
      try {
        const r = await fetch(`/api/admin/vuon/nguoi?q=${encodeURIComponent(q.trim())}`, {
          cache: "no-store",
        });
        const d = await r.json();
        if (r.ok) setDs(d.ds || []);
      } catch {
        /* im lặng */
      } finally {
        setDangTim(false);
      }
    }, 300);
    return () => {
      if (hen.current) clearTimeout(hen.current);
    };
  }, [q]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 pl-9"
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setMo(true);
          }}
          onFocus={() => setMo(true)}
        />
        {dangTim && <Loader2 className="size-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />}
      </div>
      {mo && ds.length > 0 && (
        <div className="absolute z-30 mt-1 w-full rounded-md border border-border/50 bg-popover shadow-xl max-h-64 overflow-y-auto">
          {ds.map((n) => (
            <button
              key={n.user_id}
              type="button"
              onClick={() => {
                onChon(n);
                setQ("");
                setMo(false);
                setDs([]);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-border/20 last:border-0 flex items-center gap-3"
            >
              <span className="size-9 rounded-full bg-primary/15 text-primary text-xs font-semibold grid place-items-center shrink-0">
                {n.ten.trim().split(/\s+/).slice(-1)[0]?.slice(0, 2).toUpperCase() || "?"}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium truncate">{n.ten}</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {n.email || "(không email)"}
                  {n.dien_thoai ? ` · ${n.dien_thoai}` : " · chưa có SĐT"}
                </span>
                <span className="block text-[11px] text-muted-foreground/80">
                  {n.cap_do ? `Cấp ${n.cap_do}` : "Chưa xếp cấp"}
                  {n.ngay_tao ? ` · tham gia ${n.ngay_tao.slice(0, 10).split("-").reverse().join("/")}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── trang ───────────────────────── */

export default function AdminVuonPage() {
  const [tab, setTab] = useState<"luot" | "hat" | "quyen">("luot");

  /* lượt nhận */
  const [ds, setDs] = useState<Dong[]>([]);
  const [loading, setLoading] = useState(true);
  const [dangChay, setDangChay] = useState<number | null>(null);
  const [loc, setLoc] = useState("");
  const [q, setQ] = useState("");
  const [mo, setMo] = useState<number | null>(null);
  const [mucMap, setMucMap] = useState<Record<number, number>>({});
  const [dongThoiGian, setDongThoiGian] = useState<Record<number, Muc[]>>({});
  const [nguoiCapQuyen, setNguoiCapQuyen] = useState<Record<number, Nguoi | null>>({});

  /* danh mục hạt */
  const [hats, setHats] = useState<Hat[]>([]);
  const [dangSua, setDangSua] = useState<Hat | null>(null);
  const [qHat, setQHat] = useState("");

  /* phân quyền */
  const [quyen, setQuyen] = useState<Quyen[]>([]);
  const [quyenGoc, setQuyenGoc] = useState<string[]>([]);
  const [chon, setChon] = useState<Nguoi | null>(null);
  const [vaiTro, setVaiTro] = useState<"" | "quan_tri" | "nguoi_duyet">("");

  const goi = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/vuon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.loi || "Lỗi");
    return d;
  }, []);

  const taiLuot = useCallback(async () => {
    setLoading(true);
    try {
      const d = await goi({ action: "ds" });
      setDs(d.ds || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [goi]);

  const taiHat = useCallback(async () => {
    try {
      const d = await goi({ action: "hat-ds" });
      setHats(d.ds || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải danh mục hạt");
    }
  }, [goi]);

  const taiQuyen = useCallback(async () => {
    try {
      const d = await goi({ action: "nguoi-ds" });
      setQuyen(d.ds || []);
      setQuyenGoc(d.goc || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tải phân quyền");
    }
  }, [goi]);

  useEffect(() => {
    taiLuot();
    taiHat();
    taiQuyen();
  }, [taiLuot, taiHat, taiQuyen]);

  /* ── lượt nhận ── */
  const cham = async (r: Dong, muc: number) => {
    setDangChay(r.id);
    try {
      const d = await goi({ action: "cham", ma: r.ma, nguoi: r.ten_nguoi, muc });
      toast.success(`Đã chấm ${r.ma}: ${muc}% → ${fmt(d.diem_chot)} điểm`);
      await taiLuot();
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
      await taiLuot();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi trả quả");
    } finally {
      setDangChay(null);
    }
  };

  const capQuyen = async (r: Dong) => {
    const n = nguoiCapQuyen[r.id];
    if (!n) return toast.error("Chọn người cần cấp quyền trước");
    setDangChay(r.id);
    try {
      await goi({ action: "quyen", ma: r.ma, email: n.email });
      toast.success(`Đã cấp quyền xem ${r.ma} cho ${n.ten} (${n.email})`);
      setNguoiCapQuyen((v) => ({ ...v, [r.id]: null }));
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

  /* ── hạt ── */
  const maGoiY = (nhom: string) => {
    const so = hats
      .filter((h) => h.nhom === nhom)
      .map((h) => parseInt(h.ma.split("-")[1] || "0", 10))
      .filter((n) => !Number.isNaN(n));
    const tiep = (so.length ? Math.max(...so) : 0) + 1;
    return `${nhom}-${String(tiep).padStart(2, "0")}`;
  };

  const moiHat = (): Hat => ({
    ma: maGoiY("KN"),
    ten: "",
    nhom: "KN",
    diem: 2000,
    bac: "A",
    so_cho: 2,
    han: "2026-12-31",
    mo_ta: "",
    san_pham: "",
    tieu_chi: "",
    doi_tuong: "Nội bộ · CTV · Đối tác",
    uu_tien: "Bình thường",
    qua_kem: "Chứng nhận",
    nguoi_duyet: "Uỷ viên Chuyên môn",
    an: false,
  });

  const luuHat = async (h: Hat) => {
    try {
      const d = await goi({ action: "hat-luu", hat: h });
      toast.success(d.moi ? `Đã tạo hạt ${h.ma}` : `Đã lưu hạt ${h.ma}`);
      setDangSua(null);
      await taiHat();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu hạt");
    }
  };

  const anHat = async (h: Hat) => {
    try {
      await goi({ action: "hat-an", ma: h.ma, an: !h.an });
      toast.success(h.an ? `Đã mở lại ${h.ma}` : `Đã đóng ${h.ma} — hạt rời chợ`);
      await taiHat();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi đóng/mở hạt");
    }
  };

  const xoaHat = async (h: Hat) => {
    if (!confirm(`Xoá hẳn hạt ${h.ma}? Chỉ xoá được khi chưa ai nhận.`)) return;
    try {
      await goi({ action: "hat-xoa", ma: h.ma });
      toast.success(`Đã xoá ${h.ma}`);
      await taiHat();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xoá hạt");
    }
  };

  /* ── phân quyền ── */
  const themQuyen = async (n: Nguoi, vai_tro: string) => {
    try {
      await goi({ action: "nguoi-them", email: n.email, ten: n.ten, vai_tro });
      toast.success(`Đã gán ${vai_tro === "quan_tri" ? "quản trị sàn" : "người duyệt"} cho ${n.ten}`);
      await taiQuyen();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi gán quyền");
    }
  };

  const boQuyen = async (email: string) => {
    if (!confirm(`Bỏ quyền của ${email}?`)) return;
    try {
      await goi({ action: "nguoi-xoa", email });
      toast.success("Đã bỏ quyền");
      await taiQuyen();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi bỏ quyền");
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

  const hatHien = hats.filter((h) => {
    const k = qHat.trim().toLowerCase();
    if (!k) return true;
    return (
      h.ma.toLowerCase().includes(k) ||
      h.ten.toLowerCase().includes(k) ||
      (h.ten_nhom || "").toLowerCase().includes(k)
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
            {hats.length} hạt · {dem.tong} lượt nhận · nghiệm thu, danh mục hạt, phân quyền
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              taiLuot();
              taiHat();
              taiQuyen();
            }}
            disabled={loading}
          >
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

      <div className="flex gap-1 border-b border-border/40">
        {[
          ["luot", "Lượt nhận hạt"],
          ["hat", "Danh mục hạt"],
          ["quyen", "Phân quyền"],
        ].map(([k, nhan]) => (
          <button
            key={k}
            onClick={() => setTab(k as typeof tab)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              tab === k
                ? "border-primary text-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {nhan}
          </button>
        ))}
      </div>

      {/* ───────────── LƯỢT NHẬN ───────────── */}
      {tab === "luot" && (
        <>
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
                    <div className="font-medium mt-1">{r.ten}</div>
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
                      {MUC_CHAM.map((m) => (
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

                <div className="flex items-center gap-2 flex-wrap">
                  <KeyRound className="size-4 text-muted-foreground shrink-0" />
                  {nguoiCapQuyen[r.id] ? (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded bg-white/5 border border-border/40">
                        {nguoiCapQuyen[r.id]!.ten} · {nguoiCapQuyen[r.id]!.email}
                      </span>
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setNguoiCapQuyen((v) => ({ ...v, [r.id]: null }))}
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <ChonNguoi
                      onChon={(n) => setNguoiCapQuyen((v) => ({ ...v, [r.id]: n }))}
                      placeholder="Cấp quyền xem minh chứng cho ai? (tên / email / SĐT)"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => capQuyen(r)}
                    disabled={!nguoiCapQuyen[r.id] || dangChay === r.id}
                  >
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
        </>
      )}

      {/* ───────────── DANH MỤC HẠT ───────────── */}
      {tab === "hat" && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={() => setDangSua(moiHat())}>
              <Plus className="size-4" />
              <span className="ml-2">Tạo hạt mới</span>
            </Button>
            <Input
              placeholder="Tìm hạt theo mã, tên hoặc nhóm…"
              value={qHat}
              onChange={(e) => setQHat(e.target.value)}
              className="max-w-sm"
            />
            <span className="text-sm text-muted-foreground">{hatHien.length} hạt</span>
          </div>

          {dangSua && (
            <FormHat
              hat={dangSua}
              setHat={setDangSua}
              khoaMa={hats.some((x) => x.ma === dangSua.ma)}
              onLuu={luuHat}
              onHuy={() => setDangSua(null)}
            />
          )}

          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="px-4 py-3">Mã</th>
                  <th className="px-4 py-3">Việc</th>
                  <th className="px-4 py-3">Nhóm</th>
                  <th className="px-4 py-3">Bậc</th>
                  <th className="px-4 py-3 text-right">Điểm</th>
                  <th className="px-4 py-3 text-right">Chỗ</th>
                  <th className="px-4 py-3 text-right">Đã nhận</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {hatHien.map((h) => (
                  <tr key={h.ma} className="border-b border-border/20 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs">{h.ma}</td>
                    <td className="px-4 py-3 max-w-[380px]">{h.ten}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{h.ten_nhom}</td>
                    <td className="px-4 py-3">{h.bac}</td>
                    <td className="px-4 py-3 text-right">{fmt(h.diem)}</td>
                    <td className="px-4 py-3 text-right">{h.so_cho}</td>
                    <td className="px-4 py-3 text-right">{h.da_nhan || 0}</td>
                    <td className="px-4 py-3">
                      {h.an ? (
                        <span className="text-[11px] px-2 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-300">
                          Đã đóng
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                          Đang mở
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setDangSua({ ...h })}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => anHat(h)} title={h.an ? "Mở lại" : "Đóng hạt"}>
                          {h.an ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => xoaHat(h)}
                          disabled={(h.da_nhan || 0) > 0}
                          title={(h.da_nhan || 0) > 0 ? "Đã có người nhận — chỉ đóng được" : "Xoá"}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ───────────── PHÂN QUYỀN ───────────── */}
      {tab === "quyen" && (
        <>
          <Card className="p-5 space-y-4">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Users className="size-4" /> Gán quyền cho người trong hệ thống NOOI
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Bước 1: tìm người (tên / email / số điện thoại). Bước 2: chọn quyền. Bước 3: bấm{" "}
                <b>Xác nhận gắn quyền</b> — chưa xác nhận thì chưa có hiệu lực.
              </p>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                1 · Chọn người
              </div>
              {chon ? (
                <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
                  <span className="size-11 rounded-full bg-primary/20 text-primary font-semibold grid place-items-center shrink-0">
                    {chon.ten.trim().split(/\s+/).slice(-1)[0]?.slice(0, 2).toUpperCase() || "?"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{chon.ten}</div>
                    <div className="text-sm text-muted-foreground break-all">
                      {chon.email || "(không email)"}
                      {chon.dien_thoai ? ` · ${chon.dien_thoai}` : " · chưa khai số điện thoại"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {chon.cap_do ? `Cấp ${chon.cap_do}` : "Chưa xếp cấp"}
                      {chon.ngay_tao
                        ? ` · tham gia ${chon.ngay_tao.slice(0, 10).split("-").reverse().join("/")}`
                        : ""}
                      {chon.slug ? ` · /u/${chon.slug}` : ""}
                    </div>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => {
                      setChon(null);
                      setVaiTro("");
                    }}
                    title="Chọn người khác"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              ) : (
                <ChonNguoi onChon={(n) => setChon(n)} placeholder="Tìm theo tên, email hoặc số điện thoại…" />
              )}
            </div>

            <div className={chon ? "" : "opacity-50 pointer-events-none"}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">2 · Chọn quyền</div>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  {
                    ma: "quan_tri" as const,
                    ten: "Quản trị sàn",
                    mo_ta:
                      "Toàn quyền trên sàn việc: tạo / sửa / đóng / xoá hạt, chấm điểm nghiệm thu, trả quả, cấp quyền xem minh chứng và gán quyền cho người khác.",
                    duoc: ["Tạo, sửa, đóng, xoá hạt", "Chấm điểm & trả quả", "Cấp quyền xem minh chứng", "Gán quyền cho người khác"],
                    khong: [],
                  },
                  {
                    ma: "nguoi_duyet" as const,
                    ten: "Người duyệt",
                    mo_ta:
                      "Chỉ làm việc nghiệm thu: xem danh sách lượt nhận, đọc báo cáo và tải minh chứng, chấm điểm 0/50/80/100/130%. Không đụng vào danh mục hạt và quyền hạn.",
                    duoc: ["Xem lượt nhận hạt", "Đọc báo cáo & minh chứng", "Chấm điểm nghiệm thu"],
                    khong: ["Không sửa/xoá hạt", "Không trả quả", "Không phân quyền"],
                  },
                ].map((q) => {
                  const on = vaiTro === q.ma;
                  return (
                    <button
                      key={q.ma}
                      type="button"
                      onClick={() => setVaiTro(q.ma)}
                      className={`text-left rounded-lg border p-3 transition-colors ${
                        on ? "border-primary bg-primary/10" : "border-border/50 hover:border-border"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-4 rounded-full border grid place-items-center ${
                            on ? "border-primary" : "border-muted-foreground/50"
                          }`}
                        >
                          {on && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        <span className="font-medium">{q.ten}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">{q.mo_ta}</p>
                      <div className="mt-2 space-y-0.5 text-xs">
                        {q.duoc.map((x) => (
                          <div key={x} className="text-emerald-300">
                            ✓ {x}
                          </div>
                        ))}
                        {q.khong.map((x) => (
                          <div key={x} className="text-red-300/80">
                            ✕ {x}
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end border-t border-border/30 pt-3">
              <span className="text-sm text-muted-foreground mr-auto">
                {!chon
                  ? "Chưa chọn người"
                  : !vaiTro
                    ? "Chưa chọn quyền"
                    : `Sắp gán: ${chon.ten} → ${vaiTro === "quan_tri" ? "Quản trị sàn" : "Người duyệt"}`}
              </span>
              <Button variant="ghost" disabled={!chon && !vaiTro} onClick={() => { setChon(null); setVaiTro(""); }}>
                Huỷ
              </Button>
              <Button
                disabled={!chon || !vaiTro}
                onClick={async () => {
                  if (!chon || !vaiTro) return;
                  await themQuyen(chon, vaiTro);
                  setChon(null);
                  setVaiTro("");
                }}
              >
                Xác nhận gắn quyền
              </Button>
            </div>
          </Card>

          <Card className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="px-4 py-3">Người</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Vai trò</th>
                  <th className="px-4 py-3">Gán lúc</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {quyen.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                      Chưa gán quyền riêng cho ai. Các email gốc luôn có quyền quản trị:
                      <span className="ml-1 font-mono text-xs">{quyenGoc.join(", ") || "(chưa đặt)"}</span>
                    </td>
                  </tr>
                )}
                {quyen.map((r) => (
                  <tr key={r.email} className="border-b border-border/20 last:border-0">
                    <td className="px-4 py-3">{r.ten || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.email}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded border ${
                          r.vai_tro === "quan_tri"
                            ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                            : "border-sky-500/30 bg-sky-500/10 text-sky-300"
                        }`}
                      >
                        {r.vai_tro === "quan_tri" ? "Quản trị sàn" : "Người duyệt"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.luc?.slice(0, 16)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => boQuyen(r.email)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── form hạt ───────────────────────── */

function FormHat({
  hat,
  setHat,
  khoaMa,
  onLuu,
  onHuy,
}: {
  hat: Hat;
  setHat: (h: Hat) => void;
  khoaMa?: boolean;
  onLuu: (h: Hat) => void;
  onHuy: () => void;
}) {
  const o = (nhan: string, noi_dung: React.ReactNode) => (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{nhan}</span>
      <div className="mt-1">{noi_dung}</div>
    </label>
  );
  const set = (k: keyof Hat, v: unknown) => setHat({ ...hat, [k]: v } as Hat);

  return (
    <Card className="p-5 space-y-4 border-primary/30">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{hat.ten ? `Sửa hạt ${hat.ma}` : "Tạo hạt mới"}</h2>
        <button className="text-muted-foreground hover:text-foreground" onClick={onHuy}>
          <X className="size-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {o(
          "Mã hạt",
          <Input
            value={hat.ma}
            disabled={khoaMa}
            onChange={(e) => set("ma", e.target.value.toUpperCase())}
            className="font-mono disabled:opacity-60"
          />
        )}
        {o(
          "Nhóm",
          <select
            value={hat.nhom}
            disabled={khoaMa}
            onChange={(e) =>
              setHat({
                ...hat,
                nhom: e.target.value,
                ma: `${e.target.value}-${hat.ma.split("-")[1] || "01"}`,
              })
            }
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {NHOM.map(([k, v]) => (
              <option key={k} value={k}>
                {k} — {v}
              </option>
            ))}
          </select>
        )}
        {o(
          "Bậc",
          <select
            value={hat.bac}
            onChange={(e) => set("bac", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {BAC.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        )}
        {o(
          "Điểm",
          <Input
            type="number"
            step={100}
            value={hat.diem}
            onChange={(e) => set("diem", Number(e.target.value))}
          />
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {o(
          "Số chỗ",
          <Input type="number" min={1} value={hat.so_cho} onChange={(e) => set("so_cho", Number(e.target.value))} />
        )}
        {o("Hạn", <Input type="date" value={hat.han} onChange={(e) => set("han", e.target.value)} />)}
        {o(
          "Ưu tiên",
          <select
            value={hat.uu_tien}
            onChange={(e) => set("uu_tien", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {UU_TIEN.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        )}
        {o(
          "Quà kèm",
          <select
            value={hat.qua_kem}
            onChange={(e) => set("qua_kem", e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            {QUA_KEM.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        )}
      </div>

      {o(
        "Tên hạt",
        <Input
          value={hat.ten}
          onChange={(e) => set("ten", e.target.value)}
          placeholder="Ví dụ: Hoàn thành thủ tục thuê môi trường rừng"
        />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {o(
          "Mô tả việc",
          <textarea
            value={hat.mo_ta || ""}
            onChange={(e) => set("mo_ta", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        )}
        {o(
          "Sản phẩm bàn giao",
          <textarea
            value={hat.san_pham || ""}
            onChange={(e) => set("san_pham", e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {o("Tiêu chí nghiệm thu", <Input value={hat.tieu_chi || ""} onChange={(e) => set("tieu_chi", e.target.value)} />)}
        {o("Cần cho ai", <Input value={hat.doi_tuong || ""} onChange={(e) => set("doi_tuong", e.target.value)} />)}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {o("Người duyệt", <Input value={hat.nguoi_duyet || ""} onChange={(e) => set("nguoi_duyet", e.target.value)} />)}
        {o(
          "Trạng thái",
          <select
            value={hat.an ? "an" : "mo"}
            onChange={(e) => set("an", e.target.value === "an")}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="mo">Đang mở trên chợ</option>
            <option value="an">Đã đóng (ẩn khỏi chợ)</option>
          </select>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onHuy}>
          Huỷ
        </Button>
        <Button onClick={() => onLuu(hat)} disabled={!hat.ten || !hat.ma}>
          Lưu hạt
        </Button>
      </div>
    </Card>
  );
}
