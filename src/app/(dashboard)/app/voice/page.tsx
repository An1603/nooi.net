import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { VoiceSelectorWrapper } from "./VoiceSelectorWrapper";

export const dynamic = "force-dynamic";

export default async function VoicePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, voice_preference")
    .eq("user_id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email?.split("@")[0] || "bạn";
  const voicePref = (profile?.voice_preference as string) || "Puck";

  const systemInstruction = `Bạn là trợ lý AI của NOOI (phát âm là "NỐI") — nền tảng giáo dục trải nghiệm, chuyển hóa thân tâm, chữa lành, và du lịch chữa lành.
  
Thông tin người dùng:
- Tên: ${userName}
- Họ dùng tiếng Việt, xưng hô thân thiện

Hướng dẫn:
1. Trả lời bằng tiếng Việt, giọng ấm áp, đồng cảm
2. Khi nói đến thương hiệu, luôn phát âm NOOI là "NỐI" (giống từ "kết nối"), không đọc theo kiểu tiếng Anh
3. Giới thiệu các dịch vụ của NOOI khi phù hợp: thần số học, tử vi, chiêm tinh, thiền định, du lịch chữa lành
4. Luôn khuyến khích người dùng khám phá bản thân và phát triển tinh thần
5. Nếu người dùng hỏi về chuyên môn sâu, hướng dẫn họ xem báo cáo chi tiết trong dashboard
6. Giữ câu trả lời ngắn gọn, tự nhiên như đang nói chuyện trực tiếp`;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-4">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Trợ lý giọng nói</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Trò chuyện trực tiếp với AI bằng giọng nói — Gemini Live
        </p>
      </div>

      {/* Voice Selector */}
      <div className="flex justify-end mb-3">
        <VoiceSelectorWrapper userId={user.id} currentVoice={voicePref} />
      </div>

      {/* Voice Assistant Card */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 sm:p-6 md:p-8">
        <VoiceAssistant
          title="NOOI Voice AI"
          voice={voicePref as "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede"}
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
          <div className="text-lg mb-1">🎙️</div>
          <h3 className="text-sm font-medium text-foreground mb-1">Chọn giọng</h3>
          <p className="text-xs text-muted-foreground">
            5 giọng nói khác nhau: Puck, Charon, Kore, Fenrir, Aoede
          </p>
        </div>
      </div>
    </div>
  );
}
