"use client";
import type { ReactNode } from "react";
import type {
  CanChi,
  DaiHan,
  NamHan,
  NguHanh,
  NguHanhTuongSinh,
  PhanTichItem,
  TuViResult,
} from "@/lib/tuvi/types";
import { NGU_HANH } from "@/lib/tuvi/constants";

/** Tên tiếng Việt của một hành trong ngũ hành. */
function hanhName(hanh: NguHanh): string {
  return NGU_HANH[hanh]?.name ?? hanh;
}

/** Nhãn tiếng Việt cho quan hệ tương sinh / tương khắc. */
const SINH_KHAC_LABEL: Record<NguHanhTuongSinh, string> = {
  tuong_sinh: "Tương sinh",
  tuong_khac: "Tương khắc",
  binh_thuong: "Bình thường",
};

/** Màu nhấn cho quan hệ tương sinh / tương khắc (dùng cho con chip). */
const SINH_KHAC_TONE: Record<NguHanhTuongSinh, string> = {
  tuong_sinh: "text-n-green",
  tuong_khac: "text-n-rose",
  binh_thuong: "text-muted-foreground",
};

/** Các lĩnh vực luận giải Tử vi — key ánh xạ sang nhãn + icon. */
const PHAN_TICH_FIELDS: { key: keyof TuViResult["phanTich"]; label: string; icon: string }[] = [
  { key: "tinhCach", label: "Tính cách", icon: "💬" },
  { key: "suNghiep", label: "Sự nghiệp", icon: "💼" },
  { key: "tinhDuyen", label: "Tình duyên", icon: "💞" },
  { key: "sucKhoe", label: "Sức khỏe", icon: "💪" },
  { key: "giaDao", label: "Gia đạo", icon: "🏠" },
  { key: "taiLoc", label: "Tài lộc", icon: "💰" },
  { key: "vanHan", label: "Vận hạn", icon: "🎢" },
];

/** Bốn cặp tương sinh khắc trong lá số. */
const SINH_KHAC_PAIRS: { key: keyof TuViResult["tuongSinhKhac"]; label: string }[] = [
  { key: "menhCuc", label: "Mệnh ↔ Cục" },
  { key: "namThang", label: "Năm ↔ Tháng" },
  { key: "thangNgay", label: "Tháng ↔ Ngày" },
  { key: "ngayGio", label: "Ngày ↔ Giờ" },
];

/**
 * Thẻ luận giải chi tiết Tử vi phương Đông — render ĐẦY ĐỦ mọi field của TuViResult:
 * âm lịch, Tứ trụ, Thân chủ, Bản mệnh, Cục, Cung Mệnh/Thân, Đại hạn, tương sinh khắc,
 * 7 lĩnh vực luận giải và vận hạn năm hiện tại.
 */
