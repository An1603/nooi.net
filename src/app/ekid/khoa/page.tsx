import { KID } from "@/components/ekid/child/kid-theme";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tài khoản tạm khoá — eKid",
};

/**
 * Trang tạm khoá của phân hệ con (tông trẻ em). Middleware rewrite về đây khi tài khoản
 * con có status = "khoa". Header + footer NOOI đã có sẵn ở layout /ekid.
 */
export default function EkidLockedPage() {
  return (
    <div className="mx-auto max-w-md py-6">
      <div className={`${KID.cardPad} flex flex-col items-center gap-4 text-center`}>
        <span aria-hidden className="text-6xl">
          🔒
        </span>
        <h1 className={KID.h1}>Tài khoản đang tạm khoá</h1>
        <p className={`${KID.textSoft} text-lg`}>
          Tài khoản của con đang tạm khoá. Nhờ bố/mẹ mở lại nhé!
        </p>
      </div>
    </div>
  );
}
