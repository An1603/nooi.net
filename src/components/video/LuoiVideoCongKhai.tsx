"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Play } from "lucide-react";
import { tenDanhMuc } from "@/lib/video/danh-muc";
import { xetQuyenXem, type NguoiXem, type VideoCongKhai } from "@/lib/video/quyen-xem";
import { HopDangNhap } from "@/components/video/HopDangNhap";

/** 92 → "1:32". Không có thời lượng thì trả về null (không hiện gì). */
function phutGiay(giay?: number | null): string | null {
  if (!giay || giay <= 0) return null;
  const m = Math.floor(giay / 60);
  const s = Math.round(giay % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const TAT_CA = "tat-ca";

interface Props {
  videos: VideoCongKhai[];
  nguoi: NguoiXem;
}

/**
 * Lưới video công khai — kiểu xem như `/gallery` (lưới đều nhau + dải lọc theo nhóm) nhưng giữ
 * đúng nhận diện NOOI: dùng token màu của hệ thống, bo góc 14px như thư viện ảnh.
 *
 * Video bị khoá vẫn HIỆN (để người xem biết có gì) nhưng phủ ổ khoá; bấm vào thì hiện hộp đăng
 * nhập ngay tại chỗ, đăng nhập xong quay lại đúng video đó.
 */
export function LuoiVideoCongKhai({ videos, nguoi }: Props) {
  const [loc, setLoc] = useState<string>(TAT_CA);
  const [videoKhoa, setVideoKhoa] = useState<VideoCongKhai | null>(null);

  const nhoms = useMemo(() => {
    const dem = new Map<string, number>();
    videos.forEach((v) => {
      const k = v.danh_muc || "";
      dem.set(k, (dem.get(k) || 0) + 1);
    });
    return [...dem.entries()].map(([slug, so]) => ({ slug, so, ten: tenDanhMuc(slug) || "Khác" }));
  }, [videos]);

  const hienThi = useMemo(
    () => (loc === TAT_CA ? videos : videos.filter((v) => (v.danh_muc || "") === loc)),
    [videos, loc]
  );

  const soKhoa = useMemo(
    () => videos.reduce((t, v) => t + (xetQuyenXem(v, nguoi).mo ? 0 : 1), 0),
    [videos, nguoi]
  );

  if (videos.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Kho video đang được cập nhật.
      </p>
    );
  }

  return (
    <div>
      {/* Dải lọc theo nhóm — chỉ hiện khi có từ 2 nhóm trở lên */}
      {nhoms.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLoc(TAT_CA)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              loc === TAT_CA
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            Tất cả · {videos.length}
          </button>
          {nhoms.map((n) => (
            <button
              key={n.slug}
              type="button"
              onClick={() => setLoc(n.slug)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                loc === n.slug
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {n.ten} · {n.so}
            </button>
          ))}
        </div>
      )}

      {soKhoa > 0 && (
        <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Lock size={13} className="text-primary" />
          {nguoi.daDangNhap
            ? `${soKhoa} video cần điều kiện xem — bấm vào để biết thêm.`
            : `${soKhoa} video dành cho thành viên — bấm vào để đăng nhập.`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {hienThi.map((v) => {
          const kq = xetQuyenXem(v, nguoi);
          const thoiLuong = phutGiay(v.duration);
          const laDoc = v.khung_hinh === "doc";

          const lopTrong = (
            <>
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/40">
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnail_url}
                    alt={v.title}
                    loading="lazy"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Play size={26} />
                  </span>
                )}

                {/* Nhãn khung hình — cho biết video dọc/nằm ngay từ lưới */}
                <span className="absolute left-2 top-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium text-white/90">
                  {laDoc ? "Dọc" : "Ngang"}
                </span>

                {thoiLuong && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                    {thoiLuong}
                  </span>
                )}

                {/* Video mở được: nút phát hiện khi rê chuột */}
                {kq.mo ? (
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="flex size-11 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg">
                      <Play size={18} className="ml-0.5" />
                    </span>
                  </span>
                ) : (
                  // Video bị khoá: phủ ổ khoá + nhãn lý do
                  <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55">
                    <span className="flex size-11 items-center justify-center rounded-full bg-black/70 text-white">
                      <Lock size={18} />
                    </span>
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground">
                      {kq.nhan || "Cần quyền"}
                    </span>
                  </span>
                )}
              </div>

              <div className="p-2.5">
                <h3 className="line-clamp-2 text-[13px] font-medium leading-snug">{v.title}</h3>
                {v.danh_muc && (
                  <p className="mt-1 text-[11px] text-muted-foreground">{tenDanhMuc(v.danh_muc)}</p>
                )}
              </div>
            </>
          );

          const lopNgoai =
            "group block overflow-hidden rounded-[14px] border border-border bg-card text-left transition-colors hover:border-primary/50";

          // Mở được → đi tới trang xem; bị khoá → mở hộp đăng nhập ngay tại chỗ
          return kq.mo ? (
            <Link key={v.id} href={`/video/${v.id}`} className={lopNgoai}>
              {lopTrong}
            </Link>
          ) : (
            <button key={v.id} type="button" onClick={() => setVideoKhoa(v)} className={lopNgoai}>
              {lopTrong}
            </button>
          );
        })}
      </div>

      <HopDangNhap
        mo={!!videoKhoa}
        tieuDeVideo={videoKhoa?.title}
        moTa={
          videoKhoa
            ? xetQuyenXem(videoKhoa, nguoi).moTa
            : "Video này dành cho thành viên NOOI. Đăng nhập để xem tiếp."
        }
        quayLai={videoKhoa ? `/video/${videoKhoa.id}` : "/video"}
        onDong={() => setVideoKhoa(null)}
      />
    </div>
  );
}