export function TuViDetail({ result }: { result: TuViResult | null }) {
  if (!result) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-6 text-center">
        <p className="text-sm text-destructive">
          Không tính được bản đồ Tử vi cho hồ sơ này. Vui lòng kiểm tra lại ngày sinh, giờ sinh và giới tính.
        </p>
      </div>
    );
  }

  const { tuTru, tuongSinhKhac, phanTich } = result;

  return (
    <div className="space-y-5">
      {/* ── 1. Âm lịch & Tứ trụ ── */}
      <Section title="Nhật kỳ âm lịch" icon="🌙">
        <LunarCard result={result} />
      </Section>

      {/* ── 2. Tứ trụ (Can Chi năm/tháng/ngày/giờ) ── */}
      <Section title="Tứ trụ (Can Chi)" icon="☯️">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <CanChiCard label="Năm" canChi={tuTru.nam} />
          <CanChiCard label="Tháng" canChi={tuTru.thang} />
          <CanChiCard label="Ngày" canChi={tuTru.ngay} />
          <CanChiCard label="Giờ" canChi={tuTru.gio} />
        </div>
      </Section>

      {/* ── 3. Thân chủ, Bản mệnh & Cục ── */}
      <Section title="Thân chủ, Bản mệnh & Cục" icon="🧬">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard
            title="Thân chủ"
            subtitle="Thiên can của ngày sinh"
            value={result.thanChu.name}
            meta={`Hành ${hanhName(result.thanChu.hanh)}`}
            meaning={result.thanChu.meaning}
          />
          <InfoCard
            title="Bản mệnh"
            subtitle="Nạp âm ngũ hành"
            value={result.banMenh.napAm}
            meta={`Hành ${result.banMenh.hanhName}`}
            meaning={result.banMenh.meaning}
          />
          <InfoCard
            title="Cục"
            subtitle={`Cục số ${result.cuc.value}`}
            value={result.cuc.name}
            meta={`Hành ${hanhName(result.cuc.hanh)}`}
            meaning={result.cuc.meaning}
          />
        </div>
      </Section>

      {/* ── 4. Cung Mệnh & Cung Thân ── */}
      <Section title="Cung Mệnh & Cung Thân" icon="🏛️">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoCard
            title="Cung Mệnh"
            subtitle="Định hình cá tính, năng lực bẩm sinh"
            value={result.cungMenh.name}
            meta={`Hành ${hanhName(result.cungMenh.hanh)}`}
            meaning={result.cungMenh.meaning}
          />
          <InfoCard
            title="Cung Thân"
            subtitle="Chi phối nửa sau cuộc đời"
            value={result.cungThan.name}
            meta={`Hành ${hanhName(result.cungThan.hanh)}`}
            meaning={result.cungThan.meaning}
          />
        </div>
      </Section>

      {/* ── 5. Đại hạn (danh sách đủ từng giai đoạn) ── */}
      <Section title="Đại hạn 10 năm" icon="📆">
        <DaiHanList daiHan={result.daiHan} />
      </Section>

      {/* ── 6. Tương sinh tương khắc ── */}
      <Section title="Tương sinh tương khắc" icon="⚖️">
        <SinhKhacGrid pairs={tuongSinhKhac} />
      </Section>

      {/* ── 7. Luận giải 7 lĩnh vực ── */}
      <Section title="Luận giải chi tiết" icon="📖">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PHAN_TICH_FIELDS.map((f) => (
            <PhanTichCard key={f.key} icon={f.icon} label={f.label} item={phanTich[f.key]} />
          ))}
        </div>
      </Section>

      {/* ── 8. Vận hạn năm hiện tại ── */}
      <Section title="Vận hạn năm hiện tại" icon="🌟">
        <NamHanCard namHan={result.namHienTai} />
      </Section>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Khối dựng chung
 * ──────────────────────────────────────────────────────────────────────────── */

function Section({ title, icon, children }: { title: string; icon: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span aria-hidden>{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Thẻ âm lịch: năm/tháng/ngày + cờ nhuận. */
function LunarCard({ result }: { result: TuViResult }) {
  const { lunarDate } = result;
  const nhuận = lunarDate.nhuan ? " (tháng nhuận)" : "";
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <span className="text-3xl font-bold text-n-gold">{lunarDate.ngay}</span>
        <span className="text-lg font-semibold text-foreground">
          tháng {lunarDate.thang}
          {nhuận}
        </span>
        <span className="text-base text-foreground">năm {lunarDate.nam}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Ngày sinh âm lịch — căn cứ lập lá số Tử vi cùng Tứ trụ và Cục.
      </p>
    </div>
  );
}

/** Thẻ một trụ Can Chi (năm/tháng/ngày/giờ): tên đầy đủ + ý nghĩa của can. */
function CanChiCard({ label, canChi }: { label: string; canChi: CanChi }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <header className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-foreground/80">
          Hành {hanhName(canChi.chi.hanh)}
        </span>
      </header>
      <p className="text-xl font-bold text-n-gold">{canChi.fullName}</p>
      <div className="space-y-1 text-xs text-foreground/85">
        <p>
          <span className="text-muted-foreground">Can:</span> {canChi.can.name} — {hanhName(canChi.can.hanh)}
        </p>
        <p>
          <span className="text-muted-foreground">Chi:</span> {canChi.chi.name} — {hanhName(canChi.chi.hanh)}
        </p>
      </div>
      {canChi.can.meaning ? (
        <p className="text-xs leading-relaxed text-foreground/80">{canChi.can.meaning}</p>
      ) : null}
    </article>
  );
}

/** Thẻ thông tin gọn: giá trị lớn + meta + luận giải (dùng cho Thân chủ/Bản mệnh/Cục/Cung). */
function InfoCard({
  title,
  subtitle,
  value,
  meta,
  meaning,
}: {
  title: string;
  subtitle: string;
  value: string;
  meta?: string;
  meaning?: string;
}) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
      <p className="text-2xl font-bold text-n-gold">{value}</p>
      {meta ? <p className="text-xs font-medium text-foreground/80">{meta}</p> : null}
      {meaning ? <p className="text-xs leading-relaxed text-foreground/85">{meaning}</p> : null}
    </article>
  );
}

