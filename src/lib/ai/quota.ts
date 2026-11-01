/**
 * Hạn mức tin nhắn AI Mentor: 100 tin/ngày/người (chốt 01/11/2026).
 *
 * Đếm bằng bảng `ai_usage_daily` + hàm `tang_ai_usage` (nguyên tử, chống vượt hạn
 * mức khi nhiều request song song). Ngày tính theo giờ Việt Nam, không theo UTC.
 */
export const GIOI_HAN_TIN_NGAY = 100;

/** Số tin còn lại từ mức này trở xuống thì nhắc người dùng. */
export const NGUONG_CANH_BAO = 20;

export type HanMuc = {
  used: number;
  limit: number;
  remaining: number;
  canhBao: boolean;
  thongDiep?: string;
};

/** Ngày dạng YYYY-MM-DD theo Asia/Ho_Chi_Minh (en-CA cho đúng thứ tự năm-tháng-ngày). */
export function ngayVietNam(moc: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(moc);
}

export function taoHanMuc(used: number, limit: number = GIOI_HAN_TIN_NGAY): HanMuc {
  const daDung = Math.max(0, Math.floor(used));
  const conLai = Math.max(limit - daDung, 0);
  const canhBao = conLai <= NGUONG_CANH_BAO;

  let thongDiep: string | undefined;
  if (conLai === 0) {
    thongDiep = `Bạn đã dùng hết ${limit} tin nhắn AI Mentor hôm nay. Hạn mức làm mới sau 00:00 (giờ Việt Nam).`;
  } else if (canhBao) {
    thongDiep = `Bạn còn ${conLai}/${limit} tin nhắn AI Mentor hôm nay.`;
  }

  return { used: daDung, limit, remaining: conLai, canhBao, thongDiep };
}
