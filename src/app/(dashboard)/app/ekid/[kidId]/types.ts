import type { KidSettings } from "@/lib/ekid/ekid-system";

/** Hồ sơ bé trả về từ GET /api/ekid/kids/[kidId] (đủ trường để dựng tab Tài khoản). */
export interface ConsoleKid {
  id: string;
  name: string;
  username?: string | null;
  date_of_birth?: string | null;
  avatar_emoji?: string | null;
  favorite_voice?: string | null;
  daily_limit_min?: number | null;
  placement_age_band?: string | null;
  placement_level?: number | null;
  status?: string | null;
  birth_time?: string | null;
  gender?: string | null;
  birth_place?: string | null;
}

/** Payload GET /api/ekid/kids/[kidId]. */
export interface KidDetail {
  kid: ConsoleKid;
  settings: KidSettings;
  is_owner: boolean;
  /** (v2.4) true khi user là CAREGIVER QUẢN LÝ đã liên kết (sửa hồ sơ/cài đặt, không đổi status). */
  is_admin_caregiver: boolean;
}

/** Bốn tab của console mỗi con. */
export const CONSOLE_TABS = ["account", "relatives", "report", "settings"] as const;
export type ConsoleTab = (typeof CONSOLE_TABS)[number];

/** Nhãn hiển thị cho từng tab. */
export const TAB_LABEL: Record<ConsoleTab, string> = {
  account: "Tài khoản",
  relatives: "Người thân",
  report: "Báo cáo",
  settings: "Cài đặt",
};

/** Kiểm tra chuỗi có phải một tab hợp lệ (mặc định "account"). */
export function parseTab(raw: string | undefined): ConsoleTab {
  return (CONSOLE_TABS as readonly string[]).includes(raw ?? "")
    ? (raw as ConsoleTab)
    : "account";
}
