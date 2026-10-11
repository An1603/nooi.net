import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { calculateNumerology } from "@/lib/numerology";
import { calculateTuVi } from "@/lib/tuvi";
import { calculateAstrology } from "@/lib/astrology";
import type { NumerologyResult } from "@/lib/numerology";
import type { TuViResult } from "@/lib/tuvi";
import type { AstrologyResult } from "@/lib/astrology";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Toạ độ mặc định Hà Nội khi hồ sơ chưa có nơi sinh.
const DEFAULT_LAT = 21.0285;
const DEFAULT_LON = 105.8542;

// GET /api/ekid/kids/[kidId]/destiny — tính ba bản đồ số mệnh của một hồ sơ trẻ:
//   1. Thần số học (numerology, đồng bộ)
//   2. Tử Vi (tuvi, đồng bộ)
//   3. Chiêm tinh phương Tây (astrology, bất đồng bộ)
// Quyền: OWNER (user_id = auth.uid()) HOẶC caregiver đã liên kết (status='linked',
// bất kể permission admin/viewer). Không có quyền → 403.
// Kết quả trả `kid` (trường cần thiết) + `missing` (dữ liệu còn thiếu) và từng bản
// đồ tính được; mỗi bản đồ tính trong try/catch riêng nên 1 lỗi không chặn 2 còn lại.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kidId: string }> },
) {
  const { kidId } = await params;
  if (!UUID_RE.test(kidId)) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const admin = createAdminClient();

  // Resolve hồ sơ bằng client quản trị (vượt RLS) rồi tự phân quyền thủ công.
  const { data: kid, error } = await admin
    .from("ekid_kids")
    .select("id, name, date_of_birth, birth_time, gender, birth_place, user_id")
    .eq("id", kidId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!kid) return NextResponse.json({ error: "Không tìm thấy hồ sơ" }, { status: 404 });

  // Phân quyền: OWNER hoặc caregiver 'linked' bất kể permission.
  const isOwner = kid.user_id === user.id;
  let isCaregiver = false;
  if (!isOwner) {
    const { data: link } = await admin
      .from("ekid_caregivers")
      .select("id")
      .eq("kid_id", kidId)
      .eq("caregiver_user_id", user.id)
      .eq("status", "linked")
      .maybeSingle();
    isCaregiver = !!link;
  }
  if (!isOwner && !isCaregiver) {
    return NextResponse.json({ error: "Không có quyền xem hồ sơ này" }, { status: 403 });
  }

  // ── Parse thông tin sinh ──
  const fullName: string = typeof kid.name === "string" ? kid.name : "";
  const dateOfBirth: string =
    typeof kid.date_of_birth === "string" ? kid.date_of_birth : "";
  const birthTime: string | null =
    typeof kid.birth_time === "string" ? kid.birth_time : null;
  const gender: string | null = typeof kid.gender === "string" ? kid.gender : null;
  const birthPlace: string | null =
    typeof kid.birth_place === "string" ? kid.birth_place : null;

  const gioSinh = birthTime ? parseInt(birthTime.slice(0, 2), 10) : 12;
  const phutSinh = birthTime ? parseInt(birthTime.slice(3, 5), 10) : 0;
  const gioiTinh: "nam" | "nu" = gender === "nu" ? "nu" : "nam";
  const noiSinh = birthPlace ?? undefined;
  const viDo = DEFAULT_LAT;
  const kinhDo = DEFAULT_LON;

  // ── Tính ba bản đồ, mỗi bản trong try/catch riêng ──
  let numerology: NumerologyResult | null = null;
  let tuvi: TuViResult | null = null;
  let astrology: AstrologyResult | null = null;

  try {
    numerology = calculateNumerology({ fullName, dateOfBirth });
  } catch (err) {
    console.error("ekid destiny: không tính được thần số học", err);
  }

  try {
    tuvi = calculateTuVi({ fullName, ngaySinh: dateOfBirth, gioSinh, gioiTinh });
  } catch (err) {
    console.error("ekid destiny: không tính được tử vi", err);
  }

  try {
    astrology = await calculateAstrology({
      fullName,
      ngaySinh: dateOfBirth,
      gioSinh,
      gioiTinh,
      phutSinh,
      noiSinh,
      viDo,
      kinhDo,
    });
  } catch (err) {
    console.error("ekid destiny: không tính được chiêm tinh", err);
  }

  return NextResponse.json({
    kid: {
      name: kid.name,
      date_of_birth: kid.date_of_birth,
      birth_time: kid.birth_time,
      gender: kid.gender,
      birth_place: kid.birth_place,
    },
    missing: {
      gio_sinh: !birthTime,
      noi_sinh: !birthPlace,
    },
    numerology,
    tuvi,
    astrology,
  });
}