import { ImageResponse } from "@vercel/og";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getProfile(slug: string) {
  const { data } = await supabase
    .rpc("get_public_profile", { slug })
    .maybeSingle();
  return data as {
    full_name: string;
    public_headline: string;
    public_avatar_url: string;
    ref_code: string;
    created_at: string;
  } | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return new Response("Not found", { status: 404 });
  }

  const joined = new Date(profile.created_at).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
  });

  // Initials
  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a0a2e 0%, #16213e 50%, #0f3460 100%)",
          fontFamily: '"Geist Sans", "Inter", sans-serif',
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Avatar */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: profile.public_avatar_url
              ? `url(${profile.public_avatar_url}) center/cover`
              : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(74,222,128,0.3))",
            border: "4px solid rgba(139,92,246,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 8px 32px rgba(139,92,246,0.2)",
          }}
        >
          {!profile.public_avatar_url && (
            <span
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {initials}
            </span>
          )}
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            marginBottom: 12,
            letterSpacing: "-0.02em",
          }}
        >
          {profile.full_name}
        </div>

        {/* Headline */}
        {profile.public_headline && (
          <div
            style={{
              fontSize: 28,
              color: "#fbbf24",
              textAlign: "center",
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            {profile.public_headline}
          </div>
        )}

        {/* Joined + Ref code */}
        <div
          style={{
            fontSize: 20,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <span>Thành viên NOOI từ {joined}</span>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.3)" }} />
          <span>
            Mã giới thiệu: <span style={{ color: "#fbbf24", fontWeight: 600 }}>{profile.ref_code}</span>
          </span>
        </div>

        {/* Brand */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 18,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          NOOI — Kết nối chuyển mình
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}