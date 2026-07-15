'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/* ─── Data ─── */
const PHASES = [
  { label: 'Giai đoạn 1', tiers: 'Tầng 1 → 3', desc: 'TỈNH DẬY — Từ ngủ đến biết mình đang ngủ', stat: '~83-102% tích lũy' },
  { label: 'Giai đoạn 2', tiers: 'Tầng 4 → 5', desc: 'LÀM CHỦ — Từ biết đến sống được điều mình biết', stat: '~2-4% nhân loại' },
  { label: 'Giai đoạn 3', tiers: 'Tầng 6 → 7', desc: 'GIẢI THOÁT — Từ "tôi" đến tự do tuyệt đối', stat: 'Cực hiếm — vài người/thế hệ' },
];

const TIERS = [
  {
    n: 1, name: 'Ngủ Mê', en: 'The Sleeper', keyword: 'MÊ',
    color: '#a0745a', colorBg: 'rgba(160,116,90,0.08)', pop: 65, popLabel: '~60-70%',
    desc: 'Sống hoàn toàn bằng phản xạ. Bị dẫn dắt bởi bản năng, sợ hãi, ham muốn mà không hề hay biết. Tin mình đang tỉnh, nhưng thực chất chỉ đang chạy những chương trình được cài sẵn.',
    keys: ['Đổ lỗi cho hoàn cảnh, người khác, số phận', 'Lặp đi lặp lại cùng vấn đề mà không thấy pattern', 'Sống theo đám đông mà tưởng là chọn lựa cá nhân', 'Câu cửa miệng: "Tại vì..." và "Không còn cách nào khác"'],
    chiaKhoa: { title: 'ĐAU', desc: 'Không ai tỉnh dậy khi đang thoải mái. Cú sốc, mất mát, hoặc sự trống rỗng không thể lấp đầy — đó là tiếng chuông báo thức.' },
    story: { title: 'Ông giám đốc "ổn mà"', text: '45 tuổi, thành công theo chuẩn xã hội: xe đẹp, nhà to. Mỗi tối uống rượu. Cãi nhau cùng một chuyện 10 năm. Anh không đau khổ rõ ràng. Anh chỉ đang... không sống. Nhưng anh không biết mình không biết.' },
  },
  {
    n: 2, name: 'Thức Tỉnh', en: 'The Awakener', keyword: 'NGỜ',
    color: '#c49a2a', colorBg: 'rgba(196,154,42,0.08)', pop: 18, popLabel: '~15-20%',
    desc: 'Bắt đầu nghi ngờ. Nhận ra "mình đang lặp lại cái gì đó" nhưng chưa biết thoát. Có những khoảnh khắc tỉnh. Đây là tầng khủng hoảng lành mạnh.',
    keys: ['"Sống kiểu này để làm gì?" xuất hiện và không biến mất', 'Những thứ từng thỏa mãn bỗng nhạt nhẽo', 'Chịu không nổi sự giả tạo, kể cả của chính mình', 'Bất an không rõ nguồn gốc'],
    chiaKhoa: { title: 'CHẤP NHẬN KHÔNG BIẾT', desc: 'Không vội tìm câu trả lời mới. Chịu được trạng thái lơ lửng. Dám ở trong khoảng trống mà không bấu víu.' },
    story: { title: 'Buổi sáng thứ Hai', text: '28 tuổi, đang lên chức. Một buổi sáng ngồi trong xe đi làm, bỗng khóc không lý do. "Mình đang sống cuộc đời của ai?" Đây không phải bệnh. Đây là lần đầu tiên thật sự cảm nhận.' },
  },
  {
    n: 3, name: 'Tìm Đường', en: 'The Seeker', keyword: 'KHÁT',
    color: '#d4a017', colorBg: 'rgba(212,160,23,0.08)', pop: 10, popLabel: '~8-12%',
    desc: 'Chủ động đi tìm: đọc sách, học hỏi, thiền, trị liệu. Có năng lượng mạnh nhưng dễ lạc. Nguy cơ: tích lũy kiến thức mà không chuyển hóa thật sự.',
    keys: ['Nói nhiều hơn sống — biết lý thuyết nhưng vẫn phản ứng cũ', 'Nhảy từ phương pháp này sang phương pháp khác', 'Dùng ngôn ngữ tâm linh để tránh cảm xúc thật', 'Tủ sách đầy nhưng đời vẫn rối'],
    chiaKhoa: { title: 'THỰC HÀNH, KHÔNG PHẢI KIẾN THỨC', desc: 'Dừng tìm thêm. Chọn một con đường và đi sâu. Bài test: khi tức giận, tất cả sách đã đọc có giúp gì không?' },
    story: { title: 'Developer 200 cuốn sách', text: '32 tuổi. Đọc Eckhart Tolle, Vipassana, Stoicism, NLP, Human Design. Nói vanh vách về "ego." Nhưng khi bị tổn thương — vẫn cold war 3 ngày. Cơ thể vẫn nắm chặt.' },
  },
  {
    n: 4, name: 'Làm Chủ', en: 'The Owner', keyword: 'CHỦ',
    color: '#3a8a42', colorBg: 'rgba(58,138,66,0.08)', pop: 3, popLabel: '~2-4%',
    desc: 'Dừng đổ lỗi hoàn toàn. Nhận trách nhiệm 100% về trải nghiệm sống. "Dù chuyện gì xảy ra, phản ứng của tôi là của tôi." Thấy rõ và tháo gỡ khuôn mẫu vô thức.',
    keys: ['Có khoảng trống giữa kích thích và phản ứng', '"Tôi đang cảm thấy..." thay vì "Nó khiến tôi..."', 'Dám nhìn bóng tối mà không chạy, không tô hồng', 'Ít drama, ít cần validation, ít giải thích'],
    chiaKhoa: { title: 'BUÔNG CÁI TÔI "ĐANG TU"', desc: 'Nguy hiểm nhất: xây bản ngã mới — "người-đã-giác-ngộ." Phải buông luôn cái tôi tâm linh, buông cả người-đang-làm-chủ.' },
    story: { title: 'Quản lý "trigger mapping"', text: '42 tuổi. Mỗi khi bị trigger, dừng 10 giây hỏi "cái gì trong mình đang bị chạm?" Phát hiện: cảm giác bị coi thường — giống y hệt khi ba phớt lờ hồi nhỏ. Khi thấy rõ gốc, phản ứng tự thay đổi.' },
  },
  {
    n: 5, name: 'Dòng Chảy', en: 'The Creator', keyword: 'TẠO',
    color: '#2868a8', colorBg: 'rgba(40,104,168,0.08)', pop: 1.5, popLabel: 'Hiếm',
    desc: 'Không còn phản ứng với đời, mà chủ động kiến tạo. Sống từ bên trong ra. Nghĩ-nói-làm đồng nhất. Có sức mạnh tĩnh lặng, không gồng mà mạnh.',
    keys: ['Sống trong flow nhiều hơn nỗ lực gượng ép', 'Lời ít nhưng có trọng lượng', 'Không chiến đấu với thực tại, hợp tác với nó', 'Tự nhiên thu hút người khác mà không cố gắng'],
    chiaKhoa: { title: 'XÓA RANH GIỚI "TÔI"', desc: 'Vẫn còn một "tôi" tinh tế: người-sáng-tạo-cuộc-đời-mình. Phải thấy: ngay cả "người sáng tạo" cũng là khái niệm. Có "ai" không?' },
    story: { title: 'Bà chủ quán cơm', text: '55 tuổi, bán cơm ở hẻm nhỏ Sài Gòn. Không thiền, không sách. Nhưng mỗi phần cơm đều có tình. "Ăn cơm bà Tư xong thấy nhẹ lòng." Bà sống từ bên trong ra mà không biết mình đang sống ở tầng cao.' },
  },
  {
    n: 6, name: 'Hòa Nhập', en: 'The Connected', keyword: 'HÒA',
    color: '#7a30a0', colorBg: 'rgba(122,48,160,0.08)', pop: 0.5, popLabel: 'Cực hiếm',
    desc: 'Ranh giới "tôi" và "thế giới" tan. Từ bi không cần nỗ lực, nó tự chảy. Phụng sự như tay phải giúp tay trái. Cảnh giới Bồ Tát: giác ngộ giữa chợ đời.',
    keys: ['Đau của người khác là đau thật, không cần lý do', 'Hiện diện mà không cần sửa, không cần cứu', 'Bình an không phụ thuộc điều kiện bên ngoài', 'Cho mà không đếm, nhận mà không mắc nợ'],
    chiaKhoa: { title: 'BUÔNG LUÔN "SỰ HÒA NHẤT"', desc: 'Còn thấy mình đang hòa nhất là còn một người đang hòa nhất. Còn ở trong tam giới, dù là cõi cao nhất. Phải buông nốt cái thấy cuối cùng.' },
    story: { title: 'Thích Nhất Hạnh', text: 'Trong chiến tranh VN, chọn "đứng giữa" — bị cả hai bên ghét. Rửa bát như thiền, đi bộ như cầu nguyện. Sự hiện diện như nhau với bất kỳ ai: từ tổng thống đến đứa trẻ.' },
  },
  {
    n: 7, name: 'Giải Thoát', en: 'The Liberated', keyword: 'THOÁT',
    color: '#c8a45c', colorBg: 'rgba(200,164,92,0.1)', pop: 0, popLabel: 'Vài người/thế hệ',
    desc: 'Vượt khỏi tam giới. Không còn luân hồi. Sự chấm dứt hoàn toàn mọi trạng thái, mọi tạo tác, mọi điều kiện. Niết Bàn: vượt ngoài mọi khái niệm đối đãi.',
    keys: ['Không thể nhận diện bằng ngôn ngữ', 'Chỉ nói bằng phủ định: không sinh, không diệt', 'Không đến, không đi, không một, không khác'],
    chiaKhoa: { title: 'Không còn chìa khóa', desc: 'Không còn cửa. Không còn người đi qua cửa. Chính cái thấy "không còn gì phải vượt qua" đó, cũng phải biến mất.', isFinal: true },
    story: { title: 'Đức Phật sau Bồ Đề', text: '49 ngày dưới cây Bồ Đề, không "đạt được" gì. Thấy rõ: chưa bao giờ có gì cần đạt. "Lạ thay, tất cả chúng sinh đều đã giác ngộ từ xưa, chỉ vì vọng tưởng mà không nhận ra."' },
  },
];

