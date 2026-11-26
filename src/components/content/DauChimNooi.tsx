import { cn } from "@/lib/utils";

/**
 * Dấu chìm NOOI trôi chậm trên khung video (chống rò rỉ + ghi dấu thương hiệu).
 *
 * Ngài An chốt 26/11/2026: “hình mờ chạy qua lại ở màn hình video đang là email
 * kythuat360@gmail.com — hãy đổi thành logo NOOI màu trắng nhỏ hoặc chữ NOOI©”.
 *
 * Dùng chữ “NOOI” trắng cắt sẵn từ bộ nhận diện (`/brand/nooi-chu-trang.png` — bản ngang đã bỏ
 * dòng chú thích “Kết nối chuyển mình” vì thu nhỏ là nhoè) kèm dấu ©. Chuyển động do lớp
 * `.dau-chim-troi` trong `globals.css`; máy bật “giảm chuyển động” thì dấu chìm đứng yên một chỗ.
 */
export function DauChimNooi({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "dau-chim-troi pointer-events-none absolute z-20 flex select-none items-center gap-0.5",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/nooi-chu-trang.png" alt="" className="h-[15px] w-auto opacity-55" />
      <span className="text-[10px] font-semibold leading-none text-white/55">©</span>
    </span>
  );
}
