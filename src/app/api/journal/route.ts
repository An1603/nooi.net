import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { than, tam, hanh } = body;

    if (!than && !tam && !hanh) {
      return NextResponse.json({ error: "Ít nhất một trường (thân/tâm/hành)" }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0]; // 2026-07-06

    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: `Nhật ký ${today}`,
        content: JSON.stringify({ than, tam, hanh }),
        file_type: "journal",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, message: "Đã lưu nhật ký" });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("documents")
      .select("id, title, content, created_at")
      .eq("user_id", user.id)
      .eq("file_type", "journal")
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entries: data });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
