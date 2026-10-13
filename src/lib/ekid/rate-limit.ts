// rate-limit.ts — Giới hạn tần suất TRONG TIẾN TRÌNH dùng chung cho các route eKid.
//
// ⚠️ KHÔNG phân tán: chạy trong 1 tiến trình Node. Nhiều instance → mỗi instance đếm
// riêng (đủ cho mục tiêu chống lạm dụng nhẹ; muốn chặt phải dùng Redis).

const hits = new Map<string, number[]>();

/**
 * Trả `true` nếu `key` đã vượt `max` lượt trong `windowMs` gần nhất.
 * Gọi hàm này ĐỒNG NGHĨA với việc ghi nhận một lượt.
 */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  // Dọn rác nhỏ: giữ map không phình vô hạn.
  if (hits.size > 500) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return false;
}
