"use client";

import { useEffect, useState } from "react";
import { Layers, Lock, Unlock, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const LEVELS = [
  { id: 1, name: "Người mới", required: 0 },
  { id: 2, name: "Người tìm kiếm", required: 100 },
  { id: 3, name: "Học viên", required: 300 },
  { id: 4, name: "Người thực hành", required: 600 },
  { id: 5, name: "Người đồng hành", required: 1000 },
  { id: 6, name: "Mentor", required: 1500 },
  { id: 7, name: "Master Mentor", required: 2500 },
];

const ALL_CARDS = [
  // Level 1
  { term: "Tánh biết", def: "Bầu trời trong vắt, nơi mọi hiện tượng đến rồi đi", icon: "☀️", level: 1 },
  { term: "Vô minh", def: "Không biết mình là ai, quên mất bản chất thật", icon: "🌫️", level: 1 },
  { term: "Chấp ngã", def: "Bám víu vào cái tôi, danh vọng, sở hữu", icon: "🔗", level: 1 },
  { term: "Tham", def: "Muốn đạt được những thứ cái tôi thấy thích", icon: "🫂", level: 1 },
  { term: "Sân", def: "Giận dữ với những thứ làm cái tôi đau", icon: "🔥", level: 1 },
  { term: "Si", def: "Nhìn cuộc đời qua lăng kính méo mó", icon: "🌫️", level: 1 },
  { term: "Nghiệp", def: "Hành động tạo ra kết quả, quán tính của thói quen", icon: "🔄", level: 1 },
  { term: "Luân hồi", def: "Vòng xoáy vô minh - chấp ngã - tham sân si", icon: "🌀", level: 1 },
  { term: "Quan sát", def: "Tách mình khỏi phản ứng tự động của thói quen", icon: "👁️", level: 1 },
  { term: "Nhận diện", def: "Gọi đúng tên cảm xúc đang hiện diện", icon: "🔍", level: 1 },
  { term: "Buông bỏ", def: "Thả lỏng sự bám víu vào kết quả mong đợi", icon: "🍃", level: 1 },
  { term: "Chuyển hóa", def: "Đưa tỉnh thức vào từng hành động hàng ngày", icon: "🦋", level: 1 },
  { term: "Chánh niệm", def: "Đưa sự chú ý về hiện tại, không phán xét", icon: "🧘", level: 1 },
  { term: "Tỉnh thức", def: "Biết mình đang làm gì, đang ở đâu, đang là ai", icon: "💡", level: 1 },
  { term: "Vô thường", def: "Mọi thứ liên tục thay đổi, không có gì cố định", icon: "🌊", level: 1 },
  { term: "Khổ", def: "Cảm giác bất toại nguyện khi sự việc không như ý", icon: "😔", level: 1 },
  // Level 2
  { term: "Thân", def: "Cơ thể vật chất, nơi cảm thọ sinh khởi", icon: "🧍", level: 2 },
  { term: "Tâm", def: "Khu vườn ký ức, nơi lưu giữ mọi trải nghiệm", icon: "🧠", level: 2 },
  { term: "Hành", def: "Ý chí và hành động xuất phát từ tâm", icon: "🏃", level: 2 },
  { term: "Cảm thọ", def: "Cảm giác dễ chịu, khó chịu hoặc trung tính", icon: "💭", level: 2 },
  { term: "Tư duy", def: "Dòng suy nghĩ miên man không dứt", icon: "💬", level: 2 },
  { term: "Nhận thức", def: "Chiếc kính màu bạn đeo để nhìn đời", icon: "👓", level: 2 },
  { term: "Ý chí", def: "Sức mạnh đưa nhận thức thành hành động", icon: "⚡", level: 2 },
  { term: "Thói quen", def: "Hành động lặp đi lặp lại trở thành tự động", icon: "🔁", level: 2 },
  { term: "Tính cách", def: "Tập hợp thói quen tạo nên con người bạn", icon: "🎭", level: 2 },
  { term: "Hoàn cảnh", def: "Kết quả của nghiệp, môi trường sống hiện tại", icon: "🌍", level: 2 },
  { term: "Vô ngã", def: "Không có cái tôi cố định, mọi thứ đều tương quan", icon: "☯️", level: 2 },
  { term: "Duyên khởi", def: "Mọi sự việc đều do nhiều nhân duyên hòa hợp", icon: "🌐", level: 2 },
  { term: "Chú tâm", def: "Đặt sự chú ý vào một đối tượng duy nhất", icon: "🎯", level: 2 },
  { term: "Định", def: "Tâm an trú, không bị xao lãng bởi ngoại cảnh", icon: "⛰️", level: 2 },
  { term: "Tuệ", def: "Trí tuệ thấy rõ bản chất thật của sự vật", icon: "🪷", level: 2 },
  { term: "Giới", def: "Nguyên tắc sống giúp tâm không hối hận", icon: "🛡️", level: 2 },
  // Level 3
  { term: "Hơi thở", def: "Cầu nối giữa thân và tâm, neo giữ hiện tại", icon: "💨", level: 3 },
  { term: "Thiền", def: "Thực hành đưa tâm về trạng thái an tĩnh", icon: "🧘", level: 3 },
  { term: "Tọa thiền", def: "Ngồi yên, quán sát thân-tâm không phán xét", icon: "🙏", level: 3 },
  { term: "Kinh hành", def: "Thiền đi bộ, đưa chánh niệm vào từng bước chân", icon: "🚶", level: 3 },
  { term: "Quét thân", def: "Quan sát toàn thân từ đầu đến chân", icon: "🔦", level: 3 },
  { term: "Biết ơn", def: "Chuyển góc nhìn từ thiếu thốn sang đủ đầy", icon: "🙏", level: 3 },
  { term: "Từ bi", def: "Mong cho mình và người được an vui", icon: "💖", level: 3 },
  { term: "Hỷ", def: "Vui với thành công và hạnh phúc của người khác", icon: "🎉", level: 3 },
  { term: "Xả", def: "Tâm bình thản trước lời khen chê, được mất", icon: "⚖️", level: 3 },
  { term: "Phước", def: "Năng lượng tích cực từ việc làm tốt", icon: "⭐", level: 3 },
  { term: "Ác", def: "Hành động xuất phát từ tham, sân, si", icon: "💀", level: 3 },
  { term: "Thiện", def: "Hành động xuất phát từ từ bi và trí tuệ", icon: "😇", level: 3 },
  { term: "Nhân quả", def: "Mọi hành động đều đưa đến kết quả tương ứng", icon: "🔗", level: 3 },
  { term: "Trung đạo", def: "Con đường tránh xa hai cực đoan", icon: "☸️", level: 3 },
  { term: "Buông xả", def: "Không bám víu, không chống đối, để mọi thứ tự nhiên", icon: "🍂", level: 3 },
  { term: "An trú", def: "Sống trọn vẹn trong giây phút hiện tại", icon: "🏡", level: 3 },
  // Level 4-5
  { term: "Micro-practice", def: "Bài tập 60 giây áp dụng chánh niệm vào đời sống", icon: "⚡", level: 4 },
  { term: "Sám hối", def: "Nhìn lại lỗi lầm với tâm tha thứ và học hỏi", icon: "🕯️", level: 4 },
  { term: "Tùy hỷ", def: "Hoan hỷ với điều tốt mình và người đã làm", icon: "🌟", level: 4 },
  { term: "Hồi hướng", def: "Chia sẻ năng lượng tích cực đến mọi người", icon: "🎐", level: 4 },
  { term: "Phụng sự", def: "Làm việc tốt mà không mong cầu đền đáp", icon: "🤲", level: 4 },
  { term: "Khiêm hạ", def: "Nhận ra mình chỉ là một phần của tổng thể", icon: "🌱", level: 4 },
  { term: "Nhẫn nhục", def: "Giữ tâm bình thản trước nghịch cảnh", icon: "🪨", level: 4 },
  { term: "Tinh tấn", def: "Nỗ lực không ngừng trong thực hành chuyển hóa", icon: "🔥", level: 4 },
  { term: "Chân thành", def: "Sống đúng với những gì mình nghĩ và nói", icon: "💎", level: 5 },
  { term: "Lắng nghe", def: "Mở lòng đón nhận mà không phán xét", icon: "👂", level: 5 },
  { term: "Đồng cảm", def: "Cảm nhận niềm vui và nỗi đau của người khác", icon: "💗", level: 5 },
  { term: "Sẻ chia", def: "Cho đi những gì mình có mà không giữ lại", icon: "🤝", level: 5 },
  { term: "Lợi tha", def: "Hành động vì lợi ích của người khác", icon: "🌈", level: 5 },
  { term: "Tự giác", def: "Tự mình thấy ra vấn đề mà không cần ai nhắc", icon: "🔔", level: 5 },
  { term: "Giác ngộ", def: "Thấy rõ bản chất thật của thực tại", icon: "🪷", level: 5 },
  { term: "Giải thoát", def: "Tự do khỏi mọi ràng buộc của tâm", icon: "🕊️", level: 5 },
  // Level 6-7
  { term: "THẤY", def: "Nhìn rõ bản thân, quan sát thực tại không phán xét", icon: "👁️", level: 6 },
  { term: "HIỂU", def: "Hiểu nguyên nhân gốc rễ của khổ đau", icon: "💡", level: 6 },
  { term: "SỐNG", def: "Biến hiểu biết thành thực hành mỗi ngày", icon: "🌟", level: 6 },
  { term: "LAN TỎA", def: "Chia sẻ giá trị với cộng đồng một cách tự nhiên", icon: "🌊", level: 6 },
  { term: "Bậc thầy nhập thế", def: "Người sống tỉnh thức giữa đời thường", icon: "👑", level: 6 },
  { term: "Dẫn dắt", def: "Đi trước mở đường, truyền cảm hứng cho người sau", icon: "🧭", level: 6 },
  { term: "Khai tâm", def: "Giúp người khác mở lòng đón nhận chân lý", icon: "🔑", level: 6 },
  { term: "Truyền thừa", def: "Trao truyền tri thức và kinh nghiệm cho thế hệ sau", icon: "📜", level: 6 },
  { term: "Phản tỉnh", def: "Tự vấn bản thân để không ngừng hoàn thiện", icon: "🪞", level: 7 },
  { term: "Vô trụ", def: "Không dừng lại ở bất kỳ thành tựu nào", icon: "🌊", level: 7 },
  { term: "Tùy duyên", def: "Ứng xử linh hoạt theo hoàn cảnh, không cố chấp", icon: "🎋", level: 7 },
  { term: "Bất động", def: "Tâm không lay chuyển trước 8 ngọn gió đời", icon: "🏔️", level: 7 },
  { term: "Bát chánh đạo", def: "8 con đường đưa đến giải thoát và an vui", icon: "☸️", level: 7 },
  { term: "Tứ diệu đế", def: "4 chân lý về khổ và con đường thoát khổ", icon: "📖", level: 7 },
  { term: "Thất giác chi", def: "7 yếu tố của sự giác ngộ", icon: "✨", level: 7 },
  { term: "Niết bàn", def: "Trạng thái tịch tịnh tuyệt đối, không còn khổ đau", icon: "🌌", level: 7 },
];

const LEVEL_GRADIENTS: Record<number, { bg: string; glow: string }> = {
  1: { bg: "from-violet-500/20 via-purple-500/10 to-fuchsia-500/20", glow: "shadow-violet-500/20" },
  2: { bg: "from-blue-500/20 via-cyan-500/10 to-teal-500/20", glow: "shadow-blue-500/20" },
  3: { bg: "from-emerald-500/20 via-green-500/10 to-teal-500/20", glow: "shadow-emerald-500/20" },
  4: { bg: "from-yellow-500/20 via-amber-500/10 to-orange-500/20", glow: "shadow-amber-500/20" },
  5: { bg: "from-pink-500/20 via-rose-500/10 to-red-500/20", glow: "shadow-pink-500/20" },
  6: { bg: "from-indigo-500/20 via-purple-500/10 to-violet-500/20", glow: "shadow-indigo-500/20" },
  7: { bg: "from-amber-500/20 via-yellow-500/10 to-orange-500/20", glow: "shadow-amber-500/20" },
};

export default function CardCollectionPage() {
  const [userN, setUserN] = useState(0);
  const [activeLevel, setActiveLevel] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase.from("documents")
          .select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("file_type", "journal");
        setUserN((count ?? 0) * 10);
      } catch {}
    })();
  }, []);

  const getLevel = (n: number) => {
    const t = [0, 100, 300, 600, 1000, 1500, 2500];
    for (let i = t.length - 1; i >= 0; i--) if (n >= t[i]) return i + 1;
    return 1;
  };

  const userLevel = getLevel(userN);
  const filteredCards = ALL_CARDS.filter((c) => c.level === activeLevel);
  const unlocked = activeLevel <= userLevel;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">64 Thẻ chuyển hóa</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Bộ sưu tập khái niệm từ 7 cấp độ, từ Người mới đến Master Mentor</p>
          </div>
        </div>
        <Link href="/app/game"
          className="inline-flex items-center justify-center gap-1.5 bg-primary px-4 py-2.5 rounded-lg text-sm text-primary-foreground hover:bg-primary/80 transition-colors sm:w-auto"
        >
          🎮 Chơi game
        </Link>
      </div>

      {/* Level tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {LEVELS.map((l) => {
          const isActive = l.id === activeLevel;
          const isUnlocked = l.id <= userLevel;
          return (
            <button key={l.id} onClick={() => setActiveLevel(l.id)}
              className={`shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isUnlocked
                    ? "bg-card border border-border hover:border-primary/30 text-foreground"
                    : "bg-muted/20 text-muted-foreground opacity-60"
              }`}
            >
              {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              Lv.{l.id} {l.name}
            </button>
          );
        })}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredCards.map((card, idx) => {
          const isUnlocked = card.level <= userLevel;
          const grad = LEVEL_GRADIENTS[card.level] || LEVEL_GRADIENTS[1];
          return (
            <div key={card.term}
              className={`group relative rounded-xl border p-4 transition-all duration-300 animate-fade-in-up ${
                isUnlocked
                  ? `bg-gradient-to-br ${grad.bg} border-border/60 hover:border-transparent hover:shadow-lg ${grad.glow} hover:-translate-y-1 hover:scale-[1.02]`
                  : "bg-card/30 border-border/20 opacity-50"
              }`}
              style={{ animationDelay: `${idx * 40}ms`, animationFillMode: "both" }}
            >
              {/* Glow effect on hover */}
              {isUnlocked && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              )}
              <div className="text-3xl mb-2 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">{card.icon}</div>
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">{card.term}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{card.def}</p>
              <div className="flex items-center gap-1 mt-2">
                {isUnlocked ? (
                  <span className="text-[10px] text-green-400/70">✓ Đã mở khóa</span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">🔒 Cần Lv.{card.level}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
        <Sparkles className="w-5 h-5 inline text-primary mr-1" />
        Đã mở khóa {ALL_CARDS.filter((c) => c.level <= userLevel).length}/64 thẻ · {userN} N · Level {userLevel}
      </div>
    </div>
  );
}
