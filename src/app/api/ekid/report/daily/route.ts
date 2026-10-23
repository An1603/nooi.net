import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readKid } from "@/lib/ekid/access";
import { dailyReport } from "@/lib/ekid/plan-server";

export const dynamic = "force-dynamic";

/**
 * GET /api/ekid/report/daily?kid_id=&day=YYYY-MM-DD
 * Báo cáo 5 dòng cho phụ huynh: thời lượng, nói được gì, vướng gì, tự giác, gợi ý cho bố mẹ.
 * Nói về VIỆC HỌC, không nói về việc dùng app.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const url = new URL(req.url);
  const kidId = url.searchParams.get("kid_id");
  if (!kidId) return NextResponse.json({ error: "Thiếu kid_id" }, { status: 400 });
  const day = url.searchParams.get("day") ?? undefined;

  const kid = await readKid(user.id, kidId);
  if (!kid) return NextResponse.json({ error: "Không có quyền" }, { status: 403 });

  const report = await dailyReport(kidId, day);

  const lines: string[] = [];
  if (report.graded === 0) {
    lines.push(`${report.kidName} chưa có phiên học nào hôm nay.`);
  } else {
    lines.push(
      `${report.kidName} học ${report.minutes} phút · ${report.sessions} phiên · ${report.graded} câu hỏi`,
    );
    lines.push(`Tự trả lời đúng (không gợi ý): ${report.correctNoHint}/${report.graded} câu (${report.rateNoHint}%)`);
    if (report.weakObjectives.length > 0) {
      lines.push(`Cần củng cố: ${report.weakObjectives.join(", ")}`);
    } else {
      lines.push("Không có phần nào sai lặp lại — bé đang nắm đều.");
    }
    lines.push(
      report.rateNoHint >= 60
        ? "Tự giác tốt: phần lớn câu bé tự nghĩ ra trước khi được gợi ý."
        : "Bé cần gợi ý khá nhiều — bố mẹ hỏi lại con 1 câu vào bữa tối sẽ giúp nhớ lâu hơn.",
    );
    lines.push(
      report.weakObjectives.length > 0
        ? "Gợi ý cho bố mẹ: nhờ con giảng lại phần đang vướng bằng ví dụ trong đời thường."
        : "Gợi ý cho bố mẹ: khen cụ thể việc con tự nghĩ, đừng khen chung 'giỏi quá'.",
    );
  }

  return NextResponse.json({ ...report, lines });
}
