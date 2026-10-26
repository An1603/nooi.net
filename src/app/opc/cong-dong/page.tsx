import { MessagesSquare, Pin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireOpcUser } from "@/lib/opc/auth";
import { NHOM_CONG_DONG } from "@/lib/opc/types";
import { thoiGianTruoc } from "@/lib/opc/format";
import PostForm from "@/components/opc/PostForm";
import CommentForm from "@/components/opc/CommentForm";

export const dynamic = "force-dynamic";

type BaiDang = {
  id: string;
  nguoi_id: string;
  nhom: string;
  tieu_de: string | null;
  noi_dung: string;
  ghim: boolean;
  created_at: string;
};

type BinhLuan = {
  id: string;
  bai_dang_id: string;
  nguoi_id: string;
  noi_dung: string;
  created_at: string;
};

const NHOM_LABEL: Record<string, string> = Object.fromEntries(NHOM_CONG_DONG.map((n) => [n.value, n.label]));

export default async function CongDongPage() {
  const { nguoi } = await requireOpcUser();
  const supabase = await createClient();

  const { data: postsData } = await supabase
    .from("opc_bai_dang")
    .select("id, nguoi_id, nhom, tieu_de, noi_dung, ghim, created_at")
    .eq("trang_thai", "hien")
    .order("ghim", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);

  const posts = (postsData || []) as BaiDang[];
  const postIds = posts.map((p) => p.id);

  const { data: commentsData } = postIds.length
    ? await supabase
        .from("opc_binh_luan")
        .select("id, bai_dang_id, nguoi_id, noi_dung, created_at")
        .in("bai_dang_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] as BinhLuan[] };

  const comments = (commentsData || []) as BinhLuan[];

  const tacGiaIds = Array.from(new Set([...posts.map((p) => p.nguoi_id), ...comments.map((c) => c.nguoi_id)]));
  const { data: tacGiaData } = tacGiaIds.length
    ? await supabase.from("opc_nguoi_cong_khai").select("id, ten, vai_tro").in("id", tacGiaIds)
    : { data: [] as { id: string; ten: string | null; vai_tro: string }[] };

  const tenTheoId = new Map(((tacGiaData || []) as { id: string; ten: string | null; vai_tro: string }[]).map((x) => [x.id, x.ten || "Thành viên"]));
  const binhLuanTheoBai = comments.reduce<Record<string, BinhLuan[]>>((acc, c) => {
    (acc[c.bai_dang_id] ||= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#C8943E]">Cộng đồng OPC</p>
        <h1 className="mt-1 text-2xl font-bold text-[#F5EFE6] md:text-3xl">Nơi người làm thật gặp nhau</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#A797B8]">
          Chia sẻ bài học vận hành, hỏi đúng người, mở quan hệ đối tác. Không quảng cáo, không spam.
        </p>
      </header>

      <section className="rounded-2xl border border-[#C8943E]/20 bg-white/[0.03] p-4 md:p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8943E]/15 text-[#E8C07A]">
            <MessagesSquare size={15} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-[#F5EFE6]">Viết bài mới</h2>
            <p className="text-[10px] text-[#8E7CA3]">Ngắn, cụ thể, có thể hành động — tốt hơn dài và chung chung.</p>
          </div>
        </div>
        <PostForm />
      </section>

      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#A797B8]">
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
          <Users size={12} className="text-[#C8943E]" /> {posts.length} bài
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
          <MessagesSquare size={12} className="text-[#C8943E]" /> {comments.length} bình luận
        </span>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">
          Đang xem với tên: {nguoi?.ten || "Thành viên"}
        </span>
      </div>

      <section className="space-y-4">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-14 text-center">
            <MessagesSquare size={32} className="mx-auto text-[#8E7CA3]" />
            <p className="mt-3 text-sm font-semibold text-[#F5EFE6]">Cộng đồng đang chờ bài đầu tiên</p>
            <p className="mt-1 text-xs text-[#A797B8]">Đăng một câu hỏi hoặc một bài học ngắn ở khung phía trên.</p>
          </div>
        ) : (
          posts.map((p) => {
            const bl = binhLuanTheoBai[p.id] || [];
            const ten = tenTheoId.get(p.nguoi_id) || "Thành viên";
            return (
              <article key={p.id} className={`rounded-2xl border bg-white/[0.03] p-4 md:p-5 ${p.ghim ? "border-[#C8943E]/35" : "border-white/10"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C8943E]/20 bg-[#2A1538] text-xs font-bold text-[#E8C07A]">
                      {ten.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-[#F5EFE6]">{ten}</p>
                      <p className="text-[10px] text-[#8E7CA3]">{thoiGianTruoc(p.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {p.ghim ? (
                      <span className="flex items-center gap-1 rounded-full border border-[#C8943E]/30 bg-[#C8943E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#E8C07A]">
                        <Pin size={10} /> Ghim
                      </span>
                    ) : null}
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#A797B8]">
                      {NHOM_LABEL[p.nhom] || p.nhom}
                    </span>
                  </div>
                </div>

                {p.tieu_de ? <h2 className="mt-3 text-base font-bold text-[#F5EFE6]">{p.tieu_de}</h2> : null}
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#C9BBD8]">{p.noi_dung}</p>

                <div className="mt-4 border-t border-white/5 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8E7CA3]">
                    {bl.length} bình luận
                  </p>
                  {bl.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {bl.map((c) => (
                        <li key={c.id} className="rounded-xl bg-white/[0.03] px-3 py-2">
                          <p className="text-[11px] font-semibold text-[#E8C07A]">{tenTheoId.get(c.nguoi_id) || "Thành viên"}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-[#C9BBD8]">{c.noi_dung}</p>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <CommentForm baiDangId={p.id} />
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