const NOTES = [
  { icon: '⟐', title: 'Không tuyến tính', desc: 'Bạn có thể ở tầng 5 trong công việc, tầng 2 trong tình yêu, tầng 1 khi tức giận. Các tầng co giãn, xoay vòng, đan xen.' },
  { icon: '⟐', title: 'Không có đích cuối', desc: 'Bản đồ không phải lãnh thổ. Cái nguy hiểm nhất là biến "tầng 7" thành mục tiêu mới cho cái tôi.' },
  { icon: '⟐', title: 'Mỗi tầng đều tin mình đã hiểu', desc: 'Người ngủ tin mình tỉnh. Người tìm kiếm tin mình đã thực hành. Dấu hiệu tiến hóa: bớt cần khẳng định mình ở tầng nào.' },
  { icon: '⟐', title: 'Dấu hiệu thật sự', desc: 'Bớt drama. Bớt cần chứng minh. Bớt sợ. Nhiều im lặng hơn. Nhiều cười hơn. Đơn giản hơn.' },
];

/* ─── Panel: description side (tên tầng + desc + keys + pop bar) ─── */
function DescPanel({ tier, align }: { tier: typeof TIERS[number]; align: 'left' | 'right' }) {
  return (
    <div className={`py-5 ${align === 'right' ? 'text-right pr-6' : 'text-left pl-6'}`}>
      <div className="text-[10px] tracking-[3px] uppercase font-semibold mb-0.5" style={{ color: tier.color }}>
        Tầng {tier.n}
      </div>
      <h3 className="text-2xl md:text-3xl font-light text-foreground leading-tight mb-0.5">{tier.name}</h3>
      <p className="text-sm text-muted-foreground/60 italic mb-3">{tier.en}</p>

      <div className={`flex items-center gap-2 mb-4 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <span
          className="text-[10px] font-semibold tracking-[2px] uppercase px-3 py-1 rounded-full"
          style={{ color: tier.color, background: tier.colorBg, border: `1px solid ${tier.color}26` }}
        >
          ◆ {tier.keyword}
        </span>
        <span className="text-xs text-muted-foreground">{tier.popLabel}</span>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tier.desc}</p>

      {/* Population bar */}
      <div className={`flex items-center gap-3 mb-4 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden max-w-[200px]">
          <div className="h-full rounded-full" style={{ width: `${tier.pop}%`, background: tier.color }} />
        </div>
      </div>

      {/* Keys */}
      <div className="text-[10px] tracking-[2px] uppercase font-semibold mb-2 text-muted-foreground">Dấu hiệu</div>
      <ul className={`space-y-1.5 ${align === 'right' ? 'ml-auto' : ''}`} style={{ maxWidth: 360 }}>
        {tier.keys.map((k, i) => (
          <li key={i} className={`text-sm text-muted-foreground/80 flex items-start gap-2 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: tier.color }} />
            {k}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─── Panel: action side (chìa khóa + story) ─── */
function ActionPanel({ tier, align }: { tier: typeof TIERS[number]; align: 'left' | 'right' }) {
  return (
    <div className={`py-5 space-y-4 ${align === 'right' ? 'text-right pr-6' : 'text-left pl-6'}`}>
      {/* Chìa khóa */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: tier.colorBg,
          borderLeft: align === 'left' ? `2px solid ${tier.color}` : undefined,
          borderRight: align === 'right' ? `2px solid ${tier.color}` : undefined,
        }}
      >
        <div className="text-[10px] tracking-[2px] uppercase font-semibold mb-1.5" style={{ color: tier.color }}>
          🔑 Chìa khóa
        </div>
        {tier.chiaKhoa.isFinal ? (
          <p className="text-sm text-muted-foreground italic leading-relaxed">{tier.chiaKhoa.desc}</p>
        ) : (
          <>
            <p className="text-base font-semibold text-foreground mb-1">{tier.chiaKhoa.title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{tier.chiaKhoa.desc}</p>
          </>
        )}
      </div>

      {/* Story */}
      <div className="p-4 rounded-xl bg-card/50 border border-border/30">
        <h4 className="text-base font-medium text-foreground mb-2">{tier.story.title}</h4>
        <p className="text-sm text-muted-foreground/70 leading-relaxed italic">
          &ldquo;{tier.story.text}&rdquo;
        </p>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function SevenTiersPage() {
  const lineColors = TIERS.map(t => t.color).join(', ');

  return (
    <div className="page-shell page-shell-wide space-y-8">
      {/* Inline styles for the timeline (Tailwind can't do gradient line) */}
      <style>{`
        :root {
          --t1: #a0745a; --t1-bg: rgba(160,116,90,0.08);
          --t2: #c49a2a; --t2-bg: rgba(196,154,42,0.08);
          --t3: #d4a017; --t3-bg: rgba(212,160,23,0.08);
          --t4: #3a8a42; --t4-bg: rgba(58,138,66,0.08);
          --t5: #2868a8; --t5-bg: rgba(40,104,168,0.08);
          --t6: #7a30a0; --t6-bg: rgba(122,48,160,0.08);
          --t7: #c8a45c; --t7-bg: rgba(200,164,92,0.1);
        }
        .tier-journey { position: relative; }
        .tier-journey::before {
          content: '';
          position: absolute;
          left: 50%; top: 0; bottom: 0;
          width: 2px;
          transform: translateX(-50%);
          background: linear-gradient(to bottom,
            transparent 0%,
            #a0745a 5%, #c49a2a 20%, #d4a017 35%,
            #3a8a42 50%, #2868a8 65%, #7a30a0 80%,
            #c8a45c 95%, transparent 100%);
          opacity: 0.3;
        }
        @media (max-width: 768px) {
          .tier-journey::before { display: none; }
        }
      `}</style>

      {/* Back nav */}
      <Link
        href="/app/the-chuyen-hoa"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Thẻ chuyển hóa
      </Link>

      {/* Header */}
      <div className="text-center space-y-3 pb-6 border-b border-border">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          7 Tầng <span className="text-gradient-gold">Chuyển Hóa</span> Con Người
        </h1>
        <p className="text-lg text-muted-foreground/70 italic">Ta là ai? Ta đi về đâu?</p>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Tổng hợp từ triết học Phật giáo, Lão giáo, Tây phương và tâm lý học hiện đại.
          Viết bằng ngôn ngữ đương đại, dành cho người đang sống, đang hỏi, đang tìm.
        </p>
        <span className="inline-block text-[10px] tracking-[2px] uppercase text-muted-foreground/50 px-3 py-1 border border-border rounded-full">
          Tài liệu Workshop
        </span>
      </div>

      {/* Overview phases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PHASES.map((p) => (
          <div key={p.label} className="p-5 rounded-xl bg-card/60 border border-border/50 text-center">
            <div className="text-[10px] tracking-[3px] uppercase font-semibold text-primary mb-1">{p.label}</div>
            <div className="text-lg font-medium text-foreground mb-1">{p.tiers}</div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{p.desc}</p>
            <div className="text-[11px] text-primary/70 font-medium">{p.stat}</div>
          </div>
        ))}
      </div>

      {/* ─── 7 Tiers Timeline ─── */}
      <div className="tier-journey">
        {TIERS.map((tier) => {
          const isOdd = tier.n % 2 !== 0; // odd = desc left, action right
          return (
            <div
              key={tier.n}
              className="grid grid-cols-1 md:grid-cols-[1fr_48px_1fr] min-h-[260px] relative"
              id={`tier-${tier.n}`}
            >
              {/* ── Desktop layout ── */}
              {/* Left column */}
              <div className="hidden md:block">
                {isOdd ? <DescPanel tier={tier} align="right" /> : <ActionPanel tier={tier} align="right" />}
              </div>

              {/* Center column — number dot + connector */}
              <div className="hidden md:flex flex-col items-center pt-6 relative z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 bg-background"
                  style={{ borderColor: tier.color, color: tier.color }}
                >
                  {tier.n}
                </div>
                <div className="w-px flex-1 min-h-[20px]" />
              </div>

              {/* Right column */}
              <div className="hidden md:block">
                {isOdd ? <ActionPanel tier={tier} align="left" /> : <DescPanel tier={tier} align="left" />}
              </div>

              {/* ── Mobile layout ── */}
              <div className="md:hidden flex gap-3">
                {/* Dot */}
                <div className="flex flex-col items-center shrink-0 pt-5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 bg-background"
                    style={{ borderColor: tier.color, color: tier.color }}
                  >
                    {tier.n}
                  </div>
                  {tier.n < 7 && <div className="w-px flex-1 min-h-[16px] mt-1" style={{ background: `${tier.color}30` }} />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-3 pb-4">
                  <div>
                    <div className="text-[10px] tracking-[3px] uppercase font-semibold" style={{ color: tier.color }}>Tầng {tier.n}</div>
                    <h3 className="text-xl font-light text-foreground leading-tight">{tier.name}</h3>
                    <p className="text-xs text-muted-foreground/60 italic">{tier.en}</p>
                    <span
                      className="inline-block text-[10px] font-semibold tracking-[2px] uppercase px-2 py-0.5 rounded-full mt-1.5"
                      style={{ color: tier.color, background: tier.colorBg }}
                    >
                      ◆ {tier.keyword} · {tier.popLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tier.desc}</p>
                  <ul className="space-y-1">
                    {tier.keys.map((k, i) => (
                      <li key={i} className="text-xs text-muted-foreground/80 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: tier.color }} />
                        {k}
                      </li>
                    ))}
                  </ul>
                  <div className="p-3 rounded-lg" style={{ background: tier.colorBg, borderLeft: `2px solid ${tier.color}` }}>
                    <div className="text-[10px] tracking-[2px] uppercase font-semibold mb-1" style={{ color: tier.color }}>🔑 {tier.chiaKhoa.isFinal ? tier.chiaKhoa.desc : tier.chiaKhoa.title}</div>
                    {!tier.chiaKhoa.isFinal && <p className="text-xs text-muted-foreground leading-relaxed">{tier.chiaKhoa.desc}</p>}
                  </div>
                  <div className="p-3 rounded-lg bg-card/50 border border-border/30">
                    <h4 className="text-sm font-medium text-foreground mb-1">{tier.story.title}</h4>
                    <p className="text-xs text-muted-foreground/70 leading-relaxed italic">&ldquo;{tier.story.text}&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      <div className="pt-8 border-t border-border">
        <h2 className="text-2xl font-light text-center text-foreground mb-6">Những điều cần nhớ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {NOTES.map((note) => (
            <div key={note.title} className="p-5 rounded-xl bg-card/60 border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                <span className="text-base">{note.icon}</span>
                {note.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{note.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-card/60 border border-border/50 border-l-[3px] border-l-amber-800">
          <blockquote className="text-base font-light italic text-foreground leading-relaxed mb-2">
            &ldquo;Lạ thay, tất cả chúng sinh đều đã giác ngộ từ xưa, chỉ vì vọng tưởng mà không nhận ra.&rdquo;
          </blockquote>
          <cite className="text-xs text-muted-foreground not-italic">— Đức Phật Siddhartha</cite>
        </div>
        <div className="p-6 rounded-xl bg-card/60 border border-border/50 border-l-[3px] border-l-amber-800">
          <blockquote className="text-base font-light italic text-foreground leading-relaxed mb-2">
            &ldquo;Ưng vô sở trụ nhi sanh kỳ tâm — Không trụ vào đâu mà sinh tâm.&rdquo;
          </blockquote>
          <cite className="text-xs text-muted-foreground not-italic">— Kinh Kim Cang · Tổ Huệ Năng</cite>
        </div>
      </div>

      {/* Signature */}
      <div className="text-center py-8 border-t border-border">
        <blockquote className="text-2xl font-light italic text-foreground mb-3">
          &ldquo;Không sinh, không diệt, không đến, không đi.&rdquo;
        </blockquote>
        <div className="w-12 h-px bg-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground tracking-wide">Bát Nhã Tâm Kinh</p>
      </div>

      {/* Nav back */}
      <div className="text-center">
        <Link
          href="/app/the-chuyen-hoa"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          <ArrowLeft size={14} />
          Quay lại Thẻ chuyển hóa
        </Link>
      </div>
    </div>
  );
}