/** Danh sách đại hạn: liệt kê đủ từng giai đoạn 10 năm với cung + khoảng tuổi. */
function DaiHanList({ daiHan }: { daiHan: DaiHan[] }) {
  if (daiHan.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu đại hạn.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {daiHan.map((dh, i) => (
        <div
          key={`${dh.tuoiBatDau}-${i}`}
          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/70 px-3 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{dh.cung.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {dh.tuoiBatDau}–{dh.tuoiKetThuc} tuổi
            </p>
          </div>
          <span className="shrink-0 text-xs text-n-gold">{dh.thoiGian}</span>
        </div>
      ))}
    </div>
  );
}

/** Lưới bốn cặp tương sinh khắc. */
function SinhKhacGrid({ pairs }: { pairs: TuViResult["tuongSinhKhac"] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {SINH_KHAC_PAIRS.map((p) => {
        const value = pairs[p.key];
        return (
          <div
            key={p.key}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card/70 px-3 py-2.5"
          >
            <p className="text-sm font-medium text-foreground">{p.label}</p>
            <span className={`text-xs font-semibold ${SINH_KHAC_TONE[value]}`}>{SINH_KHAC_LABEL[value]}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Thẻ luận giải một lĩnh vực: nội dung + chi tiết + lời khuyên. */
function PhanTichCard({ icon, label, item }: { icon: string; label: string; item: PhanTichItem }) {
  return (
    <article className="space-y-3 rounded-2xl border border-border bg-card/70 p-4">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span aria-hidden>{icon}</span>
        {label}
      </h4>
      {item.noidung ? (
        <p className="text-sm leading-relaxed text-foreground/90">{item.noidung}</p>
      ) : null}
      {item.chiTiet.length > 0 ? (
        <ul className="space-y-1.5">
          {item.chiTiet.map((c) => (
            <li key={c} className="flex gap-2 text-xs leading-relaxed text-foreground/80">
              <span aria-hidden className="mt-0.5 text-n-gold">
                •
              </span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {item.loiKhuyen ? (
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-2">
          <p className="text-xs font-medium text-n-purple">Lời khuyên</p>
          <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">{item.loiKhuyen}</p>
        </div>
      ) : null}
    </article>
  );
}

/** Thẻ vận hạn năm hiện tại. */
function NamHanCard({ namHan }: { namHan: NamHan }) {
  return (
    <article className="space-y-2 rounded-2xl border border-border bg-card/70 p-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h4 className="text-xl font-bold text-n-gold">
          {namHan.nam} <span className="text-sm font-medium text-foreground">({namHan.amLich})</span>
        </h4>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs text-foreground/80">
          Hành {hanhName(namHan.hanh)}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Sao chiếu mệnh</p>
          <p className="text-sm font-medium text-foreground">{namHan.sao}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Hạn</p>
          <p className="text-sm font-medium text-foreground">{namHan.han}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Tuổi</p>
          <p className="text-sm font-medium text-foreground">
            {namHan.tuongKhacTuoi ? "Tương khắc tuổi" : "Hợp tuổi"}
          </p>
        </div>
      </div>

      {namHan.meaning ? (
        <p className="text-sm leading-relaxed text-foreground/90">{namHan.meaning}</p>
      ) : null}
    </article>
  );
}