import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get user profile for personalization
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email?.split("@")[0] || "bạn";

  const systemInstruction = `Bạn là trợ lý AI của NOOI — nền tảng giáo dục trải nghiệm, chuyển hóa thân tâm, chữa lành, và du lịch chữa lành.
  
Thông tin người dùng:
- Tên: ${userName}
- Họ dùng tiếng Việt, xưng hô thân thiện

Hướng dẫn:
1. Trả lời bằng tiếng Việt, giọng ấm áp, đồng cảm
2. Giới thiệu các dịch vụ của NOOI khi phù hợp: thần số học, tử vi, chiêm tinh, thiền định, du lịch chữa lành
3. Luôn khuyến khích người dùng khám phá bản thân và phát triển tinh thần
4. Nếu người dùng hỏi về chuyên môn sâu, hướng dẫn họ xem báo cáo chi tiết trong dashboard
5. Giữ câu trả lời ngắn gọn, tự nhiên như đang nói chuyện trực tiếp`;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Trợ lý giọng nói</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Trò chuyện trực tiếp với AI bằng giọng nói — Gemini Live
        </p>
      </div>

      {/* Voice Assistant Card */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 md:p-8">
        <VoiceAssistant
          title="NOOI Voice AI"
          systemInstruction={systemInstruction}
        />
      </div>

      {/* Tips */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="text-lg mb-1">🎤</div>
          <h3 className="text-sm font-medium text-foreground mb-1">Bấm để nói</h3>
          <p className="text-xs text-muted-foreground">
            Bấm micro, nói câu hỏi của bạn, thả tay để gửi
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="text-lg mb-1">⚡</div>
          <h3 className="text-sm font-medium text-foreground mb-1">Phản hồi tức thì</h3>
          <p className="text-xs text-muted-foreground">
            Gemini AI trả lời bằng giọng nói real-time, có thể ngắt lời bất cứ lúc nào
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="text-lg mb-1">📱</div>
          <h3 className="text-sm font-medium text-foreground mb-1">Dùng trên mobile</h3>
          <p className="text-xs text-muted-foreground">
            Hoạt động trên Chrome Android và Safari iOS (14.5+)
          </p>
        </div>
      </div>
    </div>
  );
}
