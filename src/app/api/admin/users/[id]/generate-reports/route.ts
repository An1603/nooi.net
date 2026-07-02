import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  // Auth check: must be admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Get target user's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { date_of_birth, gio_sinh, gioi_tinh, noi_sinh, full_name } = profile;
  if (!date_of_birth || gio_sinh == null) {
    return NextResponse.json({ error: "User lacks birth info (date_of_birth + gio_sinh required)" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  const generated: string[] = [];

  // 1. Numerology
  try {
    const { calculateNumerology } = await import("@/lib/numerology");
    const numerology = calculateNumerology({
      fullName: full_name || "Unknown",
      dateOfBirth: date_of_birth,
    });
    updates.numerology_report = numerology as unknown as Record<string, unknown>;
    generated.push("Thần số học");
  } catch (e) { console.error("Numerology failed:", e); }

  // 2. Tử Vi
  try {
    const { calculateTuVi } = await import("@/lib/tuvi");
    const tuviResult = calculateTuVi({
      fullName: full_name || "Unknown",
      ngaySinh: date_of_birth,
      gioSinh: gio_sinh,
      gioiTinh: gioi_tinh || "nam",
    });
    updates.tuvi_report = tuviResult as unknown as Record<string, unknown>;
    generated.push("Tử Vi");
  } catch (e) { console.error("TuVi failed:", e); }

  // 3. Chiêm tinh
  try {
    const coords = { lat: 21.0285, lng: 105.8542 }; // default Hanoi
    const { calculateAstrology } = await import("@/lib/astrology");
    const astroResult = await calculateAstrology({
      fullName: full_name || "Unknown",
      ngaySinh: date_of_birth,
      gioSinh: gio_sinh,
      gioiTinh: gioi_tinh || "nam",
      noiSinh: noi_sinh || "Hà Nội",
      viDo: coords.lat,
      kinhDo: coords.lng,
    });
    updates.chiem_tinh_report = astroResult as unknown as Record<string, unknown>;
    generated.push("Chiêm tinh");
  } catch (e) { console.error("Astrology failed:", e); }

  if (generated.length === 0) {
    return NextResponse.json({ error: "All calculations failed" }, { status: 500 });
  }

  // Save to database
  updates.onboarding_completed = true;
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ user_id: id, ...updates }, { onConflict: "user_id" });

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return NextResponse.json({ error: "Failed to save reports" }, { status: 500 });
  }

  return NextResponse.json({ success: true, generated });
}
