import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET — Lấy danh sách buddy + pending requests
export async function GET(req: NextRequest) {
  try {
    const authClient = createServerClient(SUPABASE_URL, ANON_KEY, {
      cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get my buddy relationships
    const { data: relationships } = await authClient
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("file_type", "buddy_relationship");

    // Get pending requests sent TO me
    const { data: pendingRequests } = await authClient
      .from("documents")
      .select("*")
      .eq("file_type", "buddy_request")
      .eq("title", user.id); // title = target user id

    // Get requests I sent
    const { data: sentRequests } = await authClient
      .from("documents")
      .select("*")
      .eq("user_id", user.id)
      .eq("file_type", "buddy_request");

    // Get profiles for all related users
    const allUserIds = new Set<string>();
    (relationships || []).forEach(r => allUserIds.add(r.title)); // title = buddy_user_id
    (pendingRequests || []).forEach(r => allUserIds.add(r.user_id));
    (sentRequests || []).forEach(r => allUserIds.add(r.title));

    let profiles: Record<string, { full_name: string; user_id: string }> = {};
    if (allUserIds.size > 0) {
      const { data: profs } = await authClient
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", [...allUserIds]);
      if (profs) profiles = Object.fromEntries(profs.map(p => [p.user_id, p]));
    }

    return NextResponse.json({
      buddies: (relationships || []).map(r => ({
        id: r.id,
        buddyId: r.title,
        name: profiles[r.title]?.full_name || "Người dùng",
        since: JSON.parse(r.content || "{}").since,
      })),
      pendingReceived: (pendingRequests || [])
        .filter(r => JSON.parse(r.content || "{}").status === "pending")
        .map(r => ({
          id: r.id,
          fromUserId: r.user_id,
          fromName: profiles[r.user_id]?.full_name || "Người dùng",
          message: JSON.parse(r.content || "{}").message || "",
        })),
      pendingSent: (sentRequests || [])
        .filter(r => JSON.parse(r.content || "{}").status === "pending")
        .map(r => ({
          id: r.id,
          toUserId: r.title,
          toName: profiles[r.title]?.full_name || "Người dùng",
        })),
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST — Gửi yêu cầu buddy / Chấp nhận / Từ chối
export async function POST(req: NextRequest) {
  try {
    const authClient = createServerClient(SUPABASE_URL, ANON_KEY, {
      cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
    });
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action, requestId, targetUserId, message } = body;

    if (action === "send") {
      // Gửi yêu cầu kết bạn
      if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
      if (targetUserId === user.id) return NextResponse.json({ error: "Cannot buddy yourself" }, { status: 400 });

      // Check if already buddies
      const { data: existing } = await authClient
        .from("documents")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_type", "buddy_relationship")
        .eq("title", targetUserId)
        .maybeSingle();
      if (existing) return NextResponse.json({ error: "Already buddies" }, { status: 400 });

      // Check if request already sent
      const { data: alreadySent } = await authClient
        .from("documents")
        .select("id")
        .eq("user_id", user.id)
        .eq("file_type", "buddy_request")
        .eq("title", targetUserId)
        .maybeSingle();
      if (alreadySent) return NextResponse.json({ error: "Request already sent" }, { status: 400 });

      // Create request
      await authClient.from("documents").insert({
        user_id: user.id,
        title: targetUserId,
        file_type: "buddy_request",
        content: JSON.stringify({ status: "pending", message: message || "" }),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "accept" && requestId) {
      // Chấp nhận yêu cầu
      const { data: request } = await authClient
        .from("documents")
        .select("*")
        .eq("id", requestId)
        .eq("title", user.id) // Only I can accept requests sent to me
        .eq("file_type", "buddy_request")
        .maybeSingle();
      if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

      const fromUserId = request.user_id;
      const now = new Date().toISOString();

      // Create buddy relationships (both directions)
      await authClient.from("documents").insert([
        { user_id: user.id, title: fromUserId, file_type: "buddy_relationship", content: JSON.stringify({ since: now }) },
        { user_id: fromUserId, title: user.id, file_type: "buddy_relationship", content: JSON.stringify({ since: now }) },
      ]);

      // Update request status
      await authClient.from("documents").update({
        content: JSON.stringify({ ...JSON.parse(request.content || "{}"), status: "accepted" })
      }).eq("id", requestId);

      return NextResponse.json({ success: true });
    }

    if (action === "reject" && requestId) {
      await authClient.from("documents").update({
        content: JSON.stringify({ status: "rejected" })
      }).eq("id", requestId).eq("title", user.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
